import React, { useState, useEffect } from 'react';
import { KeyRound, User, AlertTriangle, Eye, EyeOff, Clock, ShieldCheck } from 'lucide-react';
import { UserProfile, UserSession, AuditLog } from '../../types/erp';
import { RecuraLogoIcon, RecuraWordmark } from '../common/RecuraLogo';
import {
  securityRateLimiter,
  stripControlCharacters,
  sanitizeInput as securitySanitize,
  verifyArgon2idPassword,
  createSecureSessionToken,
} from '../../utils/security';

interface LoginViewProps {
  profiles: UserProfile[];
  onLoginSuccess: (user: UserProfile, session: UserSession) => void;
  onAuditLog?: (action: AuditLog['action'], details: string, status?: AuditLog['status']) => void;
}

const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_SECONDS = 30;

export const LoginView: React.FC<LoginViewProps> = ({ profiles, onLoginSuccess, onAuditLog }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Security & Rate Limiting state
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [botTrap, setBotTrap] = useState<string>(''); // Anti-bot honeypot field



  // Countdown effect for lockout timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setFailedAttempts(0); // Reset attempts after timer expires
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockoutTimer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // 1. Anti-Bot Honeypot check
      if (botTrap.length > 0) {
        setError('Invalid request.');
        onAuditLog?.('FAILED_LOGIN', 'Bot honeypot field triggered', 'FAILED');
        return;
      }

      // 2. Global Rate Limiter Check
      const rateCheck = securityRateLimiter.check('login_attempt', 5, 30000);
      if (!rateCheck.allowed) {
        const waitSec = Math.ceil((rateCheck.remainingMs || 30000) / 1000);
        setLockoutTimer(waitSec);
        setError(`Too many login requests. Please wait ${waitSec}s.`);
        onAuditLog?.('FAILED_LOGIN', `Rate limit exceeded`, 'FAILED');
        return;
      }

      // 3. Lockout Check
      if (lockoutTimer > 0) {
        setError(`Account temporarily locked for security. Please wait ${lockoutTimer}s.`);
        return;
      }

      // 4. Input Sanitization
      const cleanUsername = securitySanitize(username, { maxLen: 100, allowSpaces: false });
      const cleanPassword = stripControlCharacters(password);

      if (!cleanUsername || !cleanPassword) {
        setError('Invalid username or password.');
        onAuditLog?.('FAILED_LOGIN', 'Login attempt with empty username or password', 'FAILED');
        return;
      }

      // Step 2a: Check if username/email exists in database profiles
      const matchedUser = profiles.find(
        (p) =>
          (p.username && p.username.toLowerCase() === cleanUsername.toLowerCase()) ||
          p.email.toLowerCase() === cleanUsername.toLowerCase() ||
          p.email.split('@')[0].toLowerCase() === cleanUsername.toLowerCase()
      );

      // Step 2b: Verify password strictly against the stored password hash or legacy plaintext value
      const isPasswordValid = matchedUser
        ? await verifyArgon2idPassword(cleanPassword, matchedUser.passwordHash || matchedUser.password)
        : false;

      if (!matchedUser || !isPasswordValid) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        onAuditLog?.('FAILED_LOGIN', `Failed login attempt for identifier: ${cleanUsername}`, 'FAILED');

        if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
          setLockoutTimer(LOCKOUT_DURATION_SECONDS);
          setError(`Too many failed attempts. Login locked for ${LOCKOUT_DURATION_SECONDS}s.`);
        } else {
          setError('Invalid username or password.');
        }
        return;
      }

      // Step 2c: Check account status
      if (matchedUser.status === 'DISABLED' || matchedUser.status === 'BLOCKED' || matchedUser.isBlocked) {
        onAuditLog?.('FAILED_LOGIN', `Rejected login for disabled/blocked user: ${matchedUser.email}`, 'FAILED');
        setError('Account disabled.');
        return;
      }

      // Step 2d: Check active session limits
      const activeCount = matchedUser.activeSessionsCount ?? 1;
      const maxLimit = matchedUser.maxSessionsAllowed ?? 3;
      if (activeCount >= maxLimit) {
        onAuditLog?.('FAILED_LOGIN', `Session limit exceeded (${activeCount}/${maxLimit}) for: ${matchedUser.email}`, 'FAILED');
        setError('Session expired.');
        return;
      }

      // Step 2e: Create secure session
      const session = createSecureSessionToken(matchedUser.id, matchedUser.email, matchedUser.fullName);

      onAuditLog?.(
        'LOGIN',
        `User ${matchedUser.fullName} (${matchedUser.email}) authenticated. Session ${session.sessionToken} created.`,
        'SUCCESS'
      );

      setFailedAttempts(0);
      setLockoutTimer(0);
      onLoginSuccess(matchedUser, session);
    } catch {
      setError('Invalid username or password.');
      onAuditLog?.('FAILED_LOGIN', 'Unhandled login exception caught', 'FAILED');
    }
  };

  const isLocked = lockoutTimer > 0;

  return (
    <div id="recura-login-view" className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full relative z-10 space-y-6">
        {/* Recura Brand Header with Uploaded Split Image Logo */}
        <div className="text-center flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center mb-2">
            <RecuraLogoIcon className="w-16 h-16 drop-shadow-sm" />
          </div>
          <RecuraWordmark className="text-3xl" />
        </div>

        {/* Main Login Card - Light Dashboard Theme */}
        <div className="bg-white border border-[#E8EAF0] rounded-3xl p-7 shadow-xl space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[#111827]">Log in To Dashboard</h2>
            </div>
          </div>

          {/* Error Banner */}
          {isLocked ? (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs space-y-1 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-extrabold text-rose-900">
                <Clock className="w-4 h-4 text-rose-600 animate-spin" />
                <span>Security Cooldown Active ({lockoutTimer}s)</span>
              </div>
              <p className="text-[11px] text-rose-700 font-medium">
                Too many login attempts. Please wait for the lockout timer to expire.
              </p>
            </div>
          ) : error ? (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs flex items-center gap-2.5 font-medium animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <p className="font-bold text-rose-950">{error}</p>
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Anti-Bot Honeypot field */}
            <input
              type="text"
              name="website_trap"
              value={botTrap}
              onChange={(e) => setBotTrap(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px' }}
            />

            <div>
              <label className="block text-[#111827] font-extrabold mb-1.5">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  disabled={isLocked}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E8EAF0] text-[#111827] rounded-xl font-medium focus:outline-none focus:bg-white focus:border-[#4A90FF] focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 transition-all disabled:opacity-50 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#111827] font-extrabold mb-1.5">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLocked}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-[#E8EAF0] text-[#111827] rounded-xl font-medium focus:outline-none focus:bg-white focus:border-[#4A90FF] focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 transition-all disabled:opacity-50 disabled:bg-slate-100"
                />
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              disabled={isLocked}
              className="w-full py-3 bg-[#4A90FF] hover:opacity-85 transition-opacity duration-200 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer flex items-center justify-center gap-2 text-xs mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
            >
              {isLocked ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Log in Locked ({lockoutTimer}s)</span>
                </>
              ) : (
                <>
                  <span>Log in</span>
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

