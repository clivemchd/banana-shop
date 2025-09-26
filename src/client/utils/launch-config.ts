/**
 * Launch configuration for client-side components
 * 
 * TO ENABLE/DISABLE LAUNCH OFFER:
 * 1. Set LAUNCH_30=true in .env.server to enable
 * 2. Set LAUNCH_30=false in .env.server to disable
 * 3. Restart the server for changes to take effect
 */

// This configuration should match the LAUNCH_30 environment variable
// For now, manually set this to true/false to control the launch offer
// Later this will be automatically synced with the server-side LAUNCH_30 env var
export const LAUNCH_CONFIG = {
  isActive: true, // 👈 Change this to false to disable launch offer everywhere
  discountPercent: 30,
  couponCode: 'LAUNCH30'
};

export function isLaunchOfferActive(): boolean {
  return LAUNCH_CONFIG.isActive;
}

export function calculateLaunchPrice(originalPrice: number): number {
  if (!LAUNCH_CONFIG.isActive) return originalPrice;
  return Math.round(originalPrice * (1 - LAUNCH_CONFIG.discountPercent / 100));
}

export function calculateSavings(originalPrice: number): number {
  if (!LAUNCH_CONFIG.isActive) return 0;
  return Math.round(originalPrice * (LAUNCH_CONFIG.discountPercent / 100));
}