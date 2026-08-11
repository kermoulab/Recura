import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Settings,
  User,
  ShieldCheck,
  MessageSquare,
  Globe,
  Download,
  KeyRound,
  Lock,
  Save,
  CheckCircle2,
  Database,
  Smartphone,
  Eye,
  EyeOff,
  UserCheck,
  AlertCircle,
  UserPlus,
  Users,
  Trash2,
  Check,
  Circle,
} from 'lucide-react';
import { Language, WhatsAppTemplate, UserProfile } from '../../types/erp';
import { DEFAULT_WHATSAPP_TEMPLATES } from '../../utils/whatsapp';
import { sanitizeInput, sanitizeUsername, validateEmail, stripControlCharacters, verifyArgon2idPassword } from '../../utils/security';

interface SettingsViewProps {
  currentUser?: UserProfile;
  profiles?: UserProfile[];
  currency?: string;
  onCurrencyChange?: (currency: string) => void;
  onExportAllData: () => void;
  onOpenNewProfileModal?: () => void;
  onUpdateCurrentProfile?: (data: { fullName: string; username?: string; email: string; password?: string }) => void;
  onSelectProfile?: (user: UserProfile) => void;
  onDeleteProfile?: (userId: string) => void;
  onOpenSessionsModal?: () => void;
  templates?: Record<Language, WhatsAppTemplate>;
  onSaveWhatsAppTemplates?: (templates: Record<Language, WhatsAppTemplate>) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser = {
    id: 'admin_1',
    fullName: 'James Noah',
    username: 'admin',
    email: 'admin@recura.io',
    password: undefined,
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$QdiQ/RMZXNk4nbzGNtQcIA$rFFVNx7nm/b4xDGMLbB8JIU6GTIH1cI3KA+bRMXmI+E',
    role: 'ADMIN',
    createdAt: '2026-01-01',
  },
  profiles = [],
  currency: currentGlobalCurrency = 'USD ($)',
  onCurrencyChange,
  onExportAllData,
  onOpenNewProfileModal,
  onUpdateCurrentProfile,
  onSelectProfile,
  onDeleteProfile,
  onOpenSessionsModal,
  templates: loadedTemplates = DEFAULT_WHATSAPP_TEMPLATES,
  onSaveWhatsAppTemplates,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';

  type SettingsTab = 'profile' | 'sessions' | 'system' | 'security' | 'whatsapp' | 'export';
  const ALL_SETTINGS_TABS: SettingsTab[] = ['profile', 'sessions', 'system', 'security', 'whatsapp', 'export'];
  const SETTINGS_TAB_KEY = 'recura_settings_active_tab_v1';

  function loadSettingsTab(): SettingsTab {
    try {
      const saved = localStorage.getItem(SETTINGS_TAB_KEY);
      return saved && (ALL_SETTINGS_TABS as string[]).includes(saved) ? (saved as SettingsTab) : 'profile';
    } catch {
      return 'profile';
    }
  }

  const [activeTab, setActiveTab] = useState<SettingsTab>(loadSettingsTab);
  const [currency, setCurrency] = useState(currentGlobalCurrency);

  useEffect(() => {
    setCurrency(currentGlobalCurrency);
  }, [currentGlobalCurrency]);

