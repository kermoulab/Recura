import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Smartphone,
  Laptop,
  Tablet,
  RefreshCw,
  LogOut,
  Clock,
  KeyRound,
  CheckCircle2,
  X,
  AlertTriangle,
  Radio,
  Lock,
} from 'lucide-react';
import { UserSession } from '../../types/erp';
import {
  getActiveSession,
  refreshActiveSession,
  getUserSessions,
  terminateSessionById,
  terminateAllOtherSessions,
  touchSessionActivity,
} from '../../utils/sessionManager';

interface ActiveSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  currentUserId: string;
  onSessionTerminated?: () => void;
  onSessionRefreshed?: (updatedSession: UserSession) => void;
}

export function ActiveSessionsModal({
  isOpen,
  onClose,
  currentUserEmail,
  currentUserId,
  onSessionTerminated,
  onSessionRefreshed,
}: ActiveSessionsModalProps) {
  const [activeSession, setActiveSession] = useState<UserSession | null>(null);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const loadSessionsData = () => {
    const current = getActiveSession();
    setActiveSession(current);
    if (current) {
      const allForUser = getUserSessions(currentUserId || current.userId, current.id);
      setUserSessions(allForUser);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSessionsData();
      touchSessionActivity();
    }
  }, [isOpen, currentUserId]);

  // Expiration countdown timer
  useEffect(() => {
    if (!activeSession || !isOpen) return;

    const calculateRemaining = () => {
      const now = Date.now();
      const expires = new Date(activeSession.expiresAt).getTime();
      const diffSec = Math.floor((expires - now) / 1000);

      if (diffSec <= 0) {
        setTimeRemaining('Expired');
        if (onSessionTerminated) onSessionTerminated();
        return;
      }

      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [activeSession, isOpen, onSessionTerminated]);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const refreshed = refreshActiveSession(12);
      if (refreshed) {
        setActiveSession(refreshed);
        if (onSessionRefreshed) onSessionRefreshed(refreshed);
        setActionSuccessMsg('Session extended by +12 Hours.');
        loadSessionsData();
      }
      setIsRefreshing(false);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }, 400);
  };

  const handleRevokeSingle = (sessionId: string, isCurrent: boolean) => {
    terminateSessionById(sessionId, activeSession?.id);
    if (isCurrent) {
      if (onSessionTerminated) onSessionTerminated();
    } else {
      setActionSuccessMsg('Remote session revoked successfully.');
      loadSessionsData();
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  const handleRevokeOthers = () => {
    if (!activeSession) return;
    terminateAllOtherSessions(activeSession.id);
    setActionSuccessMsg('All other device sessions terminated.');
    loadSessionsData();
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'Mobile':
        return <Smartphone className="w-4 h-4 text-purple-600" />;
      case 'Tablet':
        return <Tablet className="w-4 h-4 text-emerald-600" />;
      default:
        return <Laptop className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E8EAF0] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#111827]">Active Sessions & Devices</h2>
              <p className="text-xs text-[#6B7280] font-medium">
                Manage live authentication tokens, cookie policies, and remote devices for {currentUserEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action feedback message */}
        {actionSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Current Active Session Status Box */}
        {activeSession ? (
          <div className="p-4 bg-gradient-to-br from-blue-50/80 to-slate-50 border border-blue-100 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-extrabold text-blue-950">Current Valid Session</span>
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  {activeSession.sessionToken.slice(0, 20)}...
                </span>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Session (+12h)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-[11px] border-t border-blue-100/60">
              <div>
                <span className="text-slate-500 block">Session Time Left:</span>
                <span className="font-mono font-bold text-slate-900 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  {timeRemaining || 'Valid'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Device:</span>
                <span className="font-bold text-slate-900">{activeSession.deviceInfo.deviceName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">IP Address:</span>
                <span className="font-mono font-bold text-slate-900">{activeSession.ipAddress}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Cookie Security:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> SameSite=Strict
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
            No active session detected.
          </div>
        )}

        {/* Device Tracking & Remote Sessions List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-[#111827] flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-500" />
              <span>Tracked Devices & Remote Sessions ({userSessions.length})</span>
            </h3>

            {userSessions.length > 1 && (
              <button
                type="button"
                onClick={handleRevokeOthers}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Revoke All Other Devices
              </button>
            )}
          </div>

          <div className="space-y-2 text-xs">
            {userSessions.map((sess) => {
              const isCurrent = sess.id === activeSession?.id || sess.deviceInfo.isCurrentDevice;

              return (
                <div
                  key={sess.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isCurrent ? 'bg-white border-blue-300 ring-2 ring-blue-100 shadow-2xs' : 'bg-[#F8FAFC] border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      {getDeviceIcon(sess.deviceInfo.deviceType)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">{sess.deviceInfo.deviceName}</span>
                        {isCurrent ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            Current Device
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                            Remote Device
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5 font-medium">
                        <span>IP: {sess.ipAddress}</span>
                        <span>•</span>
                        <span>Browser: {sess.deviceInfo.browser}</span>
                        <span>•</span>
                        <span>
                          Expires: {new Date(sess.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRevokeSingle(sess.id, isCurrent)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer flex items-center gap-1 ${
                        isCurrent
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700'
                      }`}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{isCurrent ? 'Log Out' : 'Revoke'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Rules & Multi-tab info footer */}
        <div className="p-3.5 bg-slate-900 text-slate-300 rounded-2xl text-[11px] space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <span>Session Enforcement Policy Rules</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-400 font-medium leading-relaxed">
            <li>Protected routes automatically validate session authenticity on every transition.</li>
            <li>Expired tokens instantly purge session store and redirect to Login screen.</li>
            <li>Multi-tab state synchronization broadcasts logout/revocation across all open browser windows.</li>
            <li>Simulated HttpOnly, Secure, and SameSite=Strict browser cookie flags are enforced.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
