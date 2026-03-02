/**
 * Shared singleton lock for subscribe-hiring-tab calls.
 *
 * HiringSection and HiringSubscriptionSettings are both mounted simultaneously
 * (forceMount tabs), so they each had their own independent ref — meaning both
 * could fire concurrently. This module-level object is shared across all
 * component instances and blocks any duplicate call process-wide.
 */
export const hiringSubscribeLock = { inFlight: false };
