# Authentication Configuration Guide

This guide explains how to switch between Google-only authentication and traditional email/password authentication.

## Current Setup

The application is currently configured to use **Google OAuth only** for authentication.

## Environment Variable

The authentication method is controlled by the `REACT_APP_ENABLE_TRADITIONAL_AUTH` environment variable in `.env.client`:

```bash
# Set to 'false' for Google-only authentication (current)
REACT_APP_ENABLE_TRADITIONAL_AUTH=false

# Set to 'true' to enable traditional email/password authentication
REACT_APP_ENABLE_TRADITIONAL_AUTH=true
```

## How to Enable Traditional Authentication

To re-enable traditional email/password authentication:

### Step 1: Update Environment Variable

Edit `.env.client` and change:

```bash
REACT_APP_ENABLE_TRADITIONAL_AUTH=true
```

### Step 2: Update main.wasp Routes

Edit `main.wasp` and uncomment the traditional auth routes (around line 44):

**Current (Google-only):**
```wasp
// Google-only Sign In Page (active)
route GoogleSignInPageRoute { path: "/signin", to: GoogleSignInPage }
page GoogleSignInPage {
  component: import { GoogleSignInPage } from "@src/client/pages/auth/google-sign-in"
}

// Traditional Auth Pages (disabled - uncomment to re-enable)
// route SignUpPageRoute { path: "/signup", to: SignUpPage }
// page SignUpPage {
//   component: import { SignUpPage } from "@src/client/pages/auth/sign-up"
// }

// route SignInPageRoute { path: "/signin", to: SignInPage }
// page SignInPage {
//   component: import { SignInPage } from "@src/client/pages/auth/sign-in"
// }

// route ForgotPasswordRoute { path: "/forgot-password", to: ForgotPasswordPage }
// page ForgotPasswordPage {
//   component: import { ForgotPasswordPage } from "@src/client/pages/auth/forgot-password"
// }
```

**Change to (Traditional Auth Enabled):**
```wasp
// Traditional Auth Pages (active)
route SignUpPageRoute { path: "/signup", to: SignUpPage }
page SignUpPage {
  component: import { SignUpPage } from "@src/client/pages/auth/sign-up"
}

route SignInPageRoute { path: "/signin", to: SignInPage }
page SignInPage {
  component: import { SignInPage } from "@src/client/pages/auth/sign-in"
}

route ForgotPasswordRoute { path: "/forgot-password", to: ForgotPasswordPage }
page ForgotPasswordPage {
  component: import { ForgotPasswordPage } from "@src/client/pages/auth/forgot-password"
}

// Google-only Sign In Page (disabled)
// route GoogleSignInPageRoute { path: "/signin", to: GoogleSignInPage }
// page GoogleSignInPage {
//   component: import { GoogleSignInPage } from "@src/client/pages/auth/google-sign-in"
// }
```

### Step 3: Restart the Development Server

After making these changes, restart your development server for the changes to take effect.

## Files Involved

- **`.env.client`** - Contains the environment variable
- **`main.wasp`** - Contains route definitions
- **`src/client/pages/auth/google-sign-in.tsx`** - Google-only sign-in page (current)
- **`src/client/pages/auth/sign-in.tsx`** - Traditional sign-in page with email/password and Google
- **`src/client/pages/auth/sign-up.tsx`** - Traditional sign-up page
- **`src/client/pages/auth/forgot-password.tsx`** - Forgot password page
- **`src/client/utils/auth-config.ts`** - Authentication configuration utility

## Authentication Flow

### Google-Only Mode (Current)
1. User visits `/signin`
2. Sees only the "Continue with Google" button
3. Clicks and is redirected to Google OAuth
4. After successful authentication, redirected to dashboard

### Traditional Auth Mode
1. User can visit `/signup` to create an account with email/password
2. User can visit `/signin` to log in with email/password or Google
3. User can visit `/forgot-password` if they forget their password
4. Email verification is required for new accounts

## Notes

- The Google OAuth configuration remains active in both modes
- Traditional auth includes email verification for security
- All auth pages redirect to `/dashboard` if user is already logged in
- Password requirements: minimum 8 characters, must contain at least one number
