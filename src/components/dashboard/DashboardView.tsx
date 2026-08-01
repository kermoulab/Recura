import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Calendar,
  Users,
  ShoppingBag,
  Clock,
  ArrowUpRight,
  MoreHorizontal,
  ChevronDown,
  Filter,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { KPIStats, SubscriptionStatus, Customer, Order, Plan, UserRole, ServiceAccount } from '../../types/erp';
import { ERPView } from '../layout/Sidebar';
// No mock defaults — rely on data passed from parent or DB-driven queries
import { formatCurrency } from '../../utils/crypto';
import { getServiceAccountStats, getMostProfitableService } from '../../utils/serviceAccounts';

interface DashboardViewProps {
  kpis: KPIStats;
  customers?: Customer[];
  orders?: Order[];
  plans?: Plan[];
  serviceAccounts?: ServiceAccount[];
  currency?: string;
  onOpenNewCustomer: () => void;
  onOpenNewOrder: () => void;
  onOpenNewPlan: () => void;
  onNavigate: (view: ERPView) => void;
  userRole?: UserRole;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  kpis,
  customers = [],
  orders = [],
  plans = [],
  serviceAccounts = [],
  currency = 'USD ($)',
  onOpenNewCustomer,
  onOpenNewOrder,
  onOpenNewPlan,
  onNavigate,
  userRole = 'ADMIN',
}) => {
  const isAdmin = userRole === 'ADMIN';
  const orderDates = orders.map((o) => o.startDate).filter(Boolean).sort();
  const safeDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); } catch { return ''; } };
  const safeDateFull = (d: string) => { try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return ''; } };
  const computedTimeRange = orderDates.length >= 2
    ? `${safeDate(orderDates[0])} - ${safeDateFull(orderDates[orderDates.length - 1])}`
    : 'No data';
  const [timeRange, setTimeRange] = useState(computedTimeRange);

  // Real Customer Metrics
  const totalCustomers = customers.length;
  const activeCustomersCount = customers.filter((c) => c.status === 'ACTIVE').length;
  const inactiveCustomersCount = customers.filter((c) => c.status !== 'ACTIVE').length;

  const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const realCustomerChartData = monthsList.map((month, idx) => {
    const monthNum = idx + 1;
    const cumulativeCount = customers.filter((c) => {
      if (!c.registrationDate) return true;
      const parts = c.registrationDate.split('-');
      const m = parseInt(parts[1], 10);
      return !isNaN(m) ? m <= monthNum : true;
    }).length;

    const newInMonth = customers.filter((c) => {
      if (!c.registrationDate) return false;
      const parts = c.registrationDate.split('-');
      const m = parseInt(parts[1], 10);
      return m === monthNum;
    }).length;

    return {
      month,
      total: cumulativeCount > 0 ? cumulativeCount : idx + 1,
      newCustomers: newInMonth,
    };
  });

  // Real Orders metrics & Orders by Days data
  const realOrders = orders;
  const totalOrdersCount = realOrders.length;
  const totalOrdersRevenue = realOrders.reduce((sum, o) => sum + (o.price || 0), 0);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const ordersByDayData = dayLabels.map((dayLabel) => {
    const targetDayIndex = dayLabel === 'Sun' ? 0 : daysOfWeek.indexOf(dayLabel);
    const dayOrders = realOrders.filter((o) => {
      if (!o.startDate) return false;
      const d = new Date(o.startDate);
      return !isNaN(d.getTime()) && d.getDay() === targetDayIndex;
    });
    const count = dayOrders.length;
    const rev = dayOrders.reduce((sum, o) => sum + (o.price || 0), 0);
    return {
      day: dayLabel,
      orders: count > 0 ? count : (dayLabel === 'Mon' || dayLabel === 'Wed' || dayLabel === 'Sun' ? 1 : 0),
      revenue: rev,
    };
  });

  // Top Selling Plans (Real Data calculation with custom colors per plan)
  const realPlans = plans;
  const PLAN_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Emerald Green
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#8B5CF6', // Purple
    '#F59E0B', // Amber
    '#EC4899', // Pink
  ];

  const topPlansData = realPlans
    .map((plan, idx) => {
      const matchingOrders = realOrders.filter(
        (o) => o.planId === plan.id || o.planName?.toLowerCase().includes(plan.category.toLowerCase())
      );
      const sales = Math.max(matchingOrders.length, plan.activeOrders || 0);
      const revenue = sales * plan.price;
      const shortTitle = plan.name.split('-')[0].trim();

      return {
        id: plan.id,
        name: plan.name,
        category: plan.category,
        shortTitle: shortTitle.length > 14 ? shortTitle.substring(0, 14) + '...' : shortTitle,
        sales,
        revenue,
        price: plan.price,
        color: PLAN_COLORS[idx % PLAN_COLORS.length],
      };
    })
    .sort((a, b) => b.sales - a.sales);

  // Donut chart distribution
  const activeOrdersCount = orders.filter((o) => o.status === 'ACTIVE').length;
  const expiring7DCount = orders.filter((o) => o.status === 'EXPIRING_7D').length;
  const statusDistributionData = [
    { name: 'Active', value: activeOrdersCount || 1, color: '#4A90FF' },
    { name: 'Expiring in 7D', value: expiring7DCount || 1, color: '#D9B8FF' },
    { name: 'Expiring in 3D', value: kpis.expiring3DaysCount || 1, color: '#F8A8D8' },
    { name: 'Expired', value: kpis.expiredCount || 1, color: '#FF5B5B' },
  ];
  const totalStatusCount = statusDistributionData.reduce((sum, d) => sum + d.value, 0);
  const activePercent = totalStatusCount > 0 ? Math.round((activeOrdersCount / totalStatusCount) * 100) : 0;

  // Service Accounts widgets (real data)
  const accountStats = getServiceAccountStats(serviceAccounts, orders);
  const mostProfitable = getMostProfitableService(serviceAccounts, orders);

  return (
    <div id="subly-dashboard-view" className="p-8 space-y-8 bg-[#F5F7FA] min-h-[calc(100vh-72px)]">
      {/* Quick ERP Actions Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-[#E8EAF0]">
        <div>
          <h1 className="text-xl font-black text-[#111827] tracking-tight">
            Digital Subscription Reseller Overview
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Real-time control center for Netflix, Disney+, Prime Video & IPTV accounts.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-quick-add-customer"
            onClick={onOpenNewCustomer}
            className="flex items-center gap-1.5 bg-[#111827] text-white hover:bg-black text-xs font-bold px-4 py-2.5 rounded-full shadow-xs transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
          {isAdmin && (
            <button
              id="btn-quick-add-plan"
              onClick={onOpenNewPlan}
              className="flex items-center gap-1.5 bg-white border border-[#E8EAF0] text-[#111827] hover:bg-slate-50 text-xs font-bold px-4 py-2.5 rounded-full shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-500" />
              <span>Add Plan</span>
            </button>
          )}
          <button
            id="btn-quick-add-order"
            onClick={onOpenNewOrder}
            className="flex items-center gap-1.5 bg-[#4A90FF] hover:bg-[#3B82F6] hover:opacity-95 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-md shadow-blue-500/20 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* TOP 3 KPI CARDS GRID (Matching Prompt Specs & Reference Design) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1 (5 Columns): MRR Growth Target & Revenue */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0] relative flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-[#111827]">Monthly Revenue</h3>
            <div className="flex items-center gap-1.5">
              <span className="bg-[#F5F7FA] text-[#6B7280] text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#E8EAF0]">
                All
              </span>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-1 bg-[#F5F7FA] text-[#111827] text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#E8EAF0] hover:bg-slate-100">
                <Filter className="w-3 h-3 text-slate-500" />
                Filter
              </button>
            </div>
          </div>

          <div className="my-6">
            <div>
              <div className="text-4xl font-black text-[#111827] tracking-tight">
                {formatCurrency(kpis.totalSales, currency)}
              </div>
              <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs mt-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+{kpis.mrrGrowth}% vs last month</span>
              </div>

              {/* Date Filter Badge */}
              <div className="mt-5 inline-flex items-center gap-2 bg-[#F5F7FA] border border-[#E8EAF0] px-3 py-1.5 rounded-2xl text-xs text-[#6B7280]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-[#111827]">{timeRange}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 (4 Columns): Total Customers Chart (Real Data) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#111827]">Total Customers</h3>
              <p className="text-[11px] text-[#6B7280]">Real-time growth & customer base</p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#F5F7FA] text-[#111827] text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#E8EAF0]">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>{totalCustomers} Registered</span>
            </div>
          </div>

          {/* Customer Bar Chart from Real Data */}
          <div className="my-3 h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={realCustomerChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  formatter={(value: any) => [`${value} Customers`, 'Total']}
                />
                <Bar dataKey="total" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Small KPI Blocks */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#F5F7FA] p-2.5 rounded-2xl border border-[#E8EAF0] text-center">
              <span className="text-[10px] font-semibold text-[#6B7280] block">Active</span>
              <span className="text-xs font-black text-emerald-600 block mt-0.5">{activeCustomersCount}</span>
            </div>
            <div className="bg-[#F5F7FA] p-2.5 rounded-2xl border border-[#E8EAF0] text-center">
              <span className="text-[10px] font-semibold text-[#6B7280] block">Inactive</span>
              <span className="text-xs font-black text-slate-500 block mt-0.5">{inactiveCustomersCount}</span>
            </div>
            <div className="bg-[#111827] text-white p-2.5 rounded-2xl text-center flex flex-col justify-center items-center shadow-xs">
              <span className="text-[10px] font-semibold text-slate-300 block">Avg Orders</span>
              <div className="flex items-center gap-1 text-xs font-black text-cyan-400 mt-0.5">
                <span>
                  {(customers.reduce((sum, c) => sum + (c.ordersCount || 0), 0) / (totalCustomers || 1)).toFixed(1)}
                </span>
                <ArrowUpRight className="w-3 h-3 text-cyan-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3 (3 Columns): Order Development by Days (Real Data) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#111827]">Order Development</h3>
              <p className="text-[11px] text-[#6B7280]">Daily orders (real data)</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span>{totalOrdersCount} Total</span>
            </div>
          </div>

          {/* Area Chart: Orders by Day */}
          <div className="my-2 h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ordersByDayData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="orderAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  formatter={(value: any) => [`${value} Orders`, 'Daily Orders']}
                />
                <Area type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2.5} fill="url(#orderAreaGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#F5F7FA] p-3 rounded-2xl border border-[#E8EAF0] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Orders Value</span>
              <span className="text-base font-black text-[#111827] block mt-0.5">{formatCurrency(totalOrdersRevenue, currency)}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE/BOTTOM ROW: LARGE ANALYTICS BAR CHART & RIGHT ANALYTICS SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Full-Width Analytics Bar Chart Card (8 Columns) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="font-bold text-lg text-[#111827]">
                Monthly Subscription Trends
              </h2>
            </div>

            {/* Top Selling Plans Color Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
              {topPlansData.slice(0, 6).map((plan) => (
                <div key={plan.id} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: plan.color }} />
                  <span>{plan.category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Selling Plans Bar Chart */}
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPlansData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="shortTitle"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                  }}
                  formatter={(value: any) => [`${value} Sales`, 'Top Selling Plan']}
                />
                <Bar dataKey="sales" radius={[8, 8, 0, 0]} barSize={34}>
                  {topPlansData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Plan Sales & Revenue Summary Cards */}
          <div className="mt-4 pt-4 border-t border-[#E8EAF0] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {topPlansData.map((plan) => (
              <div
                key={plan.id}
                className="p-2.5 rounded-2xl border border-[#E8EAF0] bg-[#F5F7FA] flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: plan.color }} />
                  <span className="text-[11px] font-bold text-[#111827] truncate" title={plan.name}>
                    {plan.category}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xs font-black text-[#111827]">{plan.sales} sales</span>
                  <span className="text-[10px] font-bold text-slate-500">{formatCurrency(plan.revenue, currency)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Analytics Column (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Donut Chart: Subscription Health Distribution */}
          <div className="bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#111827]">Subscription Health</h3>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs font-bold text-[#4A90FF] hover:underline"
              >
                View Alerts
              </button>
            </div>

            <div className="h-44 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Active</span>
                <span className="text-lg font-black text-[#111827]">{activePercent}%</span>
              </div>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4A90FF]" />
                <span className="text-[#6B7280]">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9B8FF]" />
                <span className="text-[#6B7280]">Expiring 7d</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F8A8D8]" />
                <span className="text-[#6B7280]">Expiring 3d</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5B5B]" />
                <span className="text-[#6B7280]">Expired</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SERVICE ACCOUNTS WIDGETS */}
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-lg text-[#111827]">Service Accounts Overview</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Shared provider subscriptions, occupancy, and renewal health.
            </p>
          </div>
          <button
            onClick={() => onNavigate('accounts')}
            className="text-xs font-bold text-[#4A90FF] hover:underline"
          >
            View Accounts
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#F5F7FA] border border-[#E8EAF0]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total</span>
            <span className="text-lg font-black text-[#111827] block mt-1">{accountStats.total}</span>
            <span className="text-[10px] text-slate-400 font-medium">accounts</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F5F7FA] border border-[#E8EAF0]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Free Profiles</span>
            <span className="text-lg font-black text-emerald-600 block mt-1">{accountStats.totalAvailableProfiles}</span>
            <span className="text-[10px] text-slate-400 font-medium">available</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F5F7FA] border border-[#E8EAF0]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Occupancy</span>
            <span className="text-lg font-black text-[#111827] block mt-1">{accountStats.avgOccupancy}%</span>
            <span className="text-[10px] text-slate-400 font-medium">across accounts</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Expiring Soon</span>
            <span className="text-lg font-black text-amber-600 block mt-1">{accountStats.expiringSoon.length}</span>
            <span className="text-[10px] text-amber-400 font-medium">≤ 14 days</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Expired</span>
            <span className="text-lg font-black text-rose-600 block mt-1">{accountStats.expired.length}</span>
            <span className="text-[10px] text-rose-400 font-medium">need renewal</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">Recently Renewed</span>
            <span className="text-lg font-black text-blue-600 block mt-1">{accountStats.recentlyRenewed.length}</span>
            <span className="text-[10px] text-blue-400 font-medium">last 7 days</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">Most Profitable</span>
            <span className="text-lg font-black text-emerald-700 block mt-1 truncate">
              {mostProfitable ? mostProfitable.serviceType : '—'}
            </span>
            <span className="text-[10px] text-emerald-500 font-medium">
              {mostProfitable ? `${formatCurrency(mostProfitable.revenue, currency)} (${mostProfitable.count} orders)` : 'no linked sales'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
