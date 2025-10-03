# Image Storage & Edit History Implementation Plan

## Overview
Implementation of robust image storage system with presigned URLs, edit history, and persistent user data for the dashboard image editing functionality.

## Problem Statement
- Current implementation sends large base64 images causing 413 (Payload Too Large) errors
- Images are lost on browser refresh
- No edit history or version control
- Poor user experience with lost work

## Solution Architecture
Replace direct base64 uploads with GCS presigned URLs and comprehensive database storage.

---

## Phase 1: Database Schema Implementation ✅ COMPLETED

### 1.1 Update Existing Models
**File**: `schema.prisma` ✅

#### Enhanced Image Model
```prisma
model Image {
  id          String   @id @default(uuid())
  url         String   // Final GCS URL
  originalUrl String?  // Original image URL (if uploaded)
  description String?  // User-provided or AI-generated description
  fileName    String   // Display name
  mimeType    String   // image/png, image/jpeg, etc.
  isPublic    Boolean  @default(false) // For future sharing features
  userId      String
  user        Users    @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Link to edit history
  editHistory ImageEdit[]
}
```

### 1.2 Add New Models

#### TempImage Model
```prisma
model TempImage {
  id        String   @id @default(uuid())
  url       String   // Temporary GCS URL
  fileName  String   
  mimeType  String   
  userId    String
  user      Users    @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  expiresAt DateTime // Auto-cleanup after 24 hours
}
```

#### ImageEdit Model
```prisma  
model ImageEdit {
  id          String   @id @default(uuid())
  imageId     String
  image       Image    @relation(fields: [imageId], references: [id], onDelete: Cascade)
  editType    String   // 'generation', 'region_edit', 'filter', etc.
  prompt      String?  // The prompt used for this edit
  beforeUrl   String?  // Image state before this edit
  afterUrl    String   // Image state after this edit
  userId      String
  user        Users    @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
}
```

#### Update Users Model
```prisma
model Users {
  // ... existing fields ...
  images      Image[]
  tempImages  TempImage[]
  imageEdits  ImageEdit[]
}
```

### 1.3 Database Migration
- [ ] Update schema.prisma
- [ ] Run `wasp db migrate-dev`
- [ ] Verify migration successful
- [ ] Test database connectivity

---

## Phase 2: Server-Side Operations ✅ COMPLETED

### 2.1 Create Upload Operations
**File**: `src/server/image/upload-operations.ts`

#### Functions to implement:
- [ ] `generateImageUploadUrl()` - Generate presigned GCS URLs
- [ ] `createTempImageRecord()` - Create temp image database records
- [ ] `validateImageUpload()` - Validate file type/size
- [ ] `cleanupExpiredTempImages()` - Background cleanup job

#### GCS Integration:
- [ ] Setup GCS client with existing credentials
- [ ] Configure bucket permissions
- [ ] Implement presigned URL generation (15min expiry)
- [ ] Add file type validation (PNG, JPEG, WebP)
- [ ] Add size limits (50MB max)

### 2.2 Create Image Management Operations  
**File**: `src/server/image/image-operations.ts`

#### Functions to implement:
- [ ] `saveImagePermanently()` - Convert temp image to permanent
- [ ] `createImageEdit()` - Record edit operations
- [ ] `deleteImage()` - Remove image and cleanup GCS
- [ ] `duplicateImage()` - Create image copies

### 2.3 Create Image Query Operations
**File**: `src/server/image/image-queries.ts`

#### Functions to implement:
- [ ] `getUserImages()` - Get all user images with pagination
- [ ] `getImageWithHistory()` - Get image with full edit history
- [ ] `getImageById()` - Single image retrieval
- [ ] `searchUserImages()` - Search images by description/date

### 2.4 Update Gemini Service Operations
**File**: `src/server/gemini/gemini-service-operations.ts`

