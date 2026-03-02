import { supabase } from '@/integrations/supabase/client';
import {
  beginHiringSubscribeAttempt,
  endHiringSubscribeAttempt,
} from '@/lib/hiringSubscribeLock';

export type SubscribeHiringResult = {
  success?: boolean;
  error?: string;
  step?: string;
  requiresAction?: boolean;
  actionUrl?: string;
  status?: string;
  subscriptionId?: string | null;
  creditApplied?: number;
  cardCharged?: number;
  alreadyExisted?: boolean;
};

type EdgeErrorPayload = {
  error?: string;
  step?: string;
  requiresAction?: boolean;
  actionUrl?: string;
};

export const subscribeHiring = async (companyId: string): Promise<SubscribeHiringResult> => {
  const lock = beginHiringSubscribeAttempt(companyId);
  if (!lock.acquired) {
    return {
      success: false,
      error: 'A subscription request is already being processed. Please wait a moment and try again.',
      step: 'already_processing',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('subscribe-hiring-tab', {
      body: {
        companyId,
        requestId: lock.requestId,
      },
    });

    if (error) {
      let payload: EdgeErrorPayload | null = null;
      try {
        const context = (error as { context?: { json?: () => Promise<EdgeErrorPayload> } }).context;
        payload = (await context?.json?.()) ?? null;
      } catch {
        // keep fallback below
      }
      return {
        success: false,
        error: payload?.error || data?.error || error.message || 'Subscription failed.',
        step: payload?.step || data?.step || 'invoke_error',
        requiresAction: payload?.requiresAction || data?.requiresAction,
        actionUrl: payload?.actionUrl || data?.actionUrl,
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Subscription failed: no response from server.',
        step: 'empty_response',
      };
    }

    return data as SubscribeHiringResult;
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Subscription failed unexpectedly.',
      step: 'unexpected_error',
    };
  } finally {
    endHiringSubscribeAttempt(companyId, lock.requestId);
  }
};
