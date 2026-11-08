/**
 * Centralized Stripe Configuration
 *
 * Reads Stripe Product and Price IDs from environment variables with safe fallbacks.
 * Prefixing with NEXT_PUBLIC_ ensures these can be accessed both client-side and server-side.
 */

export const STRIPE_PRODUCTS = {
  INDIVIDUAL:
    process.env.NEXT_PUBLIC_STRIPE_PRODUCT_INDIVIDUAL ||
    process.env.STRIPE_PRODUCT_INDIVIDUAL ||
    'prod_Ueztggr15cNscz',
  PLUS:
    process.env.NEXT_PUBLIC_STRIPE_PRODUCT_PLUS ||
    process.env.STRIPE_PRODUCT_PLUS ||
    'prod_Uezx3sCcamylDq',
  PROFESSIONAL:
    process.env.NEXT_PUBLIC_STRIPE_PRODUCT_PROFESSIONAL ||
    process.env.STRIPE_PRODUCT_PROFESSIONAL ||
    'prod_Uf01XdkL0cOXn6',
  AGENCY:
    process.env.NEXT_PUBLIC_STRIPE_PRODUCT_AGENCY ||
    process.env.STRIPE_PRODUCT_AGENCY ||
    'prod_Uf03Msy5G3OZn2',
};

// Optional: Direct price_xxx IDs if you prefer passing price IDs instead of prod_xxx IDs
export const STRIPE_PRICES = {
  INDIVIDUAL:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL ||
    process.env.STRIPE_PRICE_INDIVIDUAL ||
    '',
  PLUS:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_PLUS ||
    process.env.STRIPE_PRICE_PLUS ||
    '',
  PROFESSIONAL:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL ||
    process.env.STRIPE_PRICE_PROFESSIONAL ||
    '',
  AGENCY:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY ||
    process.env.STRIPE_PRICE_AGENCY ||
    '',
};

// Top-up scan credits product IDs (used in the upload page top-up modal)
export const STRIPE_TOPUPS = {
  AGENCY:
    process.env.NEXT_PUBLIC_STRIPE_TOPUP_AGENCY ||
    process.env.STRIPE_TOPUP_AGENCY ||
    'prod_UfT1DRTXQOzn94',
  PROFESSIONAL:
    process.env.NEXT_PUBLIC_STRIPE_TOPUP_PROFESSIONAL ||
    process.env.STRIPE_TOPUP_PROFESSIONAL ||
    'prod_UfT00V9zFyJOM7',
  PLUS:
    process.env.NEXT_PUBLIC_STRIPE_TOPUP_PLUS ||
    process.env.STRIPE_TOPUP_PLUS ||
    'prod_UfSyVFRhZUqdiq',
  INDIVIDUAL:
    process.env.NEXT_PUBLIC_STRIPE_TOPUP_INDIVIDUAL ||
    process.env.STRIPE_TOPUP_INDIVIDUAL ||
    process.env.NEXT_PUBLIC_STRIPE_PRODUCT_INDIVIDUAL ||
    process.env.STRIPE_PRODUCT_INDIVIDUAL ||
    'prod_Ueztggr15cNscz',
};

/**
 * Returns the effective checkout ID (price ID if set, otherwise product ID)
 */
export function getCheckoutPlanId(tier: 'individual' | 'plus' | 'professional' | 'agency'): string {
  switch (tier) {
    case 'individual':
      return STRIPE_PRICES.INDIVIDUAL || STRIPE_PRODUCTS.INDIVIDUAL;
    case 'plus':
      return STRIPE_PRICES.PLUS || STRIPE_PRODUCTS.PLUS;
    case 'professional':
      return STRIPE_PRICES.PROFESSIONAL || STRIPE_PRODUCTS.PROFESSIONAL;
    case 'agency':
      return STRIPE_PRICES.AGENCY || STRIPE_PRODUCTS.AGENCY;
  }
}

/**
 * Maps a Stripe Product ID or Price ID to our internal plan identifier ('agency' | 'professional' | 'plus')
 */
export function getPlanFromStripeId(id?: string | null): 'agency' | 'professional' | 'plus' {
  if (!id) return 'plus';

  if (
    id === STRIPE_PRODUCTS.AGENCY ||
    (STRIPE_PRICES.AGENCY && id === STRIPE_PRICES.AGENCY)
  ) {
    return 'agency';
  }

  if (
    id === STRIPE_PRODUCTS.PROFESSIONAL ||
    (STRIPE_PRICES.PROFESSIONAL && id === STRIPE_PRICES.PROFESSIONAL)
  ) {
    return 'professional';
  }

  return 'plus';
}

/**
 * Returns the number of monthly scan credits for a given plan tier, product ID, or price ID
 */
export function getCreditsForPlanOrId(idOrPlan?: string | null): number {
  if (!idOrPlan) return 5;

  const mapping: Record<string, number> = {
    [STRIPE_PRODUCTS.PLUS]: 5,
    [STRIPE_PRODUCTS.PROFESSIONAL]: 20,
    [STRIPE_PRODUCTS.AGENCY]: 100,
    plus: 5,
    professional: 20,
    agency: 100,
  };

  if (STRIPE_PRICES.PLUS) mapping[STRIPE_PRICES.PLUS] = 5;
  if (STRIPE_PRICES.PROFESSIONAL) mapping[STRIPE_PRICES.PROFESSIONAL] = 20;
  if (STRIPE_PRICES.AGENCY) mapping[STRIPE_PRICES.AGENCY] = 100;

  return mapping[idOrPlan] ?? 5;
}

