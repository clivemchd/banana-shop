# Simplified Image Generation & Editing Flow

## Overview
This document describes the simplified image flow that stores all images directly in the GCS bucket root with no folders, uses only the `Image` model (no TempImage/ImageEdit), and makes all images permanently editable.

## Flow Diagram Reference
See the attached flow diagram showing:
- **Start** → Upload or Generate choice
- **Upload/Generate** → Upload to GCS cloud (root)
- **Store link** → Database under Users.Images
- **User edits** → Creates new image version
- **Stop**

## Database Schema

### Image Model (Only Model Used)
```prisma
model Image {
  id          String   @id @default(uuid())
  url         String   // Public GCS URL (permanent)
  fileName    String   // Unique filename in GCS root
  mimeType    String   // image/png, image/jpeg, etc.
  description String?  // Prompt or user description
  isPublic    Boolean  @default(false)
  userId      String
  user        Users    @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Flow 1: Generate New Image

### Step-by-Step
1. **Client Action**: User enters prompt in UI
2. **Client Service**: `generateImage(prompt)` 
3. **Wasp Operation**: `generateImageWithGemini`
4. **Server Function**: `gemini-service-operations.ts::generateImage()`
   - Calls Gemini API with prompt
   - Receives base64 image from Gemini
   - Uploads to **GCS root bucket** (no folders)
   - Filename: `{timestamp}-{random}.png`
   - Makes file publicly accessible
   - Generates permanent public URL
   - Creates `Image` record in database
5. **Returns**: `{ imageUrl, imageId }`
6. **Client Updates**: Displays image and stores `imageId` for editing

### Key Points
- ✅ Files uploaded to GCS root (no folders like `generated-images/`)
- ✅ Public URLs (no expiration)
- ✅ Direct Image record creation (no TempImage)
- ✅ Each generated image gets unique imageId

## Flow 2: Upload Existing Image

### Step-by-Step
1. **Client Action**: User selects file to upload
2. **Client Service**: `uploadImageToGCS(file)`
   - Converts file to base64
3. **Wasp Operation**: `uploadImageToGCS`
4. **Server Function**: `upload-operations.ts::uploadImageToGCS()`
   - Receives base64 file data
   - Generates unique filename (GCS root)
   - Uploads to **GCS root bucket**
   - Makes file publicly accessible
   - Creates `Image` record in database
5. **Returns**: `{ imageUrl, imageId }`
6. **Client Updates**: Displays image and stores `imageId` for editing

### Key Points
- ✅ Direct upload to GCS root
- ✅ No presigned URLs needed
- ✅ Immediate Image record creation
- ✅ Public permanent URLs

## Flow 3: Edit Existing Image

### Step-by-Step
1. **Client Action**: User selects image region and enters edit prompt
2. **Client Service**: `editImageFromGCS(imageId, prompt)`
3. **Wasp Operation**: `editImageFromGCS`
4. **Server Function**: `gemini-service-operations.ts::editImageFromGCS()`
   - Fetches `Image` record from database
   - Downloads image from GCS using `fileName`
   - Converts to base64 for Gemini
   - Calls Gemini API with image + edit prompt
   - Receives edited base64 image
   - Uploads edited image to **GCS root bucket**
   - New filename: `{timestamp}-{random}.png`
   - Makes file publicly accessible
   - Creates NEW `Image` record for edited version
5. **Returns**: `{ imageUrl, imageId }` (new imageId)
6. **Client Updates**: Displays edited image and stores new `imageId`

### Key Points
- ✅ Downloads from GCS, edits, uploads to GCS root
- ✅ Each edit creates a NEW Image record
- ✅ Chain editing possible (use new imageId for next edit)
- ✅ No edit history tracking (each version is independent)

## GCS Bucket Structure

```
banana-shop-bucket-dev/
├── 1727461234567-abc123.png    (generated image)
├── 1727461245678-def456.png    (uploaded image)
├── 1727461256789-ghi789.png    (edited image)
├── 1727461267890-jkl012.png    (another image)
└── ...                          (all files in root)
```

**No Folders** - All images stored directly in bucket root for simplicity.

## API Operations

### Wasp Configuration
```wasp
// Generate image with Gemini
action generateImageWithGemini {
  fn: import { generateImage } from "@src/server/gemini/gemini-service-operations",
  entities: [Users, Image]
}

// Upload user image
action uploadImageToGCS {
  fn: import { uploadImageToGCS } from "@src/server/image/upload-operations",
  entities: [Users, Image]
}

// Edit image from GCS
action editImageFromGCS {
  fn: import { editImageFromGCS } from "@src/server/gemini/gemini-service-operations",
  entities: [Users, Image]
}

// Get user's images
query getUserImages {
  fn: import { getUserImages } from "@src/server/image/image-queries",
  entities: [Users, Image]
}
```

## Client Service Functions

```typescript
// Generate image
generateImage(prompt: string): Promise<{ imageUrl: string; imageId: string }>

// Upload image
uploadImageToGCS(file: File): Promise<{ imageUrl: string; imageId: string }>

// Edit image
editImageFromGCS(imageId: string, prompt: string): Promise<{ imageUrl: string; imageId: string }>
```

## Benefits of Simplified Flow

1. **No Temporary Storage** - All images are permanent Image records
2. **No Expiration** - Public URLs don't expire
3. **Simple Structure** - Files in GCS root, no folder hierarchy
4. **Easy Editing** - Reference imageId to edit any image
5. **Independent Versions** - Each edit creates new independent image
6. **No Cleanup Jobs** - No temp files to expire or cleanup
7. **Straightforward** - Follows your diagram exactly

## Differences from Previous Implementation

| Feature | Previous (Complex) | New (Simplified) |
|---------|-------------------|------------------|
| **Models** | Users, Image, TempImage, ImageEdit | Users, Image only |
| **GCS Structure** | Folders (`generated-images/`, `edited-images/`, `temp/`) | Root only |
| **URL Type** | Signed URLs (24hr expiry) | Public URLs (permanent) |
| **Edit Tracking** | ImageEdit records | None (each version independent) |
| **Temp Storage** | TempImage for temporary files | None |
| **Cleanup Jobs** | Required | Not needed |
| **Return Values** | `{ imageUrl, tempImageId }` | `{ imageUrl, imageId }` |

## Usage Example

```typescript
// 1. Generate image
const generated = await generateImage("a beautiful sunset");
// Returns: { imageUrl: "https://storage.googleapis.com/bucket/123.png", imageId: "uuid1" }

// 2. Edit that image
const edited = await editImageFromGCS(generated.imageId, "add mountains");
// Returns: { imageUrl: "https://storage.googleapis.com/bucket/456.png", imageId: "uuid2" }

// 3. Edit again (chain editing)
const edited2 = await editImageFromGCS(edited.imageId, "add birds");
// Returns: { imageUrl: "https://storage.googleapis.com/bucket/789.png", imageId: "uuid3" }

// Each version is a separate Image record in the database
```

## Summary

This simplified flow matches your diagram exactly:
- ✅ Start → Upload or Generate
- ✅ Upload to GCS cloud (root, no folders)
- ✅ Store link in database under Users.Images
- ✅ User can edit images (creates new versions)
- ✅ All images are editable via their imageId

**Result**: Clean, simple, permanent image storage with full editing capabilities! 🎯
