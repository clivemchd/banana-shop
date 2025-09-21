import { PaymentPlanId, paymentPlans } from '../../payment/plans';

export type BillingCycle = 'monthly' | 'annual';

export interface PlanPricing {
  planId: PaymentPlanId;
  name: string;
  price: number;
  annualPrice?: number;
  description: string;
  features: string[];
  isPopular?: boolean;
  // UI-specific properties
  cta?: string;
  featured?: boolean;
  frequency?: string;
  credits?: string;
}

export interface PriceCalculation {
  displayPrice: number;
  originalPrice: number;
  isDiscounted: boolean;
  savings?: number;
  annualSavings?: number;
}

/**
 * Get unified plan data - uses paymentPlans as source of truth
 */
export function getUnifiedPlans(): PlanPricing[] {
  // Define UI-specific properties that match the original pricing page
  const uiProperties: Record<PaymentPlanId, {
    cta: string;
    featured: boolean;
    frequency: string;
    credits: string;
  }> = {
    [PaymentPlanId.Starter]: {
      cta: 'Get Started',
      featured: false,
      frequency: '/month',
      credits: '40 Credits',
    },
    [PaymentPlanId.Pro]: {
      cta: 'Choose Pro', 
      featured: true,
      frequency: '/month',
      credits: '180 Credits',
    },
    [PaymentPlanId.Business]: {
      cta: 'Get Started',
      featured: false,
      frequency: '/month',
      credits: '1,000 Credits',
    },
    [PaymentPlanId.Credits]: {
      cta: 'Buy Credits',
      featured: false,
      frequency: '/one-time',
      credits: '50 Credits',
    },
  };

  return Object.entries(paymentPlans)
    .filter(([_, plan]) => plan.effect.kind === 'subscription')
    .map(([planId, plan]) => {
      const planKey = planId as PaymentPlanId;
      const uiProps = uiProperties[planKey] || {
        cta: 'Get Started',
        featured: false,
        frequency: '/month',
        credits: 'N/A',
      };
      
      return {
        planId: planKey,
        name: plan.name,
        price: plan.price,
        annualPrice: plan.annualPrice,
        description: plan.description,
        features: plan.features,
        isPopular: plan.isPopular,
        ...uiProps
      };
    });
}

/**
 * Calculate the base monthly price (considering annual billing)
 */
export function getBaseMonthlyPrice(plan: PlanPricing, billingCycle: BillingCycle): number {
  if (billingCycle === 'annual' && plan.annualPrice) {
    return parseFloat((plan.annualPrice / 12).toFixed(2));
  }
  return plan.price;
}

/**
 * Calculate pricing with launch discount if active
 */
export function calculatePlanPricing(
  plan: PlanPricing,
  billingCycle: BillingCycle,
  isLaunchActive: boolean = false,
  discountPercent: number = 0
): PriceCalculation {
  const basePrice = getBaseMonthlyPrice(plan, billingCycle);
  
  if (isLaunchActive && discountPercent > 0) {
    const discountedPrice = parseFloat((basePrice * (1 - discountPercent / 100)).toFixed(2));
    const savings = parseFloat((basePrice - discountedPrice).toFixed(2));
    
    return {
      displayPrice: discountedPrice,
      originalPrice: basePrice,
      isDiscounted: true,
      savings
    };
  }
  
  return {
    displayPrice: basePrice,
    originalPrice: basePrice,
    isDiscounted: false
  };
}

/**
 * Calculate annual vs monthly savings
 */
export function calculateAnnualSavings(
  plan: PlanPricing,
  isLaunchActive: boolean = false,
  discountPercent: number = 0
): number | null {
  if (!plan.annualPrice) return null;
  
  if (isLaunchActive && discountPercent > 0) {
    // Calculate savings with launch discount applied
    const monthlyDiscounted = plan.price * (1 - discountPercent / 100);
    const annualDiscounted = plan.annualPrice * (1 - discountPercent / 100);
    const monthlySavings = (monthlyDiscounted * 12) - annualDiscounted;
    return parseFloat(monthlySavings.toFixed(2));
  }
  
  // Normal annual savings
  return (plan.price * 12) - plan.annualPrice;
}

/**
 * Get the total annual price for a plan
 */
export function getAnnualPrice(
  plan: PlanPricing,
  isLaunchActive: boolean = false,
  discountPercent: number = 0
): number | null {
  if (!plan.annualPrice) return null;
  
  if (isLaunchActive && discountPercent > 0) {
    return parseFloat((plan.annualPrice * (1 - discountPercent / 100)).toFixed(2));
  }
  
  return plan.annualPrice;
}

/**
 * Format price display string
 */
export function formatPrice(price: number): string {
  return price % 1 === 0 ? price.toString() : price.toFixed(2);
}

/**
 * Normalize billing cycle naming between components
 */
export function normalizeBillingCycle(cycle: 'monthly' | 'annual' | 'annually'): BillingCycle {
  return cycle === 'annually' ? 'annual' : cycle as BillingCycle;
}

/**
 * Calculate maximum annual savings percentage across all plans
 */
export function getMaxAnnualSavingsPercent(): number {
  const plans = getUnifiedPlans();
  return Math.max(
    ...plans.map(plan => {
      if (plan.annualPrice) {
        return Math.round(((plan.price * 12 - plan.annualPrice) / (plan.price * 12)) * 100);
      }
      return 0;
    })
  );
}