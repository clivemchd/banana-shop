# Subscription & Credits Implementation

## Overview
This document describes the subscription and credit validation system implemented for image generation and editing operations.

## Key Features
- ✅ **Server-side validation**: Subscription and credit checks before API calls
- ✅ **Client-side validation**: Pre-flight checks for better UX
- ✅ **Common credit guard service**: Reusable validation logic
- ✅ **Credit deduction**: 0.5 credits for generation, 1 credit for editing (deducted only once)
- ✅ **Automatic credit refresh**: UI updates after each operation
- ✅ **User-friendly error messages**: Clear feedback for subscription/credit issues

## Architecture

### Server-Side Components

#### 1. Credit Guard Service (`/src/server/credits/credit-guard.ts`)
Centralized service for subscription and credit validation:

```typescript
export const validateAndDeductCredits = async (
  userId: string,
  operation: CreditOperation,
  context: any,
  skipDeduction = false
): Promise<CreditGuardResult>
```

**Features:**
- Validates user exists
- Checks active subscription status
- Verifies sufficient credits
- Deducts credits (unless `skipDeduction` is true)
- Returns detailed result with new balance

**Usage in operations:**
```typescript
// Deduct credits
await validateAndDeductCredits(context.user.id, 'IMAGE_GENERATION', context);

// Validate only (for blending - second step)
await validateAndDeductCredits(context.user.id, 'IMAGE_EDIT', context, true);
```

#### 2. Gemini Service Operations (`/src/server/gemini/gemini-service-operations.ts`)

**Generate Image:**
```typescript
export const generateImage = async (args: GenerateImageArgs, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated');
  }

  // Validate subscription and deduct 0.5 credits
  await validateAndDeductCredits(context.user.id, 'IMAGE_GENERATION', context);

  // ... proceed with generation
}
```

**Edit Image:**
```typescript
export const editImageFromGCS = async (args: EditImageFromGCSArgs, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated');
  }

  // Validate and deduct credits (skip if blending)
  await validateAndDeductCredits(
    context.user.id, 
    'IMAGE_EDIT', 
    context, 
    shouldBlend // skipDeduction = true if blending
  );

  // ... proceed with editing
}
```

### Client-Side Components

#### 1. Subscription Validator (`/src/client/utils/subscription-validator.ts`)

**Types:**
```typescript
export interface UserSubscriptionInfo {
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  credits: number;
}

export interface SubscriptionValidationResult {
  isValid: boolean;
  error?: string;
  credits?: number;
}
```

**Validation Function:**
```typescript
export const validateSubscriptionAndCredits = async (
  requiredCredits: number,
  userInfo: UserSubscriptionInfo
): Promise<SubscriptionValidationResult>
```

**Credit Costs (must match server):**
```typescript
export const CREDIT_COSTS = {
  IMAGE_GENERATION: 0.5,
  IMAGE_EDIT: 1,
  IMAGE_UPSCALE: 1.5,
  IMAGE_VARIATION: 0.5,
} as const;
```

#### 2. Gemini Service (`/src/client/pages/dashboard/services/gemini-service.ts`)

**Generate Image:**
```typescript
export const generateImage = async (
  prompt: string, 
  userInfo: UserSubscriptionInfo
): Promise<{ imageUrl: string; imageId: string }> => {
  // Validate on client-side first
  const validation = await validateSubscriptionAndCredits(
    CREDIT_COSTS.IMAGE_GENERATION,
    userInfo
  );

  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Call server API
  const result = await generateImageWithGemini({ prompt });
  return result;
}
```

**Edit Image:**
```typescript
export const editImageFromGCS = async (
  imageId: string, 
  prompt: string,
  shouldBlend?: boolean,
  borderColor?: string,
  userInfo?: UserSubscriptionInfo
): Promise<{ imageUrl: string; imageId: string }> => {
  // Only validate for non-blending operations
  if (!shouldBlend && userInfo) {
    const validation = await validateSubscriptionAndCredits(
      CREDIT_COSTS.IMAGE_EDIT,
      userInfo
    );

    if (!validation.isValid) {
      throw new Error(validation.error);
    }
  }

  // Call server API
  const result = await editImageFromGCSAction({ 
    imageId, 
    prompt,
    shouldBlend,
    borderColor
  });
  return result;
}
```

#### 3. Dashboard (`/src/client/pages/dashboard/dashboard.tsx`)

**Features:**
- Fetches user subscription info and credits on mount
- Passes `userInfo` to all components
- Refreshes credits after operations
- Shows loading state while fetching user info

**Key Functions:**
```typescript
// Fetch user info on mount
useEffect(() => {
  const fetchUserInfo = async () => {
    if (!user) return;
    
    const creditsData = await getCurrentUserCredits();
    setUserInfo({
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      credits: creditsData.credits,
    });
  };
  
  fetchUserInfo();
}, [user]);

// Refresh credits after operations
const refreshCredits = useCallback(async () => {
  if (!user) return;
  
  const creditsData = await getCurrentUserCredits();
  setUserInfo(prev => prev ? {
    ...prev,
    credits: creditsData.credits,
  } : null);
}, [user]);
```

#### 4. ImageAnalyzer (`/src/client/pages/dashboard/components/ImageAnalyzer.tsx`)

**Props:**
```typescript
interface ImageAnalyzerProps {
  onImageStateChange?: (isLoaded: boolean) => void;
  userInfo: UserSubscriptionInfo | null;
  onCreditUpdate?: () => Promise<void>;
}
```

**Validation before operations:**
```typescript
// Start screen generation
const handleStartScreenGenerate = async () => {
  if (!userInfo) {
    setError('Unable to verify your account. Please refresh the page.');
    return;
  }
  
  const result = await generateImage(startScreenPrompt, userInfo);
  
  // Refresh credits after generation
  await onCreditUpdate?.();
}

// Edit request
const handleEditRequest = async () => {
  if (!userInfo) {
    setError('Unable to verify your account. Please refresh the page.');
    return;
  }
  
  // Edit (validation happens in service)
  const editResult = await editImageFromGCS(croppedImageId, userPrompt, false, undefined, userInfo);
  
  // ... blending steps ...
  
  // Refresh credits after editing
  await onCreditUpdate?.();
}
```

#### 5. GenerateImageModal (`/src/client/pages/dashboard/components/GenerateImageModal.tsx`)

**Props:**
```typescript
interface GenerateImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (result: { imageUrl: string; imageId: string }) => void;
  userInfo: UserSubscriptionInfo | null;
}
```

**Validation:**
```typescript
const handleGenerate = async () => {
  if (!userInfo) {
    setError('Unable to verify your account. Please refresh the page.');
    return;
  }
  
  const result = await generateImage(prompt, userInfo);
  onGenerate(result);
}
```

## Credit Costs

| Operation | Credits | Notes |
|-----------|---------|-------|
| Image Generation | 0.5 | Single API call to Gemini |
| Image Edit | 1.0 | Two API calls (edit + blend), charged once |
| Image Upscale | 1.5 | Not yet implemented |
| Image Variation | 0.5 | Not yet implemented |

## Edit Workflow Credit Handling

The regional edit workflow involves **two Gemini API calls** but only **charges 1 credit**:

1. **First call (Edit)**: Credits are deducted
   ```typescript
   await editImageFromGCS(croppedImageId, userPrompt, false, undefined, userInfo);
   // shouldBlend = false → credits deducted
   ```

2. **Second call (Blend)**: Credits are NOT deducted
   ```typescript
   await editImageFromGCS(blendImageId, '', true, colorName);
   // shouldBlend = true → validation only, no deduction
   ```

This is implemented via the `skipDeduction` flag in the credit guard:
```typescript
await validateAndDeductCredits(
  context.user.id, 
  'IMAGE_EDIT', 
  context, 
  shouldBlend // true = skip deduction
);
```

## Error Messages

### Client-Side Errors
- **No subscription**: "You need an active subscription to use this feature. Please subscribe to continue."
- **Insufficient credits**: "Insufficient credits. You need X credits but only have Y remaining. Please upgrade your plan or wait for your credits to renew."
- **No user info**: "Unable to verify your account. Please refresh the page."

### Server-Side Errors
- **Not authenticated**: 401 - "User must be authenticated"
- **User not found**: 404 - "User not found"
- **No subscription**: 403 - "Active subscription required. Please subscribe to use this feature."
- **Insufficient credits**: 402 - "Insufficient credits. Required: X, Available: Y. Please upgrade your plan or wait for your credits to renew."

## Testing Checklist

### Server-Side
- [ ] Generate image without subscription → 403 error
- [ ] Generate image with insufficient credits → 402 error
- [ ] Generate image with valid subscription → success, credits deducted
- [ ] Edit image without subscription → 403 error
- [ ] Edit image with insufficient credits → 402 error
- [ ] Edit + blend → only 1 credit deducted (not 2)

### Client-Side
- [ ] Dashboard shows loading state while fetching user info
- [ ] Dashboard shows error if user info fetch fails
- [ ] Generation blocked without subscription → clear error message
- [ ] Generation blocked with insufficient credits → clear error message
- [ ] Credits refresh after generation
- [ ] Credits refresh after editing
- [ ] Edit workflow (crop → edit → blend) → only 1 credit deducted

## Integration with REFINED_IMAGE_FLOW.md

This implementation **maintains the complete REFINED_IMAGE_FLOW** workflow:

### Flow 1: Generate New Image
- ✅ Validates subscription & credits **before** calling Gemini
- ✅ Deducts 0.5 credits
- ✅ Refreshes credit display after generation

### Flow 2: Upload User Image
- ✅ No validation needed (file upload doesn't consume credits)
- ✅ Uses presigned URL flow as documented

### Flow 3: Edit Image Region (Multi-Stage)
- ✅ Stage 1: Crop & upload (no credits)
- ✅ Stage 2: Edit cropped region → **validates & deducts 1 credit**
- ✅ Stage 3: Composite (client-side, no credits)
- ✅ Stage 4: Mark for blending (no credits)
- ✅ Stage 5: Upload marked image (no credits)
- ✅ Stage 6: Blend edges → **validates only, no deduction**
- ✅ Stage 7: Update history & **refresh credits**

**Total for regional edit: 1 credit (not 2)**

## Database Schema

Uses existing `Users` table fields:
```prisma
model Users {
  id String @id @default(uuid())
  subscriptionStatus String?  // 'active', 'canceled', etc.
  subscriptionPlan String?     // 'starter', 'pro', 'business'
  credits Int @default(0)      // Current credit balance
  // ... other fields
}
```

## Future Enhancements

1. **Credit History**: Track credit transactions in separate table
2. **Credit Expiration**: Expire unused credits at end of billing cycle
3. **Credit Packages**: One-time credit purchases
4. **Usage Analytics**: Track credit consumption patterns
5. **Credit Alerts**: Notify users when running low on credits
6. **Refund Logic**: Refund credits if operation fails after deduction
