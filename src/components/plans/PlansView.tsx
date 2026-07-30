import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, ShieldAlert, CheckCircle2, Layers } from 'lucide-react';
import { Plan } from '../../types/erp';
import { formatCurrency } from '../../utils/crypto';

interface PlansViewProps {
  plans: Plan[];
  currency?: string;
  onAddPlan: () => void;
  onEditPlan: (plan: Plan) => void;
  onDeletePlan: (id: string) => void;
}

export const PlansView: React.FC<PlansViewProps> = ({
  plans,
  currency = 'USD ($)',
  onAddPlan,
  onEditPlan,
  onDeletePlan,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredPlans = plans.filter(
    (p) => selectedCategory === 'ALL' || p.category === selectedCategory
  );

  return (
    <div id="subly-plans-view" className="p-8 space-y-6 bg-[#F5F7FA] min-h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#111827]">Subscription Plans & Stock Inventory</h1>
            <span className="bg-purple-50 text-purple-600 text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
              {plans.length} Active Services
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Manage prices, duration terms, available pool stock, and streaming credentials pool.
          </p>
        </div>

        <button
          id="btn-add-plan-main"
          onClick={onAddPlan}
          className="flex items-center gap-2 bg-[#4A90FF] text-white hover:bg-[#3B82F6] hover:opacity-95 text-xs font-bold px-4 py-2.5 rounded-full shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Plan</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['ALL', 'Netflix', 'Disney+', 'Prime Video', 'Spotify', 'IPTV', 'YouTube Premium', 'HBO Max', 'Other'].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#E8EAF0]'
              }`}
            >
              {cat === 'ALL' ? 'All Services' : cat}
            </button>
          )
        )}
      </div>

      {/* Plans Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => {
          const isLowStock = plan.availableStock <= 5;

          return (
            <div
              key={plan.id}
              className="bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0] flex flex-col justify-between relative group hover:border-blue-300 transition-all"
            >
              <div>
                {/* Category Badge & Actions */}
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-full border border-blue-200 tracking-wider">
                    {plan.category}
                  </span>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditPlan(plan)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeletePlan(plan.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-extrabold text-base text-[#111827] mb-1">{plan.name}</h3>
                <p className="text-xs text-[#6B7280] min-h-[32px] line-clamp-2">{plan.notes || 'No notes provided'}</p>

                {/* Price & Duration */}
                <div className="my-5 p-4 rounded-2xl bg-[#F5F7FA] border border-[#E8EAF0] flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-black text-[#111827]">{formatCurrency(plan.price, currency)}</span>
                    <span className="text-xs font-semibold text-[#6B7280] ml-1">
                      / {plan.durationMonths} {plan.durationMonths === 1 ? 'Month' : 'Months'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                    {formatCurrency(Number((plan.price / plan.durationMonths).toFixed(2)), currency)}/mo
                  </span>
                </div>

                {/* Stock Stats */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B7280] font-medium">Available Accounts Pool</span>
                    <span
                      className={`font-black px-2 py-0.5 rounded-md ${
                        isLowStock
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {plan.availableStock} in stock
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                    <span>Active Orders</span>
                    <span className="font-bold text-[#111827]">{plan.activeOrders}</span>
                  </div>

                  {/* Stock Bar */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isLowStock ? 'bg-rose-500' : 'bg-[#4A90FF]'
                      }`}
                      style={{
                        width: `${Math.min(100, (plan.availableStock / plan.totalAccounts) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Low Stock Warning */}
              {isLowStock && (
                <div className="mt-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Low stock warning! Add more account credentials to pool.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
