import { UserSession, DeviceInfo } from '../types/erp';

const ACTIVE_SESSION_KEY = 'recura_active_session_v2';
const ALL_SESSIONS_KEY = 'recura_all_sessions_v2';
const BROADCAST_CHANNEL_NAME = 'recura_session_sync_channel';

// Default mock initial sessions for device tracking demonstration
const DEFAULT_DEMO_SESSIONS: UserSession[] = [
  {
    id: 'sess_remote_mobile_01',
    userId: 'user_admin_1',
    userEmail: 'admin@recura.io',
    userName: 'James Noah',
    sessionToken: 'recura_sess_mobile_iphone15_9982',
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    lastActiveAt: new Date(Date.now() - 1800 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 3600 * 1000 * 8).toISOString(),
    ipAddress: '102.164.88.12',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
    deviceInfo: {
      browser: 'Mobile Safari',
      os: 'iOS 17.4',
      deviceType: 'Mobile',
      deviceName: 'iPhone 15 Pro (London, UK)',
      isCurrentDevice: false,
    },
    status: 'ACTIVE',
    cookieFlags: {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
    },
  },
  {
    id: 'sess_remote_win_02',
    userId: 'user_admin_1',
    userEmail: 'admin@recura.io',
    userName: 'James Noah',
    sessionToken: 'recura_sess_win11_edge_1102',
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 3600 * 1000 * 12).toISOString(),
    ipAddress: '197.230.14.99',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
    deviceInfo: {
      browser: 'Microsoft Edge',
      os: 'Windows 11 Enterprise',
      deviceType: 'Desktop',
      deviceName: 'Workstation PC (Paris, FR)',
      isCurrentDevice: false,
    },
    status: 'ACTIVE',
    cookieFlags: {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
    },
  },
];

// In-memory session store replacing browser localStorage
let activeMemorySession: UserSession | null = null;
let allMemorySessions: UserSession[] = [...DEFAULT_DEMO_SESSIONS];

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

  // Update all sessions array
  const existingIndex = allMemorySessions.findIndex(
    (s) => s.id === session.id || s.sessionToken === session.sessionToken
  );

  if (existingIndex >= 0) {
    allMemorySessions[existingIndex] = activeSession;
  } else {
    allMemorySessions.unshift(activeSession);
  }

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
  const session = getActiveSession();
  if (session) {
    // Mark as terminated in all memory sessions
    allMemorySessions = allMemorySessions.map((s) => (s.id === session.id ? { ...s, status: 'TERMINATED' as const } : s));
  }

  activeMemorySession = null;
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