#### Functions to update:
- [ ] `generateImage()` - Save generated images to permanent storage
- [ ] `editImageRegionFromStorage()` - Process images from GCS URLs
- [ ] Add image download from GCS functionality
- [ ] Add result upload to GCS functionality

### 2.5 Background Jobs
**File**: `src/server/image/cleanup-jobs.ts`

#### Jobs to implement:
- [ ] Cleanup expired TempImage records
- [ ] Remove orphaned GCS files
- [ ] Generate usage statistics
- [ ] Optimize storage costs

---

## Phase 3: Wasp Configuration Updates ✅ COMPLETED

### 3.1 Add New Actions/Queries
**File**: `main.wasp`

```wasp
// Upload operations
action generateImageUploadUrl {
  fn: import { generateImageUploadUrl } from "@src/server/image/upload-operations"
  entities: [Users, TempImage]
}

action createTempImageRecord {
  fn: import { createTempImageRecord } from "@src/server/image/upload-operations"
  entities: [Users, TempImage]
}

// Processing operations  
action editImageRegionFromStorage {
  fn: import { editImageRegionFromStorage } from "@src/server/gemini/gemini-service-operations"
  entities: [Users, TempImage, Image, ImageEdit]
}

// Image management
query getUserImages {
  fn: import { getUserImages } from "@src/server/image/image-queries"
  entities: [Users, Image]
}

query getImageWithHistory {
  fn: import { getImageWithHistory } from "@src/server/image/image-queries"
  entities: [Users, Image, ImageEdit]
}

action saveImagePermanently {
  fn: import { saveImagePermanently } from "@src/server/image/image-operations"
  entities: [Users, Image, TempImage, ImageEdit]
}
```

---

## Phase 4: Client-Side Implementation 🚧 IN PROGRESS

### 4.1 Update Dashboard Services
**File**: `src/client/pages/dashboard/services/gemini-service.ts`

#### Functions to update:
- [ ] `uploadImageToStorage()` - Handle presigned URL uploads
- [ ] `generateImage()` - Use new storage-based flow
- [ ] `editImageRegion()` - Use GCS URLs instead of base64
- [ ] Add progress tracking for uploads
- [ ] Add error handling for upload failures

### 4.2 Update ImageAnalyzer Component
**File**: `src/client/pages/dashboard/components/ImageAnalyzer.tsx`

#### Changes needed:
- [ ] Replace base64 upload with GCS upload flow
- [ ] Add upload progress indicators
- [ ] Add auto-save functionality
- [ ] Add edit history display
- [ ] Add version control (undo/redo)
- [ ] Improve error handling and user feedback

### 4.3 Create Image Gallery Component
**File**: `src/client/pages/dashboard/components/ImageGallery.tsx`

#### Features to implement:
- [ ] Grid view of user images
- [ ] Search and filter functionality
- [ ] Image preview modal
- [ ] Edit history timeline
- [ ] Bulk operations (delete, export)
- [ ] Pagination for large image collections

### 4.4 Update Dashboard Page
**File**: `src/client/pages/dashboard/dashboard.tsx`

#### Enhancements:
- [ ] Add image gallery sidebar/modal
- [ ] Add image persistence across page refreshes
- [ ] Add recently edited images section
- [ ] Add storage usage indicator
- [ ] Improve overall navigation

---

## Phase 5: User Experience Enhancements

### 5.1 Upload Experience
- [ ] Drag & drop file upload
- [ ] Upload progress with cancel option
- [ ] Image preview before processing
- [ ] File validation with clear error messages
- [ ] Support for multiple file formats

### 5.2 Edit Experience  
- [ ] Real-time save indicators
- [ ] Edit history timeline UI
- [ ] Quick undo/redo buttons
- [ ] Version comparison view
- [ ] Auto-save every successful edit

### 5.3 Gallery Experience
- [ ] Responsive grid layout
- [ ] Infinite scroll or pagination
- [ ] Image metadata display
- [ ] Bulk selection and operations
- [ ] Export options (download, share)

