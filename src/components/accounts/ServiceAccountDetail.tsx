import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Server,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Calendar,
  Layers,
  User,
  Phone,
  Plus,
  Pencil,
  RefreshCw,
  Power,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BadgeCheck,
  X,
} from 'lucide-react';
import { ServiceAccount, Order, SubscriptionStatus, Customer, Plan } from '../../types/erp';
import {
  maskEmail,
  simulateDecrypt,
  formatCurrency,
  calculateDaysRemaining,
} from '../../utils/crypto';
import {
  getLinkedOrders,
  getOccupancy,
  getEffectiveAccountStatus,
  getDaysRemaining,
  isOrderCustomerMissing,
  resolveOrderPlanName,
} from '../../utils/serviceAccounts';
import { createWhatsAppWebUrl } from '../../utils/whatsapp';

interface ServiceAccountDetailProps {
  account: ServiceAccount;
  orders: Order[];
  customers: Customer[];
  plans?: Plan[];
  currency?: string;
  onBack: () => void;
  onEditAccount: (account: ServiceAccount) => void;
  onDeleteAccount: (id: string) => void;
  onRenewAccount: (id: string, start: string, end: string) => void;
  onToggleSuspend: (id: string) => void;
  onUnlinkOrder: (orderId: string) => void;
  onAssignCustomer: (accountId: string) => void;
}

