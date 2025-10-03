# Refined Image Flow with Private URLs & Presigned Uploads

## Overview
This implementation provides:
- ✅ **Signed URLs with 24-hour expiration** (private, user-specific access)
- ✅ **Presigned URL uploads** (client uploads directly to GCS)
- ✅ **Image record updates** (replaces instead of creating new records)
- ✅ **Frontend history tracking** (undo/redo handled client-side)

## Key Changes from Public URL Implementation

| Aspect | Previous (Public) | Current (Private) |
|--------|-------------------|-------------------|
| **URL Type** | Public, permanent | Signed, 24hr expiry |
| **Access Control** | Anyone with URL | Only authenticated user |
| **Upload Method** | Server receives base64 | Client uploads via presigned URL |
| **Image Updates** | Creates new records | Updates existing record |
| **History** | Database tracked | Frontend state only |
| **File Cleanup** | Old files remain | Old files deleted on update |

## Flow 1: Generate New Image

### Step-by-Step
1. **Client**: User enters prompt
2. **Client Service**: `generateImage(prompt)`
3. **Server**: `generateImage()`
   - Calls Gemini API
   - Uploads to GCS root: `{userId}-{timestamp}-{random}.png`
   - **Generates signed URL** (24hr expiry)
   - Creates `Image` record with signed URL
4. **Returns**: `{ imageUrl: signedUrl, imageId }`

### Code Example
```typescript
const result = await generateImage("a beautiful sunset");
// Returns: { 
//   imageUrl: "https://storage.googleapis.com/bucket/user123-1234567890-abc.png?X-Goog-Signature=...",
//   imageId: "uuid-1" 
// }
```

## Flow 2: Upload User Image (with Presigned URL)

### Step-by-Step
1. **Client**: User selects file
2. **Client Service**: `uploadImageToGCS(file)`
   
   **Step 2a**: Request presigned upload URL
   - Calls `generatePresignedUploadUrl({ fileName, mimeType })`
   - Server generates presigned URL (15min expiry)
   - Returns `{ uploadUrl, gcsFileName }`
   
   **Step 2b**: Upload directly to GCS
   - Client uses `fetch(uploadUrl, { method: 'PUT', body: file })`
   - No server processing of file data
   - Fast, efficient upload
   
   **Step 2c**: Confirm upload
   - Calls `confirmImageUpload({ fileName, gcsFileName, mimeType })`
   - Server generates signed read URL (24hr expiry)
   - Creates `Image` record

3. **Returns**: `{ imageUrl: signedUrl, imageId }`

### Code Example
```typescript
const file = new File([blob], 'my-image.png', { type: 'image/png' });
const result = await uploadImageToGCS(file);
// Returns: { 
//   imageUrl: "https://storage.googleapis.com/bucket/user123-1234567890-xyz.png?X-Goog-Signature=...",
//   imageId: "uuid-2" 
// }
```

## Flow 3: Edit Image Region (Multi-Stage Process)

This flow handles regional editing of images with seamless blending.

### Overview
Regional editing involves **two separate Gemini API calls**:
1. **First call**: Edit only the selected region (cropped)
2. **Second call**: Blend the edges for seamless integration

### Step-by-Step Process

#### Stage 1: Crop and Upload Selected Region
1. **Client**: User selects region with brush tool
2. **Client**: Crops the selected region from the original image (client-side canvas)
3. **Client Service**: `uploadImageToGCS(croppedFile)`
   - Uses presigned URL upload (15min expiry)
   - Uploads cropped region temporarily to GCS
   - Returns `{ imageUrl: signedUrl, imageId: croppedImageId }`

