import React, { useState } from 'react';
import { X, Server, Calendar, Layers, AlertCircle, Mail, KeyRound, User } from 'lucide-react';
import { ServiceAccount, ServiceAccountStatus, ServiceType } from '../../types/erp';
import { sanitizeInput, validateEmail, stripControlCharacters } from '../../utils/security';
import { simulateEncrypt, getCurrencyRate } from '../../utils/crypto';

interface NewServiceAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (accountData: Omit<ServiceAccount, 'id' | 'createdAt'>) => void;
  currency?: string;
  initialData?: ServiceAccount | null;
}

const SERVICE_TYPES: ServiceType[] = ['Netflix', 'Disney+', 'Prime Video', 'Spotify', 'IPTV', 'YouTube Premium', 'HBO Max', 'Other'];

export const NewServiceAccountModal: React.FC<NewServiceAccountModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currency = 'USD ($)',
  initialData,
}) => {
  const [serviceType, setServiceType] = useState<ServiceType>(initialData?.serviceType || 'Netflix');
  const [providerId, setProviderId] = useState(initialData?.providerId || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [rawPassword, setRawPassword] = useState(initialData?.passwordEncrypted ? initialData.passwordEncrypted : '');
  const [subscriptionStart, setSubscriptionStart] = useState(initialData?.subscriptionStart || new Date().toISOString().split('T')[0]);
  const [subscriptionEnd, setSubscriptionEnd] = useState(initialData?.subscriptionEnd || '');
  const [purchaseCost, setPurchaseCost] = useState(initialData?.purchaseCost || 0);
  const [costInput, setCostInput] = useState(initialData?.purchaseCost ? String(initialData.purchaseCost) : '');
  const [capacity, setCapacity] = useState(initialData?.capacity || 4);
  const [status, setStatus] = useState<ServiceAccountStatus>(initialData?.status || 'Active');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [error, setError] = useState<string | null>(null);

  // Reset the form whenever the modal opens (editing shows current account).
  // Purchase cost is stored in USD (base) and shown in the display currency.
  React.useEffect(() => {
    if (isOpen) {
      const rate = getCurrencyRate(currency);
      const displayCost = initialData?.purchaseCost ? Math.round(initialData.purchaseCost * rate * 100) / 100 : 0;
      setServiceType(initialData?.serviceType || 'Netflix');
      setProviderId(initialData?.providerId || '');
      setEmail(initialData?.email || '');
      setRawPassword(initialData?.passwordEncrypted ? initialData.passwordEncrypted : '');
      setSubscriptionStart(initialData?.subscriptionStart || new Date().toISOString().split('T')[0]);
      setSubscriptionEnd(initialData?.subscriptionEnd || '');
      setPurchaseCost(displayCost);
      setCostInput(displayCost ? String(displayCost) : '');
      setCapacity(initialData?.capacity || 4);
      setStatus(initialData?.status || 'Active');
      setNotes(initialData?.notes || '');
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    let cleaned = raw;
    if (raw.includes('.')) {
      const [intPart, ...rest] = raw.split('.');
      cleaned = `${intPart}.${rest.join('').replace(/\./g, '')}`;
    }
    setCostInput(cleaned);
    const parsed = parseFloat(cleaned);
    setPurchaseCost(isNaN(parsed) ? 0 : parsed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = validateEmail(email);
    if (!cleanEmail.isValid) {
      setError(cleanEmail.error || 'Account Email address is invalid.');
      return;
    }

    const cleanPassword = stripControlCharacters(rawPassword);
    if (!cleanPassword) {
      setError('Account Password is required.');
      return;
    }

    const cleanProvider = sanitizeInput(providerId, { maxLen: 100, allowSpaces: true });
    const cleanNotes = sanitizeInput(notes, { maxLen: 500, allowSpaces: true, preserveNewlines: true });

    if (!subscriptionStart || !subscriptionEnd) {
      setError('Subscription Start and End dates are required.');
      return;
    }

    if (new Date(subscriptionEnd) < new Date(subscriptionStart)) {
      setError('Subscription End date cannot be before the Start date.');
      return;
    }

    if (isNaN(capacity) || capacity < 1) {
      setError('Capacity must be at least 1 profile.');
      return;
    }

    // Convert the typed display-currency cost to the USD base for storage
    const costInUsd = Math.round((purchaseCost / getCurrencyRate(currency)) * 100) / 100;

    onSubmit({
      serviceType,
      providerId: cleanProvider || undefined,
      email: cleanEmail.clean,
      passwordEncrypted: simulateEncrypt(cleanPassword),
      subscriptionStart,
      subscriptionEnd,
      purchaseCost: costInUsd,
      capacity: Number(capacity),
      status,
      notes: cleanNotes,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E8EAF0] space-y-6 max-h-[90vh] overflow-y-auto cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-base text-[#111827]">
              {initialData ? 'Edit Service Account' : 'Create Service Account'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-600 text-white border border-red-700 rounded-2xl text-xs flex items-center gap-2.5 font-extrabold shadow-md animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
            <div>
              <p className="font-extrabold text-white tracking-wide">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Service Type *</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
              >
                {SERVICE_TYPES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Provider ID (Optional)</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. VENDOR-001"
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Account Email *</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="netflix_master@recura.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] text-[#111827] rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Account Password * (stored encrypted)</label>
            <div className="relative">
              <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Password"
                value={rawPassword}
                onChange={(e) => setRawPassword(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] text-[#111827] rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Subscription Start</label>
              <input
                type="date"
                required
                value={subscriptionStart}
                onChange={(e) => setSubscriptionStart(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Subscription End</label>
              <input
                type="date"
                required
                value={subscriptionEnd}
                onChange={(e) => setSubscriptionEnd(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Purchase Cost ({currency})</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={costInput}
                onChange={handleCostChange}
                className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Capacity (Profiles) *</label>
              <div className="relative">
                <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ServiceAccountStatus)}
                className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Expired is auto-derived from the subscription end date.</p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Notes</label>
              <textarea
                rows={2}
                placeholder="Provider contact, screens limit, notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-[#4A90FF] text-white font-bold hover:opacity-85 transition-opacity duration-200 shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
            >
              {initialData ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
