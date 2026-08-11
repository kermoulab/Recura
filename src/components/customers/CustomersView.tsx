import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  MessageSquare,
  MoreVertical,
  Trash2,
  Edit2,
  Ban,
  CheckCircle,
  Filter,
  Star,
  Clock,
  AlertTriangle,
  X,
  Server,
} from 'lucide-react';
import { Customer, CustomerStatus, Order, ServiceAccount } from '../../types/erp';
import { createWhatsAppWebUrl } from '../../utils/whatsapp';
import { sanitizeInput } from '../../utils/security';
import { formatCurrency } from '../../utils/crypto';
import { getAccountById } from '../../utils/serviceAccounts';

interface CustomersViewProps {
  customers: Customer[];
  orders?: Order[];
  serviceAccounts?: ServiceAccount[];
  currency?: string;
  onAddCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onToggleBlockCustomer: (id: string) => void;
  onOpenServiceAccount?: (accountId: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  orders = [],
  serviceAccounts = [],
  currency = 'USD ($)',
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onToggleBlockCustomer,
  onOpenServiceAccount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [pendingDelete, setPendingDelete] = useState<Customer | null>(null);
  const [blockedDelete, setBlockedDelete] = useState<Customer | null>(null);

  const hasActiveOrders = (customerId: string) =>
    orders.some((o) => o.customerId === customerId && o.status !== 'EXPIRED');

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (hasActiveOrders(pendingDelete.id)) {
      setBlockedDelete(pendingDelete);
      setPendingDelete(null);
      return;
    }
    onDeleteCustomer(pendingDelete.id);
    setPendingDelete(null);
  };

  const cleanSearch = sanitizeInput(searchTerm, { maxLen: 100, allowSpaces: true }).toLowerCase();

  const formatDateOnly = (value?: string) => (value ? value.split('T')[0] : '—');

  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.name.toLowerCase().includes(cleanSearch) ||
      cust.whatsapp.includes(cleanSearch) ||
      (cust.email && cust.email.toLowerCase().includes(cleanSearch));

    const matchesStatus = selectedStatus === 'ALL' || cust.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div id="subly-customers-view" className="p-8 space-y-6 bg-[#F5F7FA] min-h-[calc(100vh-72px)]">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#111827]">Customer Relationship Management</h1>
            <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              {customers.length} Total
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Manage subscriber profiles, language preferences, contact numbers, and order histories.
          </p>
        </div>

        <button
          id="btn-add-customer-main"
          onClick={onAddCustomer}
          className="flex items-center gap-2 bg-[#111827] text-white hover:bg-black text-xs font-bold px-4 py-2.5 rounded-full shadow-xs transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#E8EAF0] flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, WhatsApp, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl text-xs font-medium text-[#111827] px-3 py-2 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="BLOCKED">Blocked</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-[#E8EAF0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#E8EAF0] text-[11px] font-extrabold uppercase tracking-wider text-[#6B7280]">
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">WhatsApp Contact</th>
                <th className="py-4 px-6">Service Account</th>
                <th className="py-4 px-6">Registration</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Orders</th>
                <th className="py-4 px-6">Total Spent</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAF0] text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">No customers found</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting your filters or add a new customer.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const customerOrderCount = orders.filter((o) => o.customerId === cust.id).length;
                  const waUrl = createWhatsAppWebUrl(
                    cust.whatsapp,
                    `Hello ${cust.name}, contacting you from Recura ERP regarding your subscription.`
                  );

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs">
                            {cust.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-[#111827] block">{cust.name}</span>
                            <span className="text-[11px] text-[#6B7280]">{cust.email || 'No email registered'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 font-bold px-2.5 py-1 rounded-full border border-emerald-200 text-xs transition-colors"
                          title="Chat on WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 fill-emerald-600" />
                          <span>{cust.whatsapp}</span>
                        </a>
                      </td>

                      <td className="py-4 px-6">
                        {(() => {
                          const linked = orders
                            .filter((o) => o.customerId === cust.id && o.serviceAccountId)
                            .slice(0, 3);
                          if (linked.length === 0) {
                            return <span className="text-slate-300 font-medium">—</span>;
                          }
                          return (
                            <div className="flex flex-col gap-1">
                              {linked.map((o) => {
                                const acc = getAccountById(serviceAccounts, o.serviceAccountId);
                                if (!acc) return null;
                                return (
                                  <button
                                    key={o.id}
                                    onClick={() => onOpenServiceAccount?.(acc.id)}
                                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-full transition-colors text-left cursor-pointer"
                                    title={`${acc.serviceType} account (${acc.email})`}
                                  >
                                    <Server className="w-3 h-3 text-blue-500 shrink-0" />
                                    <span>{acc.serviceType}</span>
                                    {o.profileNumber && (
                                      <span className="font-mono text-blue-600">#{o.profileNumber}</span>
                                    )}
                                    <span className="text-blue-400 font-semibold">→</span>
                                  </button>
                                );
                              })}
                              {orders.filter((o) => o.customerId === cust.id && o.serviceAccountId).length > 3 && (
                                <span className="text-[10px] text-slate-400 font-semibold pl-1">
                                  +{orders.filter((o) => o.customerId === cust.id && o.serviceAccountId).length - 3} more
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      <td className="py-4 px-6 text-[#6B7280] font-medium">{formatDateOnly(cust.registrationDate)}</td>

                      <td className="py-4 px-6">
                        {cust.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-300 shadow-2xs">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Active
                          </span>
                        ) : cust.status === 'VIP' ? (
                          <span className="inline-flex items-center gap-1 text-purple-800 bg-purple-100 px-2.5 py-1 rounded-full text-[11px] font-bold border border-purple-300 shadow-2xs">
                            <Star className="w-3 h-3 text-purple-600 fill-purple-400" />
                            VIP
                          </span>
                        ) : cust.status === 'BLOCKED' ? (
                          <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-100 px-2.5 py-1 rounded-full text-[11px] font-bold border border-rose-300 shadow-2xs">
                            <Ban className="w-3 h-3 text-rose-600" />
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full text-[11px] font-bold border border-amber-300 shadow-2xs">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 font-bold text-[#111827]">{customerOrderCount} orders</td>

                      <td className="py-4 px-6 font-extrabold text-[#111827]">{formatCurrency(cust.totalSpent, currency)}</td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditCustomer(cust)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onToggleBlockCustomer(cust.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              cust.status === 'BLOCKED'
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-amber-600 hover:bg-amber-50'
                            }`}
                            title={cust.status === 'BLOCKED' ? 'Unblock Customer' : 'Block Customer'}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPendingDelete(cust)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Customer"
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
              <h3 className="font-extrabold text-base text-[#111827]">Delete Customer?</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete{' '}
              <span className="font-bold text-[#111827]">{pendingDelete.name}</span>? This action
              cannot be undone.
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
                onClick={confirmDelete}
                className="px-4 py-2 rounded-full bg-rose-600 text-white font-bold hover:bg-rose-700 cursor-pointer transition-colors shadow-sm active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cannot Delete (active orders) Modal */}
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
                <h3 className="font-extrabold text-base text-[#111827]">Customer Cannot Be Deleted</h3>
              </div>
              <button
                onClick={() => setBlockedDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="font-bold text-[#111827]">{blockedDelete.name}</span> has active
              orders and cannot be deleted. Please complete, remove, or wait for those orders to
              expire before deleting this customer.
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