#### Stage 2: Edit Cropped Region
1. **Client Service**: `editImageFromGCS(croppedImageId, userPrompt, false)`
2. **Server**: `editImageFromGCS()`
   - Fetches cropped Image record
   - Downloads cropped image from GCS
   - **Deletes old cropped file** (cleanup)
   - Calls Gemini API with cropped image + user prompt
   - **Creative editing mode**: Higher temperature (0.7) and directive system instruction
     * System instruction: "Follow the user instructions precisely and make clear, visible changes to the image as requested. Be creative and transformative while maintaining image quality."
   - Gemini edits ONLY the cropped region with significant, visible changes
   - Uploads edited result to GCS root (new filename)
   - Updates Image record with new URL
   - Generates signed URL (24hr expiry)
3. **Returns**: `{ imageUrl: signedUrl, imageId: croppedImageId }`

#### Stage 3: Composite Result (Client-Side)
1. **Client**: Downloads edited cropped result
2. **Client**: Creates composite canvas:
   - Draws original full image
   - Overlays edited region at correct position
   - This happens **behind the scene** (not sent to server)

#### Stage 4: Mark for Blending
1. **Client**: Analyzes colors around edited region
2. **Client**: Chooses high-contrast border color (dynamic)
3. **Client**: Draws thick border around edited region
4. **Client**: Creates debug view with red border (for user visibility)

#### Stage 5: Upload for Blending
1. **Client**: Converts marked composite to File
2. **Client Service**: `uploadImageToGCS(markedFile, currentImageId?)`
   - Uses presigned URL upload
   - If `currentImageId` exists: Updates existing record
   - If no `currentImageId`: Creates new record
   - Uploads marked image temporarily to GCS
3. **Returns**: `{ imageUrl: signedUrl, imageId: blendImageId }`

#### Stage 6: Blend Edges
1. **Client Service**: `editImageFromGCS(blendImageId, '', true, colorName)`
   - Passes `shouldBlend: true` flag and `borderColor: colorName`
   - **No prompt construction on client side** - server handles blending logic
2. **Server**: `editImageFromGCS()`
   - Fetches marked Image record
   - Downloads marked image from GCS
   - **Deletes old marked file** (cleanup)
   - If `shouldBlend === true`: Constructs generic blending prompt server-side
     * Blend prompt: "Smooth and blend the ${borderColor} border line into the surrounding image. Remove the ${borderColor} line completely while preserving all image content."
     * System instruction: "Ensure to change the cropped image as it is in structure and return the same exact image with the specified modifications."
     * Keep temperature (0.4) always
   - If `shouldBlend === false`: Uses user-provided prompt with creative system instruction
   - Calls Gemini API with appropriate configuration
   - Gemini removes border and blends edges
   - Uploads final seamless result to GCS root
   - Updates Image record with new URL
   - Generates signed URL (24hr expiry)
3. **Returns**: `{ imageUrl: signedUrl, imageId: blendImageId }`
4. **Error Handling**: User-friendly error messages for safety filters, content issues, or complex images

#### Stage 7: Update Frontend History
1. **Client**: Downloads final blended result
2. **Client**: Adds to history array for undo/redo
3. **Client**: Updates UI to show final seamless image

### Code Example
```typescript
// Stage 1: Crop and upload selected region
const croppedFile = cropRegionFromImage(originalImage, selection);
const croppedResult = await uploadImageToGCS(croppedFile);

// Stage 2: Edit the cropped region (no blending)
const editResult = await editImageFromGCS(croppedResult.imageId, "add mountains", false);

// Stage 3: Composite (client-side)
const compositeCanvas = overlayEditedRegion(originalImage, editResult.imageUrl, selection);

// Stage 4 & 5: Mark and upload for blending
const { colorHex, colorName } = getBestContrastColor(compositeCanvas, selection);
drawBorder(compositeCanvas, selection, colorHex);
const markedFile = canvasToFile(compositeCanvas);
const markedResult = await uploadImageToGCS(markedFile, currentImageId);

// Stage 6: Blend edges (server constructs prompt)
const finalResult = await editImageFromGCS(markedResult.imageId, '', true, colorName);

// Stage 7: Add to history
addToHistory(finalResult.imageUrl);
```

### Why Two Gemini API Calls?

