import { useSyncExternalStore } from 'react';

const LOCK_PREFIX = 'rcf_hiring_subscribe_lock_';
const LOCK_TTL_MS = 2 * 60 * 1000;
const CHANNEL_NAME = 'rcf_hiring_subscribe_lock_channel';

type HiringSubscribeLock = {
  companyId: string;
  requestId: string;
  expiresAt: number;
};

type LockListener = () => void;

const listeners = new Set<LockListener>();
const inMemoryLocks = new Map<string, HiringSubscribeLock>();

let initialized = false;
let broadcastChannel: BroadcastChannel | null = null;

const getStorageKey = (companyId: string) => `${LOCK_PREFIX}${companyId}`;

const now = () => Date.now();

const createRequestId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Math.random().toString(36).slice(2)}-${now()}`;

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

const postLockUpdate = (companyId: string) => {
  if (!broadcastChannel) return;
  broadcastChannel.postMessage({ companyId });
};

const parseStoredLock = (raw: string | null): HiringSubscribeLock | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<HiringSubscribeLock>;
    if (
      typeof parsed.companyId === 'string' &&
      typeof parsed.requestId === 'string' &&
      typeof parsed.expiresAt === 'number'
    ) {
      return parsed as HiringSubscribeLock;
    }
  } catch {
    // ignore malformed storage entries
  }
  return null;
};

const readStorageLock = (companyId: string): HiringSubscribeLock | null => {
  if (typeof window === 'undefined') return inMemoryLocks.get(companyId) ?? null;

  const key = getStorageKey(companyId);
  const lock = parseStoredLock(window.localStorage.getItem(key));
  if (!lock) return null;

  if (lock.expiresAt <= now()) {
    window.localStorage.removeItem(key);
    return null;
  }

  return lock;
};

const writeStorageLock = (lock: HiringSubscribeLock) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getStorageKey(lock.companyId), JSON.stringify(lock));
};

const clearStorageLock = (companyId: string, requestId?: string) => {
  if (typeof window === 'undefined') return;
  const key = getStorageKey(companyId);
  const current = parseStoredLock(window.localStorage.getItem(key));
  if (!current) return;
  if (requestId && current.requestId !== requestId) return;
  window.localStorage.removeItem(key);
};

const syncFromStorage = (companyId: string) => {
  const storageLock = readStorageLock(companyId);
  if (storageLock) {
    inMemoryLocks.set(companyId, storageLock);
  } else {
    inMemoryLocks.delete(companyId);
  }
  notifyListeners();
};

const ensureInitialized = () => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('storage', (event) => {
    if (!event.key || !event.key.startsWith(LOCK_PREFIX)) return;
    const companyId = event.key.slice(LOCK_PREFIX.length);
    syncFromStorage(companyId);
  });

  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      const companyId = event?.data?.companyId;
      if (typeof companyId !== 'string') return;
      syncFromStorage(companyId);
    };
  }
};

export const subscribeHiringLock = (listener: LockListener) => {
  ensureInitialized();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const isHiringSubscribeInFlight = (companyId: string) => {
  ensureInitialized();

  const memoryLock = inMemoryLocks.get(companyId);
  if (memoryLock && memoryLock.expiresAt > now()) {
    return true;
  }

  const storageLock = readStorageLock(companyId);
  if (storageLock) {
    inMemoryLocks.set(companyId, storageLock);
    return true;
  }

  inMemoryLocks.delete(companyId);
  return false;
};

export const beginHiringSubscribeAttempt = (companyId: string) => {
  ensureInitialized();

  if (isHiringSubscribeInFlight(companyId)) {
    return {
      acquired: false as const,
      reason: 'already_processing' as const,
    };
  }

  const lock: HiringSubscribeLock = {
    companyId,
    requestId: createRequestId(),
    expiresAt: now() + LOCK_TTL_MS,
  };

  // Storage-first write, then re-read as a best-effort race check.
  writeStorageLock(lock);
  const confirmed = readStorageLock(companyId);
  if (!confirmed || confirmed.requestId !== lock.requestId) {
    syncFromStorage(companyId);
    return {
      acquired: false as const,
      reason: 'already_processing' as const,
    };
  }

  inMemoryLocks.set(companyId, lock);
  notifyListeners();
  postLockUpdate(companyId);

  return {
    acquired: true as const,
    requestId: lock.requestId,
  };
};

export const endHiringSubscribeAttempt = (companyId: string, requestId: string) => {
  ensureInitialized();

  const memoryLock = inMemoryLocks.get(companyId);
  if (memoryLock?.requestId === requestId) {
    inMemoryLocks.delete(companyId);
  }

  clearStorageLock(companyId, requestId);
  notifyListeners();
  postLockUpdate(companyId);
};

export const useHiringSubscribeInFlight = (companyId: string) =>
  useSyncExternalStore(
    subscribeHiringLock,
    () => isHiringSubscribeInFlight(companyId),
    () => false
  );
