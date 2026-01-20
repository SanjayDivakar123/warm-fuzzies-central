export interface SubscriptionFeatures {
  unlimitedRetakes: boolean;
  progressTracking: boolean;
  allAssessments: boolean;
  aiJobMatching: boolean;
  familyMembers: number;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  priceId: string;
  productId: string;
  price: number;
  interval: 'month' | 'year';
  features: SubscriptionFeatures;
  popular?: boolean;
  badge?: string;
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  pro_monthly: {
    id: 'pro_monthly',
    name: 'RoleColor Pro',
    description: 'Perfect for personal growth tracking',
    priceId: 'price_1SrkLzLK4mG04fcqcMd9Z6jl',
    productId: 'prod_TpPAL2LwSSgyGn',
    price: 9.99,
    interval: 'month',
    features: {
      unlimitedRetakes: true,
      progressTracking: true,
      allAssessments: false,
      aiJobMatching: false,
      familyMembers: 0
    },
    popular: true
  },
  pro_annual: {
    id: 'pro_annual',
    name: 'RoleColor Pro',
    description: 'Save $20 with annual billing',
    priceId: 'price_1SrkMKLK4mG04fcqcn96a46T',
    productId: 'prod_TpPAD76Twqqczt',
    price: 99,
    interval: 'year',
    features: {
      unlimitedRetakes: true,
      progressTracking: true,
      allAssessments: false,
      aiJobMatching: false,
      familyMembers: 0
    },
    badge: 'Save $20'
  },
  career_growth: {
    id: 'career_growth',
    name: 'Career Growth',
    description: 'AI-powered career advancement tools',
    priceId: 'price_1SrkMULK4mG04fcqZ3QwYjQr',
    productId: 'prod_TpPAoXkfwqBWWQ',
    price: 14.99,
    interval: 'month',
    features: {
      unlimitedRetakes: true,
      progressTracking: true,
      allAssessments: false,
      aiJobMatching: true,
      familyMembers: 0
    }
  },
  annual_pass: {
    id: 'annual_pass',
    name: 'Annual Premium Pass',
    description: 'Complete access to all assessments',
    priceId: 'price_1SrkMWLK4mG04fcqKQQORgw8',
    productId: 'prod_TpPAln2kXtUsPa',
    price: 149,
    interval: 'year',
    features: {
      unlimitedRetakes: true,
      progressTracking: true,
      allAssessments: true,
      aiJobMatching: false,
      familyMembers: 0
    },
    badge: 'Best Value'
  },
  family: {
    id: 'family',
    name: 'Family Plan',
    description: 'Share with up to 5 family members',
    priceId: 'price_1SrkMYLK4mG04fcqw4R9kfR6',
    productId: 'prod_TpPAmElJFFsMAw',
    price: 29.99,
    interval: 'month',
    features: {
      unlimitedRetakes: true,
      progressTracking: true,
      allAssessments: true,
      aiJobMatching: false,
      familyMembers: 5
    }
  }
};

export const getTierByProductId = (productId: string): SubscriptionTier | undefined => {
  return Object.values(SUBSCRIPTION_TIERS).find(tier => tier.productId === productId);
};

export const getTierById = (tierId: string): SubscriptionTier | undefined => {
  return SUBSCRIPTION_TIERS[tierId];
};

export const getFeatureLabel = (feature: keyof SubscriptionFeatures): string => {
  const labels: Record<keyof SubscriptionFeatures, string> = {
    unlimitedRetakes: 'Unlimited Assessment Retakes',
    progressTracking: 'Progress Tracking Dashboard',
    allAssessments: 'All Assessments Unlocked',
    aiJobMatching: 'AI Job Matching & Coaching',
    familyMembers: 'Family Member Slots'
  };
  return labels[feature];
};