| Aspect | Single Call | Two Calls (Current) |
|--------|-------------|---------------------|
| **Prompt Complexity** | Complex combined prompt | Two simple prompts |
| **Success Rate** | Lower (safety filters) | Higher (clear instructions) |
| **Image Size** | Full image processed | Small crop processed |
| **Control** | Less control | Better control |
| **Blending Quality** | Variable | Consistent |

### Temporary Image Management

**Important**: During regional editing, temporary images are created:
- Cropped region image (Stage 1)
- Marked composite image (Stage 5)

These are **automatically cleaned up** by the `editImageFromGCS` operation:
- When editing, the old file is deleted from GCS
- The database record is updated with the new file
- No orphaned files remain

**Note**: The flow.svg diagram specifies that temporary images should be deleted after 24 hours. This is handled by:
1. GCS signed URL expiration (24hr)
2. Automatic cleanup when records are updated
3. Frontend clears history on page refresh (unless persisted to sessionStorage)

## Frontend History Tracking (Undo/Redo)

Since the database **replaces** records instead of creating new ones, the frontend must maintain history:

### Implementation Example
```typescript
interface ImageHistoryState {
  imageUrl: string;
  imageId: string;
  prompt?: string;
  timestamp: number;
}

// In your React component
const [imageHistory, setImageHistory] = useState<ImageHistoryState[]>([]);
const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

// When generating/editing image
const handleImageEdit = async (prompt: string) => {
  const result = await editImageFromGCS(currentImageId, prompt);
  
  // Add to history (remove any "future" states if user went back)
  const newHistory = imageHistory.slice(0, currentHistoryIndex + 1);
  newHistory.push({
    imageUrl: result.imageUrl,
    imageId: result.imageId,
    prompt: prompt,
    timestamp: Date.now(),
  });
  
  setImageHistory(newHistory);
  setCurrentHistoryIndex(newHistory.length - 1);
};

// Undo
const handleUndo = () => {
  if (currentHistoryIndex > 0) {
    setCurrentHistoryIndex(currentHistoryIndex - 1);
    const previousState = imageHistory[currentHistoryIndex - 1];
    // Display previousState.imageUrl
  }
};

// Redo
const handleRedo = () => {
  if (currentHistoryIndex < imageHistory.length - 1) {
    setCurrentHistoryIndex(currentHistoryIndex + 1);
    const nextState = imageHistory[currentHistoryIndex + 1];
    // Display nextState.imageUrl
  }
};
```

## Update Existing Image (Replace Flow)

You can also use the presigned URL flow to **update** an existing image:

```typescript
// Upload new version of existing image
const file = new File([blob], 'updated-image.png', { type: 'image/png' });
const result = await uploadImageToGCS(file, existingImageId);
// Old file deleted, new file uploaded, same imageId
```

## GCS Bucket Structure

```
banana-shop-bucket-dev/
├── user123-1727461234567-abc.png    (final image for user 123)
├── user123-1727461245678-def.png    (updated final image - old deleted)
├── user123-1727461250000-tmp.png    (temporary cropped/marked image)
├── user456-1727461256789-ghi.png    (final image for user 456)
└── ...
```

**Notes:**
- Filenames include `userId` for organization
- Old files are **deleted** when image is updated (automatic cleanup)
- All files in root (no folders)
- Temporary images (cropped/marked) are cleaned up during the editing flow:
  - When `editImageFromGCS` is called, it deletes the old file
  - The Image record is updated with the new file
  - No orphaned files remain in GCS

**Temporary Image Lifecycle** (Regional Editing Flow):
1. **Cropped image**: Created in Stage 1, deleted in Stage 2 when edited
2. **Marked image**: Created in Stage 5, deleted in Stage 6 when blended
3. **Final image**: Persists with signed URL, gets deleted only when updated again

## Security Features

### 1. Signed URLs (24-hour expiry)
- Private, user-specific access
- URLs expire after 24 hours
- Must be regenerated for continued access

### 2. Presigned Upload URLs (15-minute expiry)
- Short-lived upload permission
- Client uploads directly to GCS
- No sensitive data passes through server

