/**
 * Server operations for launch settings
 */

export const getLaunchSettings = async () => {
  const isLaunchActive = process.env.LAUNCH_30 === 'true';
  
  return {
    isLaunchOfferActive: isLaunchActive,
    discountPercent: isLaunchActive ? 30 : 0,
    couponCode: isLaunchActive ? 'LAUNCH30' : null,
  };
};