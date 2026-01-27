import { supabase } from '@/integrations/supabase/client';

interface AuditLogParams {
  companyId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  userEmail?: string;
}

/**
 * Log an action to the audit log for compliance tracking
 */
export async function logAuditEvent({
  companyId,
  action,
  entityType,
  entityId,
  details,
  userEmail,
}: AuditLogParams): Promise<void> {
  try {
    // Get current user if not provided
    let email = userEmail;
    let userId: string | undefined;
    
    if (!email) {
      const { data: { user } } = await supabase.auth.getUser();
      email = user?.email;
      userId = user?.id;
    }

    await supabase.functions.invoke('create-audit-log', {
      body: {
        companyId,
        action,
        entityType,
        entityId,
        details,
        userEmail: email,
        userId,
      },
    });
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.error('Error logging audit event:', error);
  }
}

// Predefined action types for consistency
export const AUDIT_ACTIONS = {
  // User management
  USER_INVITED: 'invite',
  USER_UPDATED: 'update',
  USER_DELETED: 'delete',
  USER_REVOKED: 'revoke',
  USER_RESTORED: 'restore',
  
  // Candidate management
  CANDIDATE_INVITED: 'invite',
  CANDIDATE_HIRED: 'hire',
  CANDIDATE_ARCHIVED: 'archive',
  CANDIDATE_DELETED: 'delete',
  
  // Settings
  SETTINGS_UPDATED: 'settings',
  BRANDING_UPDATED: 'settings',
  
  // Payments
  PAYMENT_COMPLETED: 'payment',
  CREDITS_ADDED: 'payment',
  
  // Assessments
  ASSESSMENT_VIEWED: 'view',
  ASSESSMENT_RESET: 'update',
  
  // API
  API_KEY_CREATED: 'create',
  API_KEY_REVOKED: 'revoke',
} as const;

export const AUDIT_ENTITIES = {
  USER: 'user',
  CANDIDATE: 'candidate',
  COMPANY: 'company',
  SETTINGS: 'settings',
  ASSESSMENT: 'assessment',
  PAYMENT: 'payment',
  API_KEY: 'api_key',
  REMINDER: 'reminder',
  TASK: 'task',
} as const;