export const ServiceAccountDetail: React.FC<ServiceAccountDetailProps> = ({
  account,
  orders,
  customers,
  plans = [],
  currency = 'USD ($)',
  onBack,
  onEditAccount,
  onDeleteAccount,
  onRenewAccount,
  onToggleSuspend,
  onUnlinkOrder,
  onAssignCustomer,
}) => {
  const [revealCredentials, setRevealCredentials] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRenew, setShowRenew] = useState(false);
  const [renewStart, setRenewStart] = useState(account.subscriptionStart);
  const [renewEnd, setRenewEnd] = useState(account.subscriptionEnd);
  const [renewError, setRenewError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [blockedDelete, setBlockedDelete] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState('');

  useEffect(() => {
    if (account.passwordEncrypted) {
      simulateDecrypt(account.passwordEncrypted).then(setDecryptedPassword);
    } else {
      setDecryptedPassword('');
    }
  }, [account.passwordEncrypted]);

  const occupancy = getOccupancy(account, orders);
  const effectiveStatus = getEffectiveAccountStatus(account);
  const daysLeft = getDaysRemaining(account);
  const linkedOrders = getLinkedOrders(account.id, orders);
  const password = decryptedPassword;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRenewError(null);
    if (!renewStart || !renewEnd) {
      setRenewError('Both dates are required.');
      return;
    }
    if (new Date(renewEnd) < new Date(renewStart)) {
      setRenewError('End date cannot be before the start date.');
      return;
    }
    onRenewAccount(account.id, renewStart, renewEnd);
    setShowRenew(false);
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
          </span>
        );
      case 'EXPIRING_7D':
        return (
          <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" /> Expiring 7D
          </span>
        );
      case 'EXPIRING_3D':
        return (
          <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Expiring 3D
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 text-slate-800 bg-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-300">
            <XCircle className="w-3 h-3 text-slate-600" /> Expired
          </span>
        );
    }
  };

  const slots = Array.from({ length: Math.max(0, account.capacity || 0) }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-[#F5F7FA] border border-[#E8EAF0] flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
              title="Back to Service Accounts"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-extrabold text-[#111827]">{account.serviceType}</h1>
                {effectiveStatus === 'Active' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-emerald-300">
                    <BadgeCheck className="w-3 h-3 text-emerald-600" /> {effectiveStatus}
                  </span>
                ) : effectiveStatus === 'Expired' ? (
                  <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-rose-300">
                    <AlertTriangle className="w-3 h-3 text-rose-600" /> {effectiveStatus}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-amber-300">
                    <Power className="w-3 h-3 text-amber-600" /> {effectiveStatus}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7280] mt-1 font-mono">{account.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowRenew((prev) => !prev)}
              className="flex items-center gap-1.5 bg-[#4A90FF] hover:bg-[#3B82F6] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Renew Account</span>
            </button>
            <button
              onClick={() => onEditAccount(account)}
              className="flex items-center gap-1.5 bg-white border border-[#E8EAF0] text-[#111827] hover:bg-slate-50 text-xs font-bold px-4 py-2.5 rounded-full transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setShowSuspend(true)}
              className="flex items-center gap-1.5 bg-white border border-[#E8EAF0] text-amber-700 hover:bg-amber-50 text-xs font-bold px-4 py-2.5 rounded-full transition-colors cursor-pointer"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{account.status === 'Suspended' ? 'Reactivate' : 'Deactivate'}</span>
            </button>
            <button
              onClick={() => {
                if (linkedOrders.length > 0) {
                  setBlockedDelete(true);
                } else {
                  setShowDelete(true);
                }
              }}
              className="flex items-center gap-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold px-4 py-2.5 rounded-full transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Renew inline form */}
        {showRenew && (
          <form
            onSubmit={handleRenewSubmit}
            className="mt-4 p-4 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-3"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-extrabold text-blue-700">Renew Subscription</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-[11px]">New Start Date</label>
                <input
                  type="date"
                  required
                  value={renewStart}
                  onChange={(e) => setRenewStart(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8EAF0] rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-[11px]">New End Date</label>
                <input
                  type="date"
                  required
                  value={renewEnd}
                  onChange={(e) => setRenewEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8EAF0] rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
            </div>
            {renewError && <p className="text-[11px] font-bold text-rose-600">{renewError}</p>}
            <p className="text-[10px] text-slate-500">
              Renewing updates this account and cascades the new subscription window to all {linkedOrders.length} linked order(s).
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRenew(false)}
                className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 text-xs shadow-sm active:scale-95 cursor-pointer"
              >
                Confirm Renewal
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Credentials + Subscription Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Credentials */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0] space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-blue-600 text-[11px] flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Login Credentials
            </span>
            <button
              onClick={() => setRevealCredentials((prev) => !prev)}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
            >
              {revealCredentials ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {revealCredentials ? 'Mask' : 'Reveal'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E8EAF0] rounded-xl text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-800 font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{revealCredentials ? account.email : maskEmail(account.email)}</span>
            </div>
            <button
              onClick={() => copyToClipboard(account.email, 'login')}
              className="text-slate-400 hover:text-blue-600 p-1 cursor-pointer"
              title="Copy Login Email"
            >
              {copiedField === 'login' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E8EAF0] rounded-xl text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-800 font-medium">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-extrabold text-amber-700">
                {revealCredentials ? password : '••••••••••••'}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(password, 'pass')}
              className="text-slate-400 hover:text-blue-600 p-1 cursor-pointer"
              title="Copy Password"
            >
              {copiedField === 'pass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#E8EAF0]">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Provider ID</span>
              <span className="text-xs font-extrabold text-[#111827] block mt-0.5">{account.providerId || '—'}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F7FA] border border-[#E8EAF0]">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Purchase Cost</span>
              <span className="text-xs font-black text-[#111827] block mt-0.5">{formatCurrency(account.purchaseCost, currency)}</span>
            </div>
          </div>

          {account.notes && (
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-slate-600">
              <span className="font-bold text-amber-700 block mb-0.5">Notes</span>
              {account.notes}
            </div>
          )}
        </div>

        {/* Subscription / Occupancy */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0] space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-[#111827] text-xs flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> Subscription Window
            </span>
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                daysLeft < 0
                  ? 'text-rose-700 bg-rose-50 border-rose-200'
                  : daysLeft <= 7
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}
            >
              {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft} days left`}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs bg-[#F5F7FA] p-3 rounded-xl border border-[#E8EAF0]">
            <div>
              <span className="text-slate-400 block font-medium">Start</span>
              <span className="font-extrabold text-[#111827]">{account.subscriptionStart}</span>
            </div>
            <span className="text-slate-300 font-black">→</span>
            <div>
              <span className="text-slate-400 block font-medium">End</span>
              <span className="font-extrabold text-[#111827]">{account.subscriptionEnd}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-[#111827] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" /> Occupancy
              </span>
              <span className="font-black text-[#111827]">
                {occupancy.used}/{occupancy.capacity} used · {occupancy.available} free
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  occupancy.percent >= 100 ? 'bg-rose-500' : occupancy.percent >= 75 ? 'bg-amber-500' : 'bg-[#4A90FF]'
                }`}
                style={{ width: `${occupancy.percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-400 font-semibold">
              <span>{occupancy.percent}% occupied</span>
              <span>{account.capacity} profiles capacity</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs bg-[#F5F7FA] p-3 rounded-xl border border-[#E8EAF0]">
            <span className="flex items-center gap-1.5 font-bold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {linkedOrders.filter((o) => o.status === 'ACTIVE').length}
            </span>
            <span className="flex items-center gap-1.5 font-bold text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {linkedOrders.filter((o) => o.status === 'EXPIRED').length}
            </span>
          </div>

          <button
            onClick={() => onAssignCustomer(account.id)}
            disabled={occupancy.available === 0 || effectiveStatus !== 'Active'}
            className={`w-full flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-full transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              effectiveStatus === 'Active'
                ? 'bg-[#111827] text-white hover:bg-black shadow-xs'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{occupancy.available === 0 ? 'Account Full' : effectiveStatus !== 'Active' ? 'Account Not Active' : 'Assign Customer to Free Profile'}</span>
          </button>
        </div>
      </div>

      {/* Profile Slots Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-[#E8EAF0] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8EAF0]">
          <div>
            <h2 className="font-extrabold text-sm text-[#111827]">Profiles & Customers</h2>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              {occupancy.used} of {account.capacity} profile slots assigned. Empty slots are shown as Available.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#E8EAF0] text-[11px] font-extrabold uppercase tracking-wider text-[#6B7280]">
                <th className="py-3 px-6">Profile</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Phone</th>
                <th className="py-3 px-6">Order Status</th>
                <th className="py-3 px-6">Renewal</th>
                <th className="py-3 px-6">Created</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAF0] text-xs">
              {slots.map((profileNumber) => {
                const order = linkedOrders.find((o) => o.profileNumber === profileNumber);
                if (!order) {
                  return (
                    <tr key={profileNumber} className="bg-slate-50/50">
                      <td className="py-3.5 px-6">
                        <span className="inline-flex items-center gap-2 font-mono font-black text-slate-400">
                          #{profileNumber}
                        </span>
                      </td>
                      <td colSpan={5} className="py-3.5 px-6">
                        <span className="inline-flex items-center gap-1.5 text-slate-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Available — empty profile slot
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => onAssignCustomer(account.id)}
                          disabled={effectiveStatus !== 'Active'}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-[11px] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5" /> Assign
                        </button>
                      </td>
                    </tr>
                  );
                }

                const customer = customers.find((c) => c.id === order.customerId);
                const customerMissing = isOrderCustomerMissing(order, customers);
                const currentCustomerName = customer?.name ?? order.customerName;
                const currentCustomerWhatsApp = customer?.whatsapp ?? order.customerWhatsApp;
                const currentPlanName = resolveOrderPlanName(order, plans);
                return (
                  <tr key={profileNumber} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-2 font-mono font-black text-[#111827] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
                        #{profileNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-[10px]">
                          {currentCustomerName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-[#111827] block">
                            {currentCustomerName}
                            {customerMissing && (
                              <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border text-rose-700 bg-rose-50 border-rose-200">
                                deleted
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400">{currentPlanName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <a
                        href={createWhatsAppWebUrl(currentCustomerWhatsApp, `Hello ${currentCustomerName}`)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 font-bold px-2.5 py-1 rounded-full border border-emerald-200 text-[11px] transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        {currentCustomerWhatsApp}
                      </a>
                    </td>
                    <td className="py-3.5 px-6">{getStatusBadge(order.status)}</td>
                    <td className="py-3.5 px-6">
                      {order.contactedForRenewal ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Contacted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 font-medium">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : order.startDate}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => onUnlinkOrder(order.id)}
                        className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-700 font-bold text-[11px] cursor-pointer"
                        title="Remove customer from this profile (frees the slot)"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend / Reactivate Confirm Modal */}
      {showSuspend && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setShowSuspend(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E8EAF0] space-y-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Power className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-extrabold text-base text-[#111827]">
                {account.status === 'Suspended' ? 'Reactivate Account?' : 'Deactivate Account?'}
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {account.status === 'Suspended'
                ? `Reactivating ${account.email} will set its status back to Active.`
                : `Suspending ${account.email} prevents new profile assignments. Existing linked orders are not affected.`}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSuspend(false)}
                className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleSuspend(account.id);
                  setShowSuspend(false);
                }}
                className={`px-4 py-2 rounded-full text-white font-bold hover:opacity-90 cursor-pointer transition-colors shadow-sm active:scale-95 ${
                  account.status === 'Suspended' ? 'bg-emerald-600' : 'bg-amber-600'
                }`}
              >
                {account.status === 'Suspended' ? 'Reactivate' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDelete && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setShowDelete(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E8EAF0] space-y-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-base text-[#111827]">Delete Service Account?</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              This will permanently delete <span className="font-bold text-[#111827]">{account.email}</span>.
              It has no assigned profiles and the deletion cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAccount(account.id);
                  setShowDelete(false);
                  onBack();
                }}
                className="px-4 py-2 rounded-full bg-rose-600 text-white font-bold hover:bg-rose-700 cursor-pointer transition-colors shadow-sm active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cannot Delete (assigned profiles) Modal */}
      {blockedDelete && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setBlockedDelete(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E8EAF0] space-y-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-extrabold text-base text-[#111827]">Account Cannot Be Deleted</h3>
              </div>
              <button
                onClick={() => setBlockedDelete(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="font-bold text-[#111827]">{account.email}</span> ({account.serviceType}) has{' '}
              <span className="font-bold text-[#111827]">{linkedOrders.length}</span> assigned profile(s) and cannot be
              deleted. First remove each customer profile below (the Remove button) to free all slots, then delete the account.
            </p>
            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBlockedDelete(false)}
                className="px-5 py-2 rounded-full bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
