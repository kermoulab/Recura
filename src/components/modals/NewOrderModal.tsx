import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Lock, Calendar, User, Package, KeyRound, AlertCircle, Server, Layers } from 'lucide-react';
import { Customer, Plan, Order, SubscriptionStatus, ServiceAccount } from '../../types/erp';
import { simulateEncrypt, simulateDecrypt, calculateDaysRemaining, formatCurrency } from '../../utils/crypto';
import { sanitizeInput, validateEmail, stripControlCharacters } from '../../utils/security';
import { getEffectiveAccountStatus, getNextFreeProfileNumber, getOccupancy } from '../../utils/serviceAccounts';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  plans: Plan[];
  serviceAccounts?: ServiceAccount[];
  orders?: Order[];
  currency?: string;
  preselectedAccountId?: string;
  onSubmit: (orderData: Omit<Order, 'id'>) => void;
  initialData?: Order | null;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  customers,
  plans,
  serviceAccounts = [],
  orders = [],
  currency = 'USD ($)',
  preselectedAccountId,
  onSubmit,
  initialData,
}) => {
  if (!isOpen) return null;

  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || '');

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [profileNumber, setProfileNumber] = useState<string>('');

  const [price, setPrice] = useState(plans[0]?.price || 10);
  const [durationMonths, setDurationMonths] = useState(plans[0]?.durationMonths || 1);

  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState('');

  const [accountEmail, setAccountEmail] = useState('');
  const [rawPassword, setRawPassword] = useState('');
  const [rawPin, setRawPin] = useState('');
  const [screenProfileName, setScreenProfileName] = useState('Profile 1');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync state with initialData when editing
  useEffect(() => {
    if (initialData) {
      setSelectedCustomerId(initialData.customerId);
      setSelectedPlanId(initialData.planId);
      setPrice(initialData.price);
      setDurationMonths(initialData.durationMonths);
      setStartDate(initialData.startDate);
      setEndDate(initialData.endDate);
      setAccountEmail(initialData.accountEmail);
      setRawPassword(simulateDecrypt(initialData.accountPasswordEncrypted));
      setRawPin(initialData.pinCodeEncrypted ? simulateDecrypt(initialData.pinCodeEncrypted) : '');
      setScreenProfileName(initialData.screenProfileName || 'Profile 1');
      setNotes(initialData.notes || '');
      setSelectedAccountId(initialData.serviceAccountId || '');
      setProfileNumber(initialData.profileNumber ? String(initialData.profileNumber) : '');
    } else {
      setSelectedCustomerId(customers[0]?.id || '');
      setSelectedPlanId(plans[0]?.id || '');
      setPrice(plans[0]?.price || 10);
      setDurationMonths(plans[0]?.durationMonths || 1);
      setStartDate(todayStr);
      setAccountEmail('');
      setRawPassword('');
      setRawPin('');
      setScreenProfileName('Profile 1');
      setNotes('');
      const accountToPreselect = preselectedAccountId || '';
      setSelectedAccountId(accountToPreselect);
      setProfileNumber(accountToPreselect ? String(getNextFreeProfileNumber(accountToPreselect, orders)) : '');
    }
  }, [initialData, isOpen]);

  // Auto-suggest next free profile when the selected account changes
  useEffect(() => {
    if (selectedAccountId && !profileNumber) {
      setProfileNumber(String(getNextFreeProfileNumber(selectedAccountId, orders)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId]);

  // Auto-fill Account Email + Password from the linked shared service account.
  // PIN is intentionally left empty so the agent can enter it manually on save.
  useEffect(() => {
    const account = serviceAccounts.find((a) => a.id === selectedAccountId);
    if (account) {
      setAccountEmail(account.email);
      setRawPassword(simulateDecrypt(account.passwordEncrypted || ''));
    } else {
      setAccountEmail('');
      setRawPassword('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId]);

  // Auto-calculate price, duration & end date when Plan or Start Date changes (only if not manually overriding or editing without plan change)
  useEffect(() => {
    if (!initialData) {
      const plan = plans.find((p) => p.id === selectedPlanId);
      if (plan) {
        setPrice(plan.price);
        setDurationMonths(plan.durationMonths);

        if (startDate) {
          const start = new Date(startDate);
          start.setMonth(start.getMonth() + plan.durationMonths);
          setEndDate(start.toISOString().split('T')[0]);
        }
      }
    }
  }, [selectedPlanId, startDate, plans, initialData]);

  const selectedAccount = serviceAccounts.find((a) => a.id === selectedAccountId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const customer = customers.find((c) => c.id === selectedCustomerId);
    const plan = plans.find((p) => p.id === selectedPlanId);

    if (!customer) {
      setError('Please select a valid customer.');
      return;
    }

    if (!plan) {
      setError('Please select a valid streaming plan.');
      return;
    }

    const emailCheck = validateEmail(accountEmail);
    if (!emailCheck.isValid) {
      setError(emailCheck.error || 'Account Email address is invalid.');
      return;
    }

    const cleanRawPassword = stripControlCharacters(rawPassword);
    if (!cleanRawPassword) {
      setError('Account Password is required.');
      return;
    }

    const cleanRawPin = rawPin ? stripControlCharacters(rawPin) : '';
    const cleanProfileName = sanitizeInput(screenProfileName, { maxLen: 50, allowSpaces: true }) || 'Profile 1';
    const cleanNotes = sanitizeInput(notes, { maxLen: 500, allowSpaces: true, preserveNewlines: true });

    // Service account validation: must be active, profile number unique, capacity not full
    let orderServiceAccountId: string | undefined;
    let orderProfileNumber: number | undefined;
    if (selectedAccountId) {
      if (!selectedAccount) {
        setError('The selected service account was not found.');
        return;
      }
      if (getEffectiveAccountStatus(selectedAccount) !== 'Active') {
        setError('This service account is not active (expired or suspended). Choose another account.');
        return;
      }
      const pNum = Number(profileNumber);
      if (!pNum || pNum < 1 || !Number.isInteger(pNum)) {
        setError('Profile Number must be a positive whole number.');
        return;
      }
      const duplicate = orders.some(
        (o) =>
          o.serviceAccountId === selectedAccountId &&
          o.profileNumber === pNum &&
          o.id !== initialData?.id
      );
      if (duplicate) {
        setError(`Profile #${pNum} is already assigned on this account. Choose another profile number.`);
        return;
      }
      const usedCount = orders.filter(
        (o) => o.serviceAccountId === selectedAccountId && o.id !== initialData?.id
      ).length;
      if (usedCount >= (selectedAccount.capacity || 0)) {
        setError('This service account has no free profiles left (capacity reached).');
        return;
      }
      orderServiceAccountId = selectedAccountId;
      orderProfileNumber = pNum;
    }

    // Determine status automatically
    const daysLeft = calculateDaysRemaining(endDate);
    let status: SubscriptionStatus = 'ACTIVE';
    if (daysLeft < 0) status = 'EXPIRED';
    else if (daysLeft <= 3) status = 'EXPIRING_3D';
    else if (daysLeft <= 7) status = 'EXPIRING_7D';

    onSubmit({
      customerId: customer.id,
      customerName: customer.name,
      customerWhatsApp: customer.whatsapp,
      planId: plan.id,
      planName: plan.name,
      price: Number(price),
      durationMonths: Number(durationMonths),
      startDate,
      endDate,
      status,
      accountEmail: emailCheck.clean,
      accountPasswordEncrypted: simulateEncrypt(cleanRawPassword),
      pinCodeEncrypted: cleanRawPin ? simulateEncrypt(cleanRawPin) : undefined,
      screenProfileName: cleanProfileName,
      notes: cleanNotes,
      contactedForRenewal: false,
      serviceAccountId: orderServiceAccountId,
      profileNumber: orderProfileNumber,
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
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-base text-[#111827]">
              {initialData ? 'Edit Subscription Order' : 'Provision New Subscription Order'}
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
          {/* Customer Selection */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Select Customer *</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.whatsapp}) - {c.preferredLanguage}
                </option>
              ))}
            </select>
          </div>

          {/* Plan Selection */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Select Streaming Plan *</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {formatCurrency(p.price, currency)} ({p.durationMonths}m) [{p.availableStock} in stock]
                </option>
              ))}
            </select>
          </div>

          {/* Service Account Selection (Optional) */}
          {serviceAccounts.length > 0 && (
            <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-2xl space-y-3">
              <span className="font-extrabold text-blue-600 text-[11px] block flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-blue-600" /> Link to Shared Service Account (Optional)
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Service Account</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => {
                      setSelectedAccountId(e.target.value);
                      setProfileNumber('');
                    }}
                    className="w-full px-3 py-2 bg-white border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
                  >
                    <option value="">— Not Linked —</option>
                    {serviceAccounts.map((acc) => {
                      const occupancy = getOccupancy(acc, orders);
                      return (
                        <option key={acc.id} value={acc.id}>
                          {acc.serviceType} · {acc.email} · {occupancy.used}/{acc.capacity} used
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Profile Number</label>
                  <div className="relative">
                    <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="1"
                      placeholder="Auto-suggested"
                      value={profileNumber}
                      onChange={(e) => setProfileNumber(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {selectedAccount && (
                <p className="text-[10px] text-slate-500 font-medium">
                  Occupancy: <strong className="text-blue-700">{getOccupancy(selectedAccount, orders).used}/{selectedAccount.capacity}</strong> used ·{' '}
                  <strong className="text-emerald-700">{getOccupancy(selectedAccount, orders).available}</strong> free ·{' '}
                  {getEffectiveAccountStatus(selectedAccount) === 'Active' ? (
                    <strong className="text-emerald-600">Active</strong>
                  ) : (
                    <strong className="text-rose-600">{getEffectiveAccountStatus(selectedAccount)}</strong>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Auto Calculation Preview */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
            <div>
              <span className="text-[10px] text-blue-700 font-bold uppercase block">Auto Price</span>
              <span className="text-base font-black text-[#111827]">{formatCurrency(price, currency)}</span>
            </div>
            <div>
              <span className="text-[10px] text-blue-700 font-bold uppercase block">Auto End Date</span>
              <span className="text-sm font-black text-[#111827]">{endDate || 'Calculated'}</span>
            </div>
          </div>

          {/* Start and End Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* Encrypted Credentials Section */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E8EAF0] rounded-2xl space-y-3">
            <span className="font-extrabold text-blue-600 text-[11px] block flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-blue-600" /> Account Credentials (Encrypted with AES-256)
            </span>

            {selectedAccount && (
              <p className="text-[10px] text-slate-500 font-medium -mt-1">
                Auto-filled from <strong className="text-blue-700">{selectedAccount.serviceType}</strong> · {selectedAccount.email}.{' '}
                Leave the PIN empty or type the customer&apos;s PIN manually.
              </p>
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Account Email *</label>
              <input
                type="email"
                required
                placeholder="netflix_user_01@recura.com"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E8EAF0] text-[#111827] rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Account Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={rawPassword}
                  onChange={(e) => setRawPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8EAF0] text-[#111827] rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Profile PIN (Optional)</label>
                <input
                  type="text"
                  placeholder="1428"
                  value={rawPin}
                  onChange={(e) => setRawPin(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8EAF0] text-[#111827] rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Screen / Profile Name</label>
              <input
                type="text"
                placeholder="e.g. Screen 2 - Karim"
                value={screenProfileName}
                onChange={(e) => setScreenProfileName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E8EAF0] text-[#111827] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {initialData ? 'Save Changes' : 'Provision Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
