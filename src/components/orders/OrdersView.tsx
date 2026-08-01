import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  KeyRound,
  Mail,
  User,
  ShieldCheck,
  Pencil,
  Trash2,
  ChevronDown,
  Server,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, SubscriptionStatus, ServiceAccount } from '../../types/erp';
import { simulateDecrypt, maskEmail, formatCurrency } from '../../utils/crypto';
import { createWhatsAppWebUrl } from '../../utils/whatsapp';
import { sanitizeInput } from '../../utils/security';
import { getAccountById } from '../../utils/serviceAccounts';

interface OrdersViewProps {
  orders: Order[];
  serviceAccounts?: ServiceAccount[];
  currency?: string;
  onAddOrder: () => void;
  onEditOrder?: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onOpenServiceAccount?: (accountId: string) => void;
  onOpenRenewal?: (order: Order) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  serviceAccounts = [],
  currency = 'USD ($)',
  onAddOrder,
  onEditOrder,
  onDeleteOrder,
  onOpenServiceAccount,
  onOpenRenewal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [unmaskedPasswords, setUnmaskedPasswords] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (orderId: string) => {
    setUnmaskedPasswords((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const toggleExpandAccount = (orderId: string) => {
    setExpandedAccounts((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const cleanSearch = sanitizeInput(searchTerm, { maxLen: 100, allowSpaces: true }).toLowerCase();

  const filteredOrders = orders.filter((ord) => {
    const account = getAccountById(serviceAccounts, ord.serviceAccountId);
    const matchesSearch =
      ord.customerName.toLowerCase().includes(cleanSearch) ||
      ord.planName.toLowerCase().includes(cleanSearch) ||
      ord.accountEmail.toLowerCase().includes(cleanSearch) ||
      ord.id.toLowerCase().includes(cleanSearch) ||
      String(ord.orderNumber || '').includes(cleanSearch) ||
      String(ord.profileNumber || '').includes(cleanSearch) ||
      (account ? account.email.toLowerCase().includes(cleanSearch) : false);

    const matchesStatus = selectedStatus === 'ALL' || ord.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const fallbackOrderNumber = (id: string): number => {
    const idx = orders.findIndex((o) => o.id === id);
    return idx >= 0 ? 1001 + idx : 0;
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full text-xs font-bold border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Active
          </span>
        );
      case 'EXPIRING_7D':
        return (
          <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-100 px-3 py-1 rounded-full text-xs font-bold border border-amber-300 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Expiring in 7 Days
          </span>
        );
      case 'EXPIRING_3D':
        return (
          <span className="inline-flex items-center gap-1.5 text-rose-800 bg-rose-100 px-3 py-1 rounded-full text-xs font-bold border border-rose-300 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Expiring in 3 Days
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 text-slate-800 bg-slate-200 px-3 py-1 rounded-full text-xs font-bold border border-slate-300 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-slate-600" />
            Expired
          </span>
        );
    }
  };

  return (
    <div id="subly-orders-view" className="p-8 space-y-6 bg-[#F5F7FA] min-h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#111827]">Order & Subscription Management</h1>
            <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              {orders.length} Active Orders
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Track account provisioning, encrypted credentials, auto duration limits, and renewal dates.
          </p>
        </div>

        <button
          id="btn-add-order-main"
          onClick={onAddOrder}
          className="flex items-center gap-2 bg-[#4A90FF] hover:bg-[#3B82F6] hover:opacity-95 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-md shadow-blue-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Order</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#E8EAF0] flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order ID, customer, account email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl text-xs font-medium text-[#111827] px-3 py-2 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRING_7D">Expiring in 7 Days</option>
            <option value="EXPIRING_3D">Expiring in 3 Days</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {/* Orders List Cards */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center text-slate-400 border border-[#E8EAF0]">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-sm">No orders matching search filter</p>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const decryptedPass = simulateDecrypt(ord.accountPasswordEncrypted);
            const decryptedPin = ord.pinCodeEncrypted ? simulateDecrypt(ord.pinCodeEncrypted) : null;
            const isUnmasked = unmaskedPasswords[ord.id] === true;
            const isAccountExpanded = !!expandedAccounts[ord.id];
            const account = getAccountById(serviceAccounts, ord.serviceAccountId);

            return (
              <div
                key={ord.id}
                className="bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0] hover:border-slate-300 transition-all flex flex-col gap-4"
              >
                {/* Order & Customer Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                        #{ord.orderNumber || fallbackOrderNumber(ord.id)}
                      </span>
                      {getStatusBadge(ord.status)}
                      {ord.status !== 'ACTIVE' &&
                        (ord.contactedForRenewal ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-200">
                            contacted
                          </span>
                        ) : (
                          <button
                            onClick={() => onOpenRenewal?.(ord)}
                            title="Open in WhatsApp renewal page"
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300 active:scale-95 transition-all cursor-pointer"
                          >
                            not contacted
                          </button>
                        ))}
                      <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                        {ord.planName}
                      </span>
                      {account && (
                        <button
                          onClick={() => onOpenServiceAccount?.(account.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded-full transition-colors cursor-pointer"
                          title={`Open ${account.serviceType} service account`}
                        >
                          <Server className="w-3 h-3 text-blue-500" />
                          {account.serviceType}
                          {ord.profileNumber && (
                            <span className="font-mono text-blue-600">#{ord.profileNumber}</span>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Edit and Delete Order Actions */}
                    <div className="flex items-center gap-1">
                      {onEditOrder && (
                        <button
                          onClick={() => onEditOrder(ord)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Order"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteOrder(ord.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs flex-wrap">
                    <div>
                      <span className="text-slate-400 block font-medium">Customer</span>
                      <span className="font-extrabold text-[#111827]">{ord.customerName}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                    <div>
                      <span className="text-slate-400 block font-medium">WhatsApp</span>
                      <a
                        href={createWhatsAppWebUrl(ord.customerWhatsApp, `Hello ${ord.customerName}`)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-emerald-600 hover:underline"
                      >
                        {ord.customerWhatsApp}
                      </a>
                    </div>
                    <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                    <div>
                      <span className="text-slate-400 block font-medium">Price / Term</span>
                      <span className="font-extrabold text-[#111827]">
                        {formatCurrency(ord.price, currency)} ({ord.durationMonths}m)
                      </span>
                    </div>
                  </div>

                  {/* Date Timeline */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 bg-[#F5F7FA] p-2.5 rounded-xl border border-[#E8EAF0] w-fit">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Start: <strong className="text-[#111827]">{ord.startDate}</strong></span>
                    <span>→</span>
                    <span>End: <strong className="text-[#111827]">{ord.endDate}</strong></span>
                  </div>
                </div>

                {/* Arrow / Toggle button below Order Info */}
                <div className="pt-2 border-t border-[#E8EAF0]">
                  <button
                    onClick={() => toggleExpandAccount(ord.id)}
                    className="flex items-center justify-between w-full py-2 px-3.5 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 border border-[#E8EAF0] text-xs font-bold text-slate-700 transition-colors cursor-pointer group"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>{isAccountExpanded ? 'Account & Credentials' : 'Show Account Credentials'}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500 group-hover:text-slate-800 font-semibold">
                      <span className="text-[11px]">{isAccountExpanded ? 'Hide' : 'Expand'}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 group-hover:text-slate-800 transition-transform duration-300 ${isAccountExpanded ? 'rotate-180 text-blue-600' : ''}`} />
                    </span>
                  </button>
                </div>

                {/* Account Info Section (Sliding down) */}
                <AnimatePresence>
                  {isAccountExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E8EAF0] space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pb-2 border-b border-[#E8EAF0]">
                          <span className="flex items-center gap-1 font-bold text-blue-600">
                            <ShieldCheck className="w-3.5 h-3.5" /> Account Credentials
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(ord.id)}
                            className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            {isUnmasked ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" /> Mask
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" /> Reveal
                              </>
                            )}
                          </button>
                        </div>

                        {/* Email Row */}
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2 text-slate-800 font-medium">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{isUnmasked ? ord.accountEmail : maskEmail(ord.accountEmail)}</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(ord.accountEmail, `email-${ord.id}`)}
                            className="text-slate-400 hover:text-blue-600 p-1 cursor-pointer"
                            title="Copy Email"
                          >
                            {copiedField === `email-${ord.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Password Row */}
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2 text-slate-800 font-medium">
                            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-extrabold text-amber-700">
                              {isUnmasked ? decryptedPass : '••••••••••••'}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(decryptedPass, `pass-${ord.id}`)}
                            className="text-slate-400 hover:text-blue-600 p-1 cursor-pointer"
                            title="Copy Password"
                          >
                            {copiedField === `pass-${ord.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Profile / PIN Row if exists */}
                        {(ord.screenProfileName || decryptedPin) && (
                          <div className="flex items-center justify-between text-[11px] font-mono pt-2 text-slate-500 border-t border-[#E8EAF0]">
                            <span>
                              Profile: <strong className="text-slate-800 font-bold">{ord.screenProfileName || 'Main'}</strong>
                            </span>
                            {decryptedPin && (
                              <span>
                                PIN: <strong className="text-blue-600 font-extrabold">{isUnmasked ? decryptedPin : '••••'}</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