### 3. User Validation
- All operations check `context.user.id`
- Can only access own images
- Unauthorized access blocked

## API Operations

### Server Operations
```typescript
// Generate image
generateImage(args: { prompt: string })
  → Promise<{ imageUrl: string; imageId: string }>

// Get presigned upload URL
generatePresignedUploadUrl(args: { 
  fileName: string; 
  mimeType: string; 
  imageId?: string 
})
  → Promise<{ uploadUrl: string; gcsFileName: string; imageId?: string }>

// Confirm upload and create/update record
confirmImageUpload(args: { 
  imageId?: string; 
  fileName: string; 
  gcsFileName: string; 
  mimeType: string 
})
  → Promise<{ imageUrl: string; imageId: string }>

// Edit image (updates record)
editImageFromGCS(args: { imageId: string; prompt: string })
  → Promise<{ imageUrl: string; imageId: string }>
```

### Client Service Functions
```typescript
// Generate image
generateImage(prompt: string): Promise<{ imageUrl: string; imageId: string }>

// Upload with presigned URL (optional imageId to update existing)
uploadImageToGCS(file: File, imageId?: string): Promise<{ imageUrl: string; imageId: string }>

// Edit image (replaces record)
editImageFromGCS(imageId: string, prompt: string): Promise<{ imageUrl: string; imageId: string }>
```

## Benefits

1. **Security**: Private signed URLs, user-specific access
2. **Performance**: Direct client-to-GCS uploads (no server bottleneck)
3. **Efficiency**: Old files deleted automatically
4. **Simplicity**: Single Image record per image (no history clutter)
5. **Flexibility**: Frontend controls undo/redo UX
6. **Cost-Effective**: No orphaned files in GCS

## Important Notes

### URL Expiration Handling
Since URLs expire after 24 hours, you need to handle refresh:

```typescript
// Check if URL is expired (approximate)
const isUrlExpired = (createdAt: Date) => {
  const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceCreation > 23; // Refresh before 24hr
};

// Refresh URL if needed
if (isUrlExpired(image.createdAt)) {
  // Re-generate signed URL on server
  const newUrl = await refreshImageUrl(image.id);
}
```

Consider implementing an `action refreshImageUrl` that generates a new signed URL for an existing file.

### Cleanup Strategy

**Automatic Cleanup (Built-in):**
- Old files are **automatically deleted** when images are updated via `editImageFromGCS`
- Database records are updated (not duplicated) - single Image record per logical image
- Each `editImageFromGCS` call:
  1. Downloads current image from GCS
  2. **Deletes the old file** from GCS
  3. Processes with Gemini
  4. Uploads new result to GCS (new filename)
  5. Updates Image record with new URL and fileName

**Frontend History (Manual):**
- Frontend manages undo/redo history temporarily (in-memory state)
- History can be cleared on page refresh OR
- Persist to sessionStorage for cross-refresh persistence

**Regional Editing Cleanup:**
During multi-stage regional editing, temporary images are created and automatically cleaned up:
- **Stage 1-2**: Cropped image → Created → Edited → Deleted
- **Stage 5-6**: Marked image → Created → Blended → Deleted
- **Final**: Only the blended result persists (until next edit)

**24-Hour Expiration (flow.svg requirement):**
- All signed URLs expire after 24 hours (security)
- Expired URLs require regeneration (consider implementing `refreshImageUrl` action)
- Images in GCS remain until explicitly deleted by update operations
- For additional security, consider implementing a background job to delete images older than 24 hours from GCS if needed

## Summary

This implementation provides a **secure, efficient, and user-friendly** image management system:

- 🔐 **Private URLs** with 24-hour expiration
- ⚡ **Fast uploads** via presigned URLs
- 🔄 **Clean updates** that replace old files
- 📝 **Flexible history** managed by frontend
- 💰 **Cost-effective** with automatic cleanup

Perfect for your flow diagram while adding enterprise-grade security! 🎯
