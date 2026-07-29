import React, { useState } from 'react';
import { X, Search, Users, ShoppingBag, Package } from 'lucide-react';
import { Customer, Order, Plan } from '../../types/erp';
import { sanitizeInput } from '../../utils/security';
import { formatCurrency } from '../../utils/crypto';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  orders: Order[];
  plans: Plan[];
  currency?: string;
  onSelectResult: (type: 'customer' | 'order' | 'plan') => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  customers,
  orders,
  plans,
  currency = 'USD ($)',
  onSelectResult,
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');

  const cleanQuery = sanitizeInput(query, { maxLen: 100, allowSpaces: true }).toLowerCase();

  const matchedCustomers = cleanQuery
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(cleanQuery) ||
          c.whatsapp.includes(cleanQuery) ||
          (c.email && c.email.toLowerCase().includes(cleanQuery))
      )
    : [];

  const matchedOrders = cleanQuery
    ? orders.filter(
        (o) =>
          o.customerName.toLowerCase().includes(cleanQuery) ||
          o.accountEmail.toLowerCase().includes(cleanQuery) ||
          o.id.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchedPlans = cleanQuery
    ? plans.filter(
        (p) =>
          p.name.toLowerCase().includes(cleanQuery) ||
          p.category.toLowerCase().includes(cleanQuery)
      )
    : [];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4 z-50 animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full p-4 shadow-2xl border border-[#E8EAF0] space-y-4 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            placeholder="Search customers, orders, accounts, streaming plans..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-[#F5F7FA] border border-[#E8EAF0] rounded-2xl text-sm font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results */}
        <div className="space-y-4 max-h-[350px] overflow-y-auto text-xs px-2">
          {!query ? (
            <p className="text-center py-8 text-slate-400 font-medium">
              Type to search across all orders, customers, and streaming plans...
            </p>
          ) : matchedCustomers.length === 0 && matchedOrders.length === 0 && matchedPlans.length === 0 ? (
            <p className="text-center py-8 text-slate-400 font-medium">
              No matching records found for "{query}".
            </p>
          ) : (
            <>
              {/* Customers */}
              {matchedCustomers.length > 0 && (
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-2">
                    Customers ({matchedCustomers.length})
                  </span>
                  <div className="space-y-1">
                    {matchedCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectResult('customer');
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-100 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="font-bold text-[#111827]">{c.name}</span>
                          <span className="text-slate-400">({c.whatsapp})</span>
                        </div>
                        <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-bold">
                          {c.preferredLanguage}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders */}
              {matchedOrders.length > 0 && (
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-2">
                    Orders ({matchedOrders.length})
                  </span>
                  <div className="space-y-1">
                    {matchedOrders.map((o) => (
                      <div
                        key={o.id}
                        onClick={() => {
                          onSelectResult('order');
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-100 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-emerald-500" />
                          <span className="font-mono text-slate-400">#{o.id}</span>
                          <span className="font-bold text-[#111827]">{o.customerName}</span>
                          <span className="text-blue-600 font-semibold">{o.planName}</span>
                        </div>
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
                          {o.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plans */}
              {matchedPlans.length > 0 && (
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-2">
                    Plans ({matchedPlans.length})
                  </span>
                  <div className="space-y-1">
                    {matchedPlans.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSelectResult('plan');
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-100 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-purple-500" />
                          <span className="font-bold text-[#111827]">{p.name}</span>
                        </div>
                        <span className="font-black text-[#111827]">{formatCurrency(p.price, currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
