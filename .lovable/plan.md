
# B2C Subscription Model Implementation Plan

## Overview
This plan completes the B2C subscription integration for RoleColorFinder's individual users. The core infrastructure (Stripe integration, edge functions, subscription tiers, and components) is already built. This implementation focuses on connecting all the pieces and creating a cohesive subscriber experience.

---

## Current State Summary

The following components are already implemented:
- 5 subscription tiers with Stripe products/prices
- Edge functions: `create-subscription-checkout`, `check-subscription`, `customer-portal`, `invite-family-member`
- Components: `SubscriptionCard`, `SubscriptionStatus`, `ProgressTracking`, `FamilyMemberManager`
- Database table: `user_subscriptions`
- AuthContext with subscription state tracking

---

## Implementation Tasks

### Phase 1: Dashboard Subscription Integration

**1.1 Add Subscription Section to Dashboard**
- Add a new "Subscription" tab to the sidebar navigation
- Display `SubscriptionStatus` component for active subscribers
- Show `ProgressTracking` component (charts of assessment history over time)
- For Family plan subscribers, show `FamilyMemberManager`
- For non-subscribers, show upgrade CTA with tier comparison

**1.2 Sidebar Updates**
- Add "Subscription" icon and link to sidebar
- Show subscription badge (tier name) next to user profile in sidebar

**Files to modify:**
- `src/pages/Dashboard.tsx`

---

### Phase 2: Assessment Flow Subscriber Benefits

**2.1 Bypass Payment for Subscribers**
- Modify `PaymentButton` component to detect active subscription
- If user has `unlimitedRetakes: true` feature, allow direct assessment access
- If user has `allAssessments: true`, unlock all assessment types

**2.2 Assessment Type Gating**
- Create utility function `canAccessAssessment(assessmentType, subscription)`
- Gate Premium and Pro assessments based on subscription features

**Files to modify:**
- `src/components/payment/PaymentButton.tsx`
- Create: `src/lib/subscriptionAccess.ts`
- `src/pages/PremiumAssessment.tsx`
- `src/pages/ProAssessment.tsx`

---

### Phase 3: Pricing Page Subscription Section

**3.1 Add Subscription Plans Section**
- Add new section below one-time purchases: "Subscription Plans"
- Render `SubscriptionCard` components for all 5 tiers
- Show monthly/annual toggle for Pro tier
- Highlight current plan for logged-in subscribers

**3.2 Feature Comparison**
- Extend existing comparison table to include subscription tiers
- Show feature matrix: Retakes, Progress Tracking, All Assessments, AI Job Matching, Family Members

**Files to modify:**
- `src/pages/Pricing.tsx`

---

### Phase 4: Subscription Management Polish

**4.1 Cancel/Downgrade Flow**
- Customer portal already handles this via Stripe
- Add toast notifications after returning from portal
- Detect subscription changes and update UI

**4.2 Subscription Renewal Reminders**
- Add visual indicator when subscription is near expiration
- Show in Dashboard overview section

**Files to modify:**
- `src/pages/Dashboard.tsx`
- `src/components/subscription/SubscriptionStatus.tsx`

---

### Phase 5: Family Plan Enhancements

**5.1 Invitation Email Flow**
- Update `invite-family-member` edge function to send actual invitation emails
- Use existing `send-email` function with new template

**5.2 Member Acceptance Flow**
- Create acceptance page for new family members
- Auto-link when member creates account with invited email

**Files to modify:**
- `supabase/functions/invite-family-member/index.ts`
- `supabase/functions/send-email/index.ts`
- Create: `src/pages/FamilyInviteAccept.tsx`

---

## Technical Details

### Subscription Access Utility
```text
src/lib/subscriptionAccess.ts

Functions:
- canRetakeAssessment(subscription) -> boolean
- canAccessAssessment(type, subscription) -> boolean
- getAvailableAssessments(subscription) -> string[]
- hasFeature(feature, subscription) -> boolean
```

### Dashboard Subscription Tab Structure
```text
Subscription Section:
+-- SubscriptionStatus card (tier, renewal date, manage button)
+-- ProgressTracking card (if has progressTracking feature)
+-- FamilyMemberManager card (if has familyMembers > 0)
+-- Upgrade CTA (if free tier)
```

### PaymentButton Logic Update
```text
if (user.subscription.features[relevantFeature]) {
  // Direct access - no payment needed
  navigate to assessment
} else {
  // Show Stripe checkout
  current behavior
}
```

---

## Database Considerations

The `user_subscriptions` table already exists with proper schema. No migrations needed.

Family plan membership is tracked in `family_plan_members` table (already exists).

---

## Edge Function Updates

**invite-family-member**: Add email sending via `send-email` function
- Template: Welcome to family plan, click to activate

---

## Estimated Implementation Order

1. Dashboard subscription section (high visibility, quick win)
2. Assessment flow integration (core subscriber value)
3. Pricing page updates (conversion optimization)
4. Family plan email flow (polish)
5. Renewal reminders (retention)

---

## Success Criteria

- Subscribers see their tier and benefits in Dashboard
- Subscribers with `unlimitedRetakes` can retake without payment
- Pricing page clearly shows subscription options
- Family plan owners can invite and manage members
- Progress tracking charts visible for subscribers
