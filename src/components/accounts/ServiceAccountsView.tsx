import React, { useState, useEffect, useMemo } from 'react';
import {
  Server,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Power,
  ChevronLeft,
  ChevronRight,
  Layers,
  Wallet,
  X,
} from 'lucide-react';
import { ServiceAccount, Order, Customer } from '../../types/erp';
import { maskEmail, formatCurrency } from '../../utils/crypto';
import { sanitizeInput } from '../../utils/security';
import {
  getOccupancy,
  getEffectiveAccountStatus,
  getDaysRemaining,
  getServiceAccountStats,
  shortId,
} from '../../utils/serviceAccounts';
import { ServiceAccountDetail } from './ServiceAccountDetail';

interface ServiceAccountsViewProps {
  accounts: ServiceAccount[];
  orders: Order[];
  customers: Customer[];
  currency?: string;
  initialAccountId?: string;
  onAddAccount: () => void;
  onEditAccount: (account: ServiceAccount) => void;
  onDeleteAccount: (id: string) => void;
  onRenewAccount: (id: string, start: string, end: string) => void;
  onToggleSuspend: (id: string) => void;
  onUnlinkOrder: (orderId: string) => void;
  onAssignCustomer: (accountId: string) => void;
}

const PAGE_SIZE = 8;
const SERVICE_TYPE_FILTERS = ['ALL', 'Netflix', 'Disney+', 'Prime Video', 'Spotify', 'IPTV', 'YouTube Premium', 'HBO Max', 'Other'];

