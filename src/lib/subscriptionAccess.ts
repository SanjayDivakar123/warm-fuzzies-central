import { SubscriptionFeatures } from "./subscriptionTiers";

interface SubscriptionState {
  isSubscribed: boolean;
  tier: string;
  productId: string | null;
  subscriptionEnd: string | null;
  features: SubscriptionFeatures;
}

/**
 * Check if user can retake assessments without payment
 */
export const canRetakeAssessment = (subscription: SubscriptionState | undefined): boolean => {
  if (!subscription) return false;
  return subscription.isSubscribed && subscription.features?.unlimitedRetakes === true;
};

/**
 * Check if user has access to a specific assessment type
 * @param assessmentType - 'free' | 'premium' | 'pro'
 * @param subscription - Current subscription state
 */
export const canAccessAssessment = (
  assessmentType: 'free' | 'premium' | 'pro',
  subscription: SubscriptionState | undefined
): boolean => {
  // Free assessment is always accessible
  if (assessmentType === 'free') return true;
  
  if (!subscription || !subscription.isSubscribed) return false;
  
  // If user has allAssessments feature, they can access everything
  if (subscription.features?.allAssessments) return true;
  
  // Subscribers with unlimited retakes can retake assessments they've already purchased
  // but they still need to have purchased the initial access
  return false;
};

/**
 * Check if subscriber can bypass payment for a one-time assessment
 * This is for retaking assessments they've already completed
 */
export const canBypassPayment = (
  assessmentType: 'premium' | 'pro',
  subscription: SubscriptionState | undefined,
  hasCompletedAssessmentBefore: boolean
): boolean => {
  if (!subscription || !subscription.isSubscribed) return false;
  
  // If user has allAssessments, they can always bypass
  if (subscription.features?.allAssessments) return true;
  
  // If user has unlimited retakes AND has completed this assessment before
  if (subscription.features?.unlimitedRetakes && hasCompletedAssessmentBefore) return true;
  
  return false;
};

/**
 * Get list of assessments available to the user
 */
export const getAvailableAssessments = (subscription: SubscriptionState | undefined): string[] => {
  const available = ['free'];
  
  if (!subscription || !subscription.isSubscribed) return available;
  
  if (subscription.features?.allAssessments) {
    return ['free', 'premium', 'pro'];
  }
  
  return available;
};

/**
 * Check if user has a specific subscription feature
 */
export const hasFeature = (
  feature: keyof SubscriptionFeatures,
  subscription: SubscriptionState | undefined
): boolean => {
  if (!subscription || !subscription.isSubscribed) return false;
  
  const value = subscription.features?.[feature];
  
  // Handle numeric features (like familyMembers)
  if (typeof value === 'number') return value > 0;
  
  return value === true;
};

/**
 * Check if subscription is expiring soon (within 7 days)
 */
export const isSubscriptionExpiringSoon = (subscription: SubscriptionState | undefined): boolean => {
  if (!subscription?.subscriptionEnd) return false;
  
  const endDate = new Date(subscription.subscriptionEnd);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
};

/**
 * Get days until subscription expires
 */
export const getDaysUntilExpiry = (subscription: SubscriptionState | undefined): number | null => {
  if (!subscription?.subscriptionEnd) return null;
  
  const endDate = new Date(subscription.subscriptionEnd);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry;
};
