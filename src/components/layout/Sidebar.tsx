import React from 'react';
import {
  LayoutGrid,
  Users,
  ShoppingBag,
  Package,
  Bell,
  Database,
  ShieldCheck,
  Settings,
  LogOut,
} from 'lucide-react';

import { UserRole } from '../../types/erp';

export type ERPView =
  | 'dashboard'
  | 'customers'
  | 'orders'
  | 'plans'
  | 'alerts'
  | 'database'
  | 'audit'
  | 'settings';

interface SidebarProps {
  currentView: ERPView;
  onSelectView: (view: ERPView) => void;
  expiringBadgeCount?: number;
  userRole?: UserRole;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  expiringBadgeCount = 0,
  userRole = 'ADMIN',
  onLogout,
}) => {
  const isRestrictedUser = userRole !== 'ADMIN';

  const rawNavItems: { id: ERPView; label: string; icon: React.ReactNode; badge?: number; adminOnly?: boolean }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutGrid className="w-5 h-5" />,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    {
      id: 'plans',
      label: 'Plans & Inventory',
      icon: <Package className="w-5 h-5" />,
      adminOnly: true,
    },
    {
      id: 'alerts',
      label: 'Alerts & Renewals',
      icon: <Bell className="w-5 h-5" />,
      badge: expiringBadgeCount,
    },
    {
      id: 'database',
      label: 'Database & SQL',
      icon: <Database className="w-5 h-5" />,
      adminOnly: true,
    },
    {
      id: 'audit',
      label: 'Audit Logs',
      icon: <ShieldCheck className="w-5 h-5" />,
      adminOnly: true,
    },
    {
      id: 'settings',
      label: 'Profile & Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const navItems = isRestrictedUser ? rawNavItems.filter((i) => !i.adminOnly) : rawNavItems;


  return (
    <aside
      id="subly-sidebar"
      className="fixed left-0 top-0 bottom-0 w-[80px] bg-[#111111] text-white flex flex-col justify-between items-center py-6 z-40 rounded-r-2xl shadow-xl select-none"
    >
      {/* Navigation Icons Stack */}
      <nav className="flex flex-col gap-3 my-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <div key={item.id} className="relative group flex justify-center">
              <button
                id={`btn-nav-${item.id}`}
                onClick={() => onSelectView(item.id)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 relative ${
                  isActive
                    ? 'bg-[#4A90FF] text-white shadow-md shadow-blue-500/30 scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
                title={item.label}
              >
                {item.icon}

                {/* Badge if counter exists */}
                {typeof item.badge === 'number' && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {item.badge}
                  </span>
                ) : null}
              </button>

              {/* Hover Tooltip */}
              <div className="absolute left-[68px] top-1/2 -translate-y-1/2 bg-white text-black text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 whitespace-nowrap shadow-xl border border-slate-200 z-50">
                {item.label}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom Logout Button */}
      <div className="relative group flex justify-center">
        <button
          id="btn-sidebar-logout"
          onClick={onLogout}
          className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
          title="Log Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
        <div className="absolute left-[68px] top-1/2 -translate-y-1/2 bg-white text-black text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 whitespace-nowrap shadow-xl border border-slate-200 z-50">
          Log Out
        </div>
      </div>
    </aside>
  );
};
