import { UserSession, DeviceInfo } from '../types/erp';

const ACTIVE_SESSION_KEY = 'recura_active_session_v2';
const ALL_SESSIONS_KEY = 'recura_all_sessions_v2';
const BROADCAST_CHANNEL_NAME = 'recura_session_sync_channel';

// Start with no demo sessions — rely on real sessions stored in DB or provided by auth
const DEFAULT_DEMO_SESSIONS: UserSession[] = [];

// Persisted session store with localStorage fallback
function loadPersistedSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function persistActiveSession(session: UserSession | null): void {
  try {
    if (session) {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  } catch { /* quota exceeded or private mode */ }
}

function loadPersistedAllSessions(): UserSession[] {
  try {
    const raw = localStorage.getItem(ALL_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistAllSessions(sessions: UserSession[]): void {
  try {
    localStorage.setItem(ALL_SESSIONS_KEY, JSON.stringify(sessions));
  } catch { /* quota exceeded or private mode */ }
}

let activeMemorySession: UserSession | null = loadPersistedSession();
let allMemorySessions: UserSession[] = loadPersistedAllSessions();

/**
 * Broadcasts session state changes across browser tabs via BroadcastChannel if available
 */
function broadcastSessionEvent(type: 'SESSION_CREATED' | 'SESSION_REFRESHED' | 'SESSION_TERMINATED' | 'SESSIONS_UPDATED', payload?: any) {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage({ type, payload, timestamp: Date.now() });
      bc.close();
    }
  } catch {
    // Ignore cross-origin restrictions gracefully
  }
}

/**
 * Gets all stored sessions from memory
 */
export function getAllSessions(): UserSession[] {
  return allMemorySessions;
}

/**
 * Saves all sessions to memory
 */
export function saveAllSessions(sessions: UserSession[]) {
  allMemorySessions = sessions;
  persistAllSessions(sessions);
}

/**
 * Gets the current active session from memory
 */
export function getActiveSession(): UserSession | null {
  if (!activeMemorySession || activeMemorySession.status !== 'ACTIVE') {
    return null;
  }

  const now = new Date().getTime();
  const expiryTime = new Date(activeMemorySession.expiresAt).getTime();

  if (now >= expiryTime) {
    terminateActiveSession('EXPIRED');
    return null;
  }

  return activeMemorySession;
}

/**
 * Save active session to memory
 */
export function saveActiveSession(session: UserSession): void {
  const activeSession: UserSession = {
    ...session,
    status: 'ACTIVE',
    deviceInfo: {
      ...session.deviceInfo,
      isCurrentDevice: true,
    },
  };

  activeMemorySession = activeSession;
  persistActiveSession(activeSession);

  // Update all sessions array
  const existingIndex = allMemorySessions.findIndex(
    (s) => s.id === session.id || s.sessionToken === session.sessionToken
  );

  if (existingIndex >= 0) {
    allMemorySessions[existingIndex] = activeSession;
  } else {
    allMemorySessions.unshift(activeSession);
  }

  persistAllSessions(allMemorySessions);
  broadcastSessionEvent('SESSION_CREATED', activeSession);
}

/**
 * Validates if the current session token is active and valid
 */
export function validateSession(): { isValid: boolean; session: UserSession | null; message?: string } {
  const session = getActiveSession();
  if (!session) {
    return { isValid: false, session: null, message: 'No active session found or session expired.' };
  }

  const now = new Date().getTime();
  const expiry = new Date(session.expiresAt).getTime();

  if (now >= expiry) {
    terminateActiveSession('EXPIRED');
    return { isValid: false, session: null, message: 'Session has expired.' };
  }

  if (session.status !== 'ACTIVE') {
    terminateActiveSession('REMOTE_TERMINATION');
    return { isValid: false, session: null, message: 'Session has been terminated.' };
  }

  return { isValid: true, session };
}

/**
 * Refreshes active session - extends expiration by specified hours (default 12h)
 */
export function refreshActiveSession(extensionHours = 12): UserSession | null {
  const session = getActiveSession();
  if (!session) return null;

  const now = new Date();
  const newExpiresAt = new Date(now.getTime() + extensionHours * 60 * 60 * 1000).toISOString();

  const refreshedSession: UserSession = {
    ...session,
    lastActiveAt: now.toISOString(),
    expiresAt: newExpiresAt,
  };

  saveActiveSession(refreshedSession);
  broadcastSessionEvent('SESSION_REFRESHED', refreshedSession);

  return refreshedSession;
}

/**
 * Touches session activity timestamp (throttled)
 */
let lastTouchTime = 0;
export function touchSessionActivity(): void {
  const now = Date.now();
  if (now - lastTouchTime < 30000) return; // throttle every 30s
  lastTouchTime = now;

  const session = getActiveSession();
  if (session) {
    session.lastActiveAt = new Date().toISOString();
  }
}

/**
 * Terminates the active session and notifies other tabs
 */
export function terminateActiveSession(reason: 'LOGOUT' | 'EXPIRED' | 'REMOTE_TERMINATION' = 'LOGOUT'): void {
  // Read the raw stored session directly (NOT getActiveSession) to avoid infinite
  // recursion when terminating an already-expired session: getActiveSession() calls
  // terminateActiveSession('EXPIRED') for expired sessions, which must not re-enter
  // getActiveSession().
  const session = activeMemorySession;
  if (session) {
    // Mark as terminated in all memory sessions
    allMemorySessions = allMemorySessions.map((s) => (s.id === session.id ? { ...s, status: 'TERMINATED' as const } : s));
  }

  activeMemorySession = null;
  persistActiveSession(null);
  persistAllSessions(allMemorySessions);
  broadcastSessionEvent('SESSION_TERMINATED', { reason });
}

/**
 * Gets all user sessions for active user (including remote devices)
 */
export function getUserSessions(userId: string, currentSessionId?: string): UserSession[] {
  const all = getAllSessions();
  return all
    .filter((s) => s.userId === userId || s.userEmail.includes('@recura'))
    .map((s) => ({
      ...s,
      deviceInfo: {
        ...s.deviceInfo,
        isCurrentDevice: currentSessionId ? s.id === currentSessionId : s.deviceInfo.isCurrentDevice,
      },
    }));
}

/**
 * Terminates specific session ID remotely
 */
export function terminateSessionById(sessionId: string, currentSessionId?: string): void {
  const all = getAllSessions();
  const updated = all.filter((s) => s.id !== sessionId);
  saveAllSessions(updated);

  if (sessionId === currentSessionId) {
    terminateActiveSession('REMOTE_TERMINATION');
  } else {
    broadcastSessionEvent('SESSIONS_UPDATED', { terminatedId: sessionId });
  }
}

/**
 * Terminates all other remote sessions for the user
 */
export function terminateAllOtherSessions(currentSessionId: string): void {
  const all = getAllSessions();
  const updated = all.filter((s) => s.id === currentSessionId);
  saveAllSessions(updated);
  broadcastSessionEvent('SESSIONS_UPDATED', { action: 'TERMINATED_OTHERS' });
}

/**
 * Multi-Tab Session Synchronization setup listener
 */
export function setupMultiTabSessionSync(onSyncEvent: (type: string, payload?: any) => void): () => void {
  let bc: BroadcastChannel | null = null;

  if (typeof BroadcastChannel !== 'undefined') {
    bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    bc.onmessage = (event) => {
      if (event.data && event.data.type) {
        onSyncEvent(event.data.type, event.data.payload);
      }
    };
  }

  return () => {
    if (bc) bc.close();
  };
}