export const ServiceAccountsView: React.FC<ServiceAccountsViewProps> = ({
  accounts,
  orders,
  customers,
  currency = 'USD ($)',
  initialAccountId,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onRenewAccount,
  onToggleSuspend,
  onUnlinkOrder,
  onAssignCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expirationFilter, setExpirationFilter] = useState('ALL');
  const [capacityFilter, setCapacityFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ServiceAccount | null>(null);
  const [blockedDelete, setBlockedDelete] = useState<ServiceAccount | null>(null);

  const stats = useMemo(() => getServiceAccountStats(accounts, orders), [accounts, orders]);

  // Open a specific account detail (e.g. from Orders/Customers quick jump)
  useEffect(() => {
    if (initialAccountId) {
      setSelectedAccountId(initialAccountId);
    }
  }, [initialAccountId]);

  const selectedAccount = selectedAccountId ? accounts.find((a) => a.id === selectedAccountId) : null;

  const cleanSearch = sanitizeInput(searchTerm, { maxLen: 100, allowSpaces: true }).toLowerCase();

  const filteredAccounts = accounts.filter((acc) => {
    const occupancy = getOccupancy(acc, orders);
    const effectiveStatus = getEffectiveAccountStatus(acc);
    const daysLeft = getDaysRemaining(acc);

    const matchesSearch =
      acc.serviceType.toLowerCase().includes(cleanSearch) ||
      acc.email.toLowerCase().includes(cleanSearch) ||
      (acc.providerId || '').toLowerCase().includes(cleanSearch) ||
      acc.id.toLowerCase().includes(cleanSearch) ||
      orders.some(
        (o) =>
          o.serviceAccountId === acc.id &&
          (o.customerName.toLowerCase().includes(cleanSearch) ||
            o.customerWhatsApp.includes(cleanSearch) ||
            String(o.profileNumber || '').includes(cleanSearch))
      );

    const matchesService = serviceFilter === 'ALL' || acc.serviceType === serviceFilter;
    const matchesStatus = statusFilter === 'ALL' || effectiveStatus === statusFilter;

    let matchesExpiration = true;
    if (expirationFilter === 'SOON') matchesExpiration = effectiveStatus === 'Active' && daysLeft >= 0 && daysLeft <= 14;
    else if (expirationFilter === 'EXPIRED') matchesExpiration = effectiveStatus === 'Expired';

    let matchesCapacity = true;
    if (capacityFilter === 'FREE') matchesCapacity = occupancy.available > 0;
    else if (capacityFilter === 'FULL') matchesCapacity = occupancy.capacity > 0 && occupancy.available === 0;

    return matchesSearch && matchesService && matchesStatus && matchesExpiration && matchesCapacity;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageAccounts = filteredAccounts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const getStatusBadge = (account: ServiceAccount) => {
    const status = getEffectiveAccountStatus(account);
    if (status === 'Active') {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
        </span>
      );
    }
    if (status === 'Expired') {
      return (
        <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-100 px-2.5 py-1 rounded-full text-[11px] font-bold border border-rose-300">
          <XCircle className="w-3 h-3 text-rose-600" /> Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full text-[11px] font-bold border border-amber-300">
        <Power className="w-3 h-3 text-amber-600" /> Suspended
      </span>
    );
  };

  const getDaysBadge = (account: ServiceAccount) => {
    const daysLeft = getDaysRemaining(account);
    const status = getEffectiveAccountStatus(account);
    if (status !== 'Active') {
      return <span className="text-[11px] font-bold text-slate-400">—</span>;
    }
    return (
      <span
        className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${
          daysLeft <= 7
            ? 'text-rose-700 bg-rose-50 border-rose-200'
            : daysLeft <= 14
            ? 'text-amber-700 bg-amber-50 border-amber-200'
            : 'text-emerald-700 bg-emerald-50 border-emerald-200'
        }`}
      >
        {daysLeft}d
      </span>
    );
  };

  if (selectedAccount) {
    return (
      <div id="subly-accounts-view" className="p-8 space-y-6 bg-[#F5F7FA] min-h-[calc(100vh-72px)]">
        <ServiceAccountDetail
          account={selectedAccount}
          orders={orders}
          customers={customers}
          currency={currency}
          onBack={() => setSelectedAccountId(null)}
          onEditAccount={onEditAccount}
          onDeleteAccount={onDeleteAccount}
          onRenewAccount={onRenewAccount}
          onToggleSuspend={onToggleSuspend}
          onUnlinkOrder={onUnlinkOrder}
          onAssignCustomer={onAssignCustomer}
        />
      </div>
    );
  }

  return (
    <div id="subly-accounts-view" className="p-8 space-y-6 bg-[#F5F7FA] min-h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#111827]">Shared Service Accounts</h1>
            <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              {stats.total} Accounts
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Manage provider subscriptions, capacity, occupancy, and profile assignments across all services.
          </p>
        </div>

        <button
          id="btn-add-service-account-main"
          onClick={onAddAccount}
          className="flex items-center gap-2 bg-[#4A90FF] text-white hover:bg-[#3B82F6] hover:opacity-95 text-xs font-bold px-5 py-2.5 rounded-full shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service Account</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#E8EAF0]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Free Profiles</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-xl font-black text-[#111827] block mt-1">{stats.totalAvailableProfiles}</span>
          <span className="text-[11px] text-slate-400 font-medium">across {stats.total} accounts</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#E8EAF0]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiring Soon</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-xl font-black text-amber-600 block mt-1">{stats.expiringSoon.length}</span>
          <span className="text-[11px] text-slate-400 font-medium">within 14 days</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#E8EAF0]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expired</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-xl font-black text-rose-600 block mt-1">{stats.expired.length}</span>
          <span className="text-[11px] text-slate-400 font-medium">need renewal</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#E8EAF0]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Occupancy</span>
            <Wallet className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-xl font-black text-[#111827] block mt-1">{stats.avgOccupancy}%</span>
          <span className="text-[11px] text-slate-400 font-medium">{stats.totalUsedProfiles} used profiles</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#E8EAF0] space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by service, account email, provider, customer, phone, profile number..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
          </div>
          <select
            value={serviceFilter}
            onChange={(e) => {
              setServiceFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl text-xs font-medium text-[#111827] px-3 py-2 focus:outline-none"
          >
            {SERVICE_TYPE_FILTERS.map((st) => (
              <option key={st} value={st}>{st === 'ALL' ? 'All Services' : st}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl text-xs font-medium text-[#111827] px-3 py-2 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Suspended">Suspended</option>
          </select>
          <select
            value={expirationFilter}
            onChange={(e) => {
              setExpirationFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl text-xs font-medium text-[#111827] px-3 py-2 focus:outline-none"
          >
            <option value="ALL">All Expirations</option>
            <option value="SOON">Expiring Soon (≤ 14 days)</option>
            <option value="EXPIRED">Expired</option>
          </select>
          <select
            value={capacityFilter}
            onChange={(e) => {
              setCapacityFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl text-xs font-medium text-[#111827] px-3 py-2 focus:outline-none"
          >
            <option value="ALL">All Capacities</option>
            <option value="FREE">Has Free Profiles</option>
            <option value="FULL">Fully Occupied</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-[#E8EAF0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#E8EAF0] text-[11px] font-extrabold uppercase tracking-wider text-[#6B7280]">
                <th className="py-4 px-6">Service Account</th>
                <th className="py-4 px-6">Provider</th>
                <th className="py-4 px-6">Subscription</th>
                <th className="py-4 px-6">Days</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Cost</th>
                <th className="py-4 px-6">Occupancy</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAF0] text-xs">
              {pageAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Server className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">No service accounts found</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting your filters or add a new service account.</p>
                  </td>
                </tr>
              ) : (
                pageAccounts.map((acc) => {
                  const occupancy = getOccupancy(acc, orders);
                  return (
                    <tr
                      key={acc.id}
                      onClick={() => setSelectedAccountId(acc.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs">
                            {acc.serviceType.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-[#111827] block">{acc.serviceType}</span>
                            <span className="text-[11px] text-[#6B7280] font-mono">{maskEmail(acc.email)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-slate-600 font-medium">{acc.providerId || '—'}</span>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">#{shortId(acc.id)}</span>
                      </td>
                      <td className="py-4 px-6 text-[#6B7280] font-medium">
                        {acc.subscriptionStart} <span className="text-slate-300">→</span> {acc.subscriptionEnd}
                      </td>
                      <td className="py-4 px-6">{getDaysBadge(acc)}</td>
                      <td className="py-4 px-6">{getStatusBadge(acc)}</td>
                      <td className="py-4 px-6 font-extrabold text-[#111827]">{formatCurrency(acc.purchaseCost, currency)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 min-w-[110px]">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                occupancy.percent >= 100 ? 'bg-rose-500' : occupancy.percent >= 75 ? 'bg-amber-500' : 'bg-[#4A90FF]'
                              }`}
                              style={{ width: `${occupancy.percent}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                            {occupancy.used}/{occupancy.capacity}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAccountId(acc.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Open Account"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditAccount(acc);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Account"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const hasLinked = orders.some((o) => o.serviceAccountId === acc.id);
                              if (hasLinked) {
                                setBlockedDelete(acc);
                              } else {
                                setPendingDelete(acc);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredAccounts.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-[#E8EAF0] text-xs">
            <span className="text-slate-400 font-medium">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredAccounts.length)} of {filteredAccounts.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1.5 rounded-lg border border-[#E8EAF0] text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-[#111827]">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1.5 rounded-lg border border-[#E8EAF0] text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setPendingDelete(null)}
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
              Are you sure you want to delete{' '}
              <span className="font-bold text-[#111827]">{pendingDelete.email}</span> ({pendingDelete.serviceType})?{' '}
              This account has no assigned profiles and the deletion cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAccount(pendingDelete.id);
                  setPendingDelete(null);
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
          onClick={() => setBlockedDelete(null)}
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
                onClick={() => setBlockedDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="font-bold text-[#111827]">{blockedDelete.email}</span> ({blockedDelete.serviceType}) has{' '}
              <span className="font-bold text-[#111827]">
                {orders.filter((o) => o.serviceAccountId === blockedDelete.id).length}
              </span>{' '}
              assigned profile(s) and cannot be deleted. First remove the customer profiles from the account
              (unlink each order in the account details) before deleting it.
            </p>
            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBlockedDelete(null)}
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
