import React, { useState } from 'react';
import { X, UserPlus, User, Mail, KeyRound, AtSign, AlertCircle, Check, Circle } from 'lucide-react';
import { UserProfile, UserRole } from '../../types/erp';
import { sanitizeInput, sanitizeUsername, validateEmail, stripControlCharacters } from '../../utils/security';

interface NewProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  existingProfiles?: UserProfile[];
}

export const NewProfileModal: React.FC<NewProfileModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingProfiles = [],
}) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('AGENT');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Password requirement flags
  const hasMinLength = password.length > 8; // More than 8 characters
  const hasCapital = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanFullName = sanitizeInput(fullName, { maxLen: 100, allowSpaces: true });
    const usernameCheck = sanitizeUsername(username);
    const emailCheck = validateEmail(email);
    const cleanPassword = stripControlCharacters(password);

    if (!cleanFullName) {
      setError('Full Name is required.');
      return;
    }

    if (!usernameCheck.isValid) {
      setError(usernameCheck.error || 'Invalid username.');
      return;
    }

    if (!emailCheck.isValid) {
      setError(emailCheck.error || 'Invalid email address.');
      return;
    }

    // Check if username already exists in database/profiles (case sensitive)
    const usernameExists = existingProfiles.some((p) => p.username === usernameCheck.clean);

    if (usernameExists) {
      setError(`Username "${usernameCheck.clean}" already exists`);
      return;
    }

    // Validate password rules
    if (!hasMinLength) {
      setError('Password must contain more than 8 characters.');
      return;
    }
    if (!hasCapital) {
      setError('Password must contain at least one capital letter (A-Z).');
      return;
    }
    if (!hasNumber) {
      setError('Password must contain at least one number (0-9).');
      return;
    }
    if (!hasSymbol) {
      setError('Password must contain at least one symbol (e.g. !@#$%^&*).');
      return;
    }

    onSubmit({
      fullName: cleanFullName,
      username: usernameCheck.clean,
      email: emailCheck.clean,
      password: cleanPassword,
      role,
    });

    // Reset form state
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('AGENT');
    setError(null);
    onClose();
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 cursor-pointer"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#4A90FF] flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#111827]">Create New User Profile</h3>
              <p className="text-xs text-slate-500 font-medium">Add staff or administrator accounts</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert Box with Prominent Red Background & Bold Grey Text */}
        {error && (
          <div className="mb-4 p-3.5 bg-red-600 text-slate-100 border border-red-700 rounded-2xl text-xs flex items-center gap-2.5 font-extrabold shadow-md animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-slate-200 shrink-0" />
            <div>
              <p className="font-extrabold text-slate-100 tracking-wide">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Full Name */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. Sarah Connor"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:bg-white focus:border-[#4A90FF] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Username *</label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  const noSpacesVal = e.target.value.replace(/\s+/g, '');
                  setUsername(noSpacesVal);
                  if (error) setError(null);
                }}
                placeholder="e.g. sarah_connor"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:bg-white focus:border-[#4A90FF] focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">No spaces allowed. Case-sensitive matching.</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. sarah@recura.io"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:bg-white focus:border-[#4A90FF] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Login Password */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Login Password *</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter secure password"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:bg-white focus:border-[#4A90FF] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Password Validation Requirements List */}
            <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                Password Requirements
              </p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  {hasMinLength ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <Circle className="w-2.5 h-2.5 text-slate-300 shrink-0" />}
                  <span>&gt; 8 characters</span>
                </div>

                <div className={`flex items-center gap-1.5 ${hasCapital ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  {hasCapital ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <Circle className="w-2.5 h-2.5 text-slate-300 shrink-0" />}
                  <span>1 Capital Letter</span>
                </div>

                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  {hasNumber ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <Circle className="w-2.5 h-2.5 text-slate-300 shrink-0" />}
                  <span>1 Number (0-9)</span>
                </div>

                <div className={`flex items-center gap-1.5 ${hasSymbol ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  {hasSymbol ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <Circle className="w-2.5 h-2.5 text-slate-300 shrink-0" />}
                  <span>1 Symbol (!@#$)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Access Level / Role */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">System Access Level & Role *</label>
            <div className="grid grid-cols-1 gap-2">
              <label
                className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                  role === 'AGENT'
                    ? 'border-[#4A90FF] bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-[#E8EAF0] bg-[#F5F7FA] hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="userRole"
                  value="AGENT"
                  checked={role === 'AGENT'}
                  onChange={() => setRole('AGENT')}
                  className="mt-0.5 text-[#4A90FF]"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[#111827]">Agent (Orders & Customers)</span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Low-Level
                    </span>
                  </div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                  role === 'ADMIN'
                    ? 'border-[#4A90FF] bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-[#E8EAF0] bg-[#F5F7FA] hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="userRole"
                  value="ADMIN"
                  checked={role === 'ADMIN'}
                  onChange={() => setRole('ADMIN')}
                  className="mt-0.5 text-[#4A90FF]"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[#111827]">System Administrator</span>
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      Full Control
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-[#4A90FF] hover:opacity-85 transition-opacity duration-200 text-white font-bold shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