  // Persist active settings tab so refresh returns to the same tab
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_TAB_KEY, activeTab);
    } catch {
      /* ignore storage errors */
    }
  }, [activeTab]);

  // Reset to profile tab if restored tab is admin-only for a non-admin user
  useEffect(() => {
    const adminOnly: SettingsTab[] = ['sessions', 'system', 'security', 'whatsapp', 'export'];
    if (!isAdmin && adminOnly.includes(activeTab)) {
      setActiveTab('profile');
    }
  }, [isAdmin, activeTab]);
  const [sessionTimeout, setSessionTimeout] = useState('15');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Profile & Role state
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [username, setUsername] = useState(currentUser.username || '');
  const [email, setEmail] = useState(currentUser.email);
  const [selectedRole, setSelectedRole] = useState(currentUser.role);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(currentUser.fullName);
    setUsername(currentUser.username || '');
    setEmail(currentUser.email);
    setSelectedRole(currentUser.role);
    setProfileError(null);
  }, [currentUser]);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // WhatsApp Templates state
  const [templates, setTemplates] = useState<Record<Language, WhatsAppTemplate>>(loadedTemplates);
  const [activeLangTemplate, setActiveLangTemplate] = useState<Language>('AR');
  const [savingTemplates, setSavingTemplates] = useState(false);

  // Keep local template edits in sync when templates load/change from the DB
  useEffect(() => {
    setTemplates(loadedTemplates);
  }, [loadedTemplates]);

  const handleSaveTemplates = async () => {
    if (!onSaveWhatsAppTemplates) return;
    setSavingTemplates(true);
    try {
      await onSaveWhatsAppTemplates(templates);
      toast.success('WhatsApp templates saved successfully!');
    } catch {
      toast.error('Failed to save WhatsApp templates.');
    } finally {
      setSavingTemplates(false);
    }
  };

  const handleSaveSettings = () => {
    setProfileError(null);

    const cleanFullName = sanitizeInput(fullName, { maxLen: 100, allowSpaces: true });
    const usernameCheck = sanitizeUsername(username);
    const emailCheck = validateEmail(email);

    if (!cleanFullName) {
      setProfileError('Full Name is required. Please enter your name.');
      return;
    }

    if (!usernameCheck.isValid) {
      setProfileError(usernameCheck.error || 'Invalid username format.');
      return;
    }

    if (!emailCheck.isValid) {
      setProfileError(emailCheck.error || 'Invalid email address format.');
      return;
    }

    // Case-Sensitive Username Check against existing profiles (excluding current user)
    const duplicateProfile = profiles.find(
      (p) => p.id !== currentUser.id && p.username === usernameCheck.clean
    );

    if (duplicateProfile) {
      setProfileError(`Username "${usernameCheck.clean}" already exists. Duplicate username detected!`);
      return;
    }

    if (onUpdateCurrentProfile) {
      onUpdateCurrentProfile({ fullName: cleanFullName, username: usernameCheck.clean, email: emailCheck.clean });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Password requirement flags
  const hasMinLength = newPassword.length > 8;
  const hasCapital = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^a-zA-Z0-9]/.test(newPassword);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Current Password is required.');
      return;
    }

    const isCurrentPasswordValid = await verifyArgon2idPassword(
      currentPassword,
      currentUser.passwordHash || currentUser.password || ''
    );

    if (!isCurrentPasswordValid) {
      setPasswordError('Current password is incorrect. It does not match the password saved in database.');
      return;
    }

    if (!hasMinLength) {
      setPasswordError('New password must contain more than 8 characters.');
      return;
    }
    if (!hasCapital) {
      setPasswordError('New password must contain at least one capital letter (A-Z).');
      return;
    }
    if (!hasNumber) {
      setPasswordError('New password must contain at least one number (0-9).');
      return;
    }
    if (!hasSymbol) {
      setPasswordError('New password must contain at least one symbol (e.g. !@#$%^&*).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmed new password do not match.');
      return;
    }

    if (onUpdateCurrentProfile) {
      await onUpdateCurrentProfile({
        fullName: currentUser.fullName,
        email: currentUser.email,
        password: newPassword,
      });
    }

    setPasswordSuccess('Password successfully updated and saved in database!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(null), 3500);
  };

  // Build tabs array depending on role
  const allTabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    ...(isAdmin
      ? [
          { id: 'sessions', label: 'Sessions & Devices', icon: <Smartphone className="w-4 h-4" /> },
          { id: 'system', label: 'System & Currency', icon: <Globe className="w-4 h-4" /> },
          { id: 'security', label: 'Security & Encryption', icon: <Lock className="w-4 h-4" /> },
          { id: 'whatsapp', label: 'WhatsApp Templates', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'export', label: 'Export & Backup', icon: <Download className="w-4 h-4" /> },
        ]
      : []),
  ];

  return (
    <div id="subly-settings-view" className="p-8 space-y-6 bg-[#F5F7FA] min-h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0]">
        <div>
          <h1 className="text-xl font-extrabold text-[#111827]">
            {isAdmin ? 'System Settings & Security Configuration' : 'User Account Profile'}
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            {isAdmin
              ? 'Manage user profiles, security policies, WhatsApp templates, and database backups.'
              : 'Manage your personal profile details, contact email, and login credentials.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* New Profile Button - ONLY VISIBLE FOR ADMIN */}
          {isAdmin && onOpenNewProfileModal && (
            <button
              id="btn-settings-new-profile"
              onClick={onOpenNewProfileModal}
              className="flex items-center gap-2 bg-[#111827] hover:opacity-85 transition-opacity duration-200 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xs active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-blue-400" />
              <span>New Profile</span>
            </button>
          )}

          <button
            id="btn-settings-save"
            onClick={handleSaveSettings}
            className="flex items-center gap-2 bg-[#4A90FF] hover:opacity-85 transition-opacity duration-200 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {allTabs.map((tab) => (
          <button
            key={tab.id}
            id={`btn-settings-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-[#111827] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-[#E8EAF0] hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-white p-8 rounded-3xl shadow-xs border border-[#E8EAF0]">
        {activeTab === 'profile' && (
          <div className="space-y-8 max-w-xl">
            {/* Account Details & Role */}
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-[#111827]">Profile</h2>
                <span
                  className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${
                    isAdmin
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}
                >
                  {isAdmin ? 'System Administrator (Full Access)' : 'Limited Staff Member (Low-Level Access)'}
                </span>
              </div>

              
              {profileError && (
                <div className="p-3.5 bg-red-600 text-white border border-red-700 rounded-2xl text-xs flex items-center gap-2.5 font-extrabold shadow-md animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-white shrink-0" />
                  <div>
                    <p className="font-extrabold text-white tracking-wide">{profileError}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (profileError) setProfileError(null);
                  }}
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (profileError) setProfileError(null);
                  }}
                  placeholder="e.g. james_noah"
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Username must be unique (case-sensitive) and contain no spaces.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (profileError) setProfileError(null);
                  }}
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Administrative Role & Access Level</label>
                {isAdmin ? (
                  <select
                    disabled
                    value="ADMIN"
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-not-allowed"
                  >
                    <option value="ADMIN">System Administrator (Full Access)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value="Limited Staff (Orders & Customers Management Only)"
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl font-bold cursor-not-allowed"
                  />
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  {isAdmin
                    ? 'System Administrator role is locked and cannot be modified.'
                    : 'Limited role cannot be modified by low-level staff profiles. Only System Administrators can alter role permissions.'}
                </p>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="pt-6 border-t border-[#E8EAF0] space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#4A90FF]" />
                <h2 className="text-base font-extrabold text-[#111827]">Change Password</h2>
              </div>
              <p className="text-xs text-slate-500">
                Update your login password. Current password must match database, and new password must fulfill all security requirements.
              </p>

              {passwordError && (
                <div className="p-3.5 bg-red-600 text-slate-100 border border-red-700 rounded-2xl text-xs flex items-center gap-2.5 font-extrabold shadow-md animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-slate-200 shrink-0" />
                  <div>
                    <p className="font-extrabold text-slate-100 tracking-wide">{passwordError}</p>
                  </div>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 font-extrabold shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
                {/* Current Password */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Current Password *</label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                      }}
                      placeholder="Enter your current password"
                      className="w-full px-4 py-2.5 pr-10 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">New Password *</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                      }}
                      placeholder="Enter new strong password"
                      className="w-full px-4 py-2.5 pr-10 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Requirement Checklist */}
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Password Security Requirements
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

                {/* Confirm New Password */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Confirm New Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                      }}
                      placeholder="Re-enter new password"
                      className="w-full px-4 py-2.5 pr-10 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-[#111827] hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-xs transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Registered System Profiles List (Visible for Admin) */}
            {isAdmin && profiles.length > 0 && (
              <div className="pt-6 border-t border-[#E8EAF0] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <h2 className="text-base font-extrabold text-[#111827]">Registered User Profiles ({profiles.length})</h2>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        profile.id === currentUser.id
                          ? 'border-[#4A90FF] bg-blue-50/40'
                          : 'border-[#E8EAF0] bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center text-white ${
                            profile.role === 'ADMIN' ? 'bg-slate-900' : 'bg-blue-600'
                          }`}
                        >
                          {profile.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{profile.fullName}</span>
                            {profile.username && (
                              <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-semibold border border-purple-100/80">
                                @{profile.username}
                              </span>
                            )}
                            {profile.id === currentUser.id && (
                              <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full">
                                Active Profile
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">{profile.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            profile.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {profile.role === 'ADMIN' ? 'System Admin' : 'Limited Staff'}
                        </span>

                        {profile.id !== currentUser.id && onSelectProfile && (
                          <button
                            onClick={() => onSelectProfile(profile)}
                            className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-lg border border-slate-200 cursor-pointer shadow-2xs"
                          >
                            Switch To
                          </button>
                        )}

                        {profile.id !== currentUser.id && onDeleteProfile && (
                          <button
                            onClick={() => onDeleteProfile(profile.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}


        {activeTab === 'sessions' && (
          <div className="space-y-6 max-w-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#111827]">Active Sessions & Device Management</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  View and manage active login tokens, device footprints, cookie parameters, and multi-tab sync status.
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900">Current Session Active</span>
                <span className="text-[10px] font-mono bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                  Validated
                </span>
              </div>
              <p className="text-xs text-blue-800 font-medium">
                Protected routes strictly validate session token authenticity. Expiration triggers automatic redirection to Login.
              </p>

              {onOpenSessionsModal && (
                <button
                  type="button"
                  onClick={onOpenSessionsModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition-colors"
                >
                  Open Live Sessions & Devices Inspector
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6 max-w-xl">
            <h2 className="text-base font-extrabold text-[#111827]">Regional & Currency Preferences</h2>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">System Currency</label>
                <select
                  value={currency}
                  onChange={(e) => {
                    const newCurrency = e.target.value;
                    setCurrency(newCurrency);
                    onCurrencyChange?.(newCurrency);
                  }}
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
                >
                  <option value="USD ($)">USD ($) - US Dollar</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                  <option value="GBP (£)">GBP (£) - British Pound</option>
                  <option value="AED (د.إ)">AED (د.إ) - UAE Dirham</option>
                  <option value="SAR (SAR)">SAR (SAR) - Saudi Riyal</option>
                  <option value="MAD (DH)">MAD (DH) - Moroccan Dirham</option>
                  <option value="RUB (₽)">RUB (₽) - Russian Ruble</option>
                  <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Session Inactivity Timeout</label>
                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
                >
                  <option value="15">15 Minutes (Strict Security Spec)</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 max-w-xl">
            <h2 className="text-base font-extrabold text-[#111827]">Security & Field Encryption Status</h2>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-extrabold text-emerald-900">AES-256-GCM Encryption Active</p>
                <p className="text-emerald-700 mt-0.5">
                  All account passwords, profile PINs, and recovery keys are encrypted at rest before storing in PostgreSQL.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F5F7FA] border border-[#E8EAF0] rounded-2xl text-xs">
              <div>
                <span className="font-bold text-[#111827] block">TOTP Multi-Factor Authentication</span>
                <span className="text-slate-500 text-[11px]">Require Google Authenticator / Authy app code on login</span>
              </div>
              <button
                onClick={() => setMfaEnabled(!mfaEnabled)}
                className={`w-12 h-6 rounded-full transition-colors flex items-center p-1 ${
                  mfaEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#111827]">WhatsApp Auto-Notification Templates</h2>
              <div className="flex items-center gap-1 bg-[#F5F7FA] p-1 rounded-full border border-[#E8EAF0]">
                {(['AR', 'FR', 'EN'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLangTemplate(lang)}
                    className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      activeLangTemplate === lang ? 'bg-[#4A90FF] text-white' : 'text-slate-600'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Expiring in 3 Days Message Template ({activeLangTemplate})
                </label>
                <textarea
                  rows={3}
                  dir={activeLangTemplate === 'AR' ? 'rtl' : 'ltr'}
                  value={templates[activeLangTemplate].expiring3Days}
                  onChange={(e) =>
                    setTemplates({
                      ...templates,
                      [activeLangTemplate]: {
                        ...templates[activeLangTemplate],
                        expiring3Days: e.target.value,
                      },
                    })
                  }
                  className="w-full p-3 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Expired Account Message Template ({activeLangTemplate})
                </label>
                <textarea
                  rows={3}
                  dir={activeLangTemplate === 'AR' ? 'rtl' : 'ltr'}
                  value={templates[activeLangTemplate].expired}
                  onChange={(e) =>
                    setTemplates({
                      ...templates,
                      [activeLangTemplate]: {
                        ...templates[activeLangTemplate],
                        expired: e.target.value,
                      },
                    })
                  }
                  className="w-full p-3 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Thanks Client Message Template ({activeLangTemplate})
                </label>
                <textarea
                  rows={6}
                  dir={activeLangTemplate === 'AR' ? 'rtl' : 'ltr'}
                  value={templates[activeLangTemplate].thanksClient}
                  onChange={(e) =>
                    setTemplates({
                      ...templates,
                      [activeLangTemplate]: {
                        ...templates[activeLangTemplate],
                        thanksClient: e.target.value,
                      },
                    })
                  }
                  className="w-full p-3 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E8EAF0]">
                <p className="text-[11px] text-slate-400 font-medium">
                  Templates are stored in the database and persist across logins.
                </p>
                <button
                  type="button"
                  onClick={handleSaveTemplates}
                  disabled={savingTemplates}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {savingTemplates ? 'Saving...' : 'Save Templates'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6 max-w-xl">
            <h2 className="text-base font-extrabold text-[#111827]">Export All ERP Data</h2>
            <p className="text-xs text-slate-500">
              Download complete database snapshot including customers, active orders, plans, and audit logs in JSON format.
            </p>
            <button
              onClick={onExportAllData}
              className="flex items-center gap-2 bg-[#111827] text-white hover:bg-black text-xs font-bold px-5 py-2.5 rounded-full shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export Complete JSON Backup</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