---

## Phase 6: Testing & Quality Assurance

### 6.1 Unit Tests
- [ ] Test upload operations
- [ ] Test image processing functions
- [ ] Test database operations
- [ ] Test cleanup jobs
- [ ] Test error handling

### 6.2 Integration Tests
- [ ] Test complete upload flow
- [ ] Test edit workflow
- [ ] Test gallery functionality
- [ ] Test persistence across sessions
- [ ] Test storage limits

### 6.3 Performance Tests
- [ ] Test large file uploads
- [ ] Test concurrent operations
- [ ] Test storage cleanup efficiency
- [ ] Test query performance with large datasets

---

## Phase 7: Deployment & Monitoring

### 7.1 Production Setup
- [ ] Configure GCS permissions for production
- [ ] Setup environment variables
- [ ] Configure cleanup job scheduling
- [ ] Setup monitoring for storage usage
- [ ] Configure error logging

### 7.2 Monitoring & Analytics
- [ ] Track upload success rates
- [ ] Monitor storage usage per user
- [ ] Track edit operation performance
- [ ] Monitor cleanup job effectiveness
- [ ] Setup alerts for storage issues

---

## Implementation Checklist

### Prerequisites
- [ ] GCS bucket configured and accessible
- [ ] Environment variables set (`GCP_PROJECT_ID`, `GCP_BUCKET_NAME`, etc.)
- [ ] Database backup created
- [ ] Development environment verified

### Phase 1: Database (Week 1)
- [ ] Schema updated
- [ ] Migration successful
- [ ] Models tested

### Phase 2: Server Operations (Week 1-2)  
- [ ] Upload operations implemented
- [ ] Image management operations implemented
- [ ] Gemini service updated
- [ ] Background jobs implemented

### Phase 3: Wasp Config (Week 2)
- [ ] Actions/queries added
- [ ] Compilation successful
- [ ] Operations accessible from client

### Phase 4: Client Implementation (Week 2-3)
- [ ] Services updated
- [ ] Components updated
- [ ] New components created
- [ ] User flows tested

### Phase 5: UX Enhancements (Week 3-4)
- [ ] Upload experience polished
- [ ] Edit experience enhanced
- [ ] Gallery functionality complete

### Phase 6: Testing (Week 4)
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Error handling robust

### Phase 7: Deployment (Week 4)
- [ ] Production deployment successful
- [ ] Monitoring active
- [ ] User feedback collected

---

## Success Metrics

### Technical Metrics
- [ ] 0% upload failures due to payload size
- [ ] < 2 second upload time for typical images
- [ ] 99.9% data persistence across sessions
- [ ] < 24 hour cleanup of temporary files

### User Experience Metrics
- [ ] Users can edit images without size limitations
- [ ] Edit history available for all operations
- [ ] No work lost on browser refresh
- [ ] Improved user satisfaction scores

---

## Risk Mitigation

### Data Loss Prevention
- [ ] Database backups before schema changes
- [ ] Staged rollout with user testing
- [ ] Rollback plan for failed deployments
- [ ] Data migration verification

### Performance Risks
- [ ] Storage quota monitoring
- [ ] Query performance optimization
- [ ] Cleanup job scheduling
- [ ] Rate limiting on uploads

### Security Considerations
- [ ] Presigned URL expiration (15 minutes)
- [ ] File type validation
- [ ] User access control
- [ ] Storage access logging

---

## Future Enhancements

### Phase 8: Advanced Features (Future)
- [ ] Image sharing between users
- [ ] Collaborative editing
- [ ] AI-powered image tagging
- [ ] Advanced export options
- [ ] Integration with external services

### Phase 9: Optimization (Future)
- [ ] CDN integration for faster loading
- [ ] Image compression optimization
- [ ] Storage cost optimization
- [ ] Performance analytics dashboard

---

*This plan will be updated as implementation progresses. Each completed item should be checked off and any blockers or changes documented.*