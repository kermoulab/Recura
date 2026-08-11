import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, ShieldCheck, UserCheck, ChevronDown, CheckCircle2, User, Users, Lock, LogOut, Server, ShoppingBag } from 'lucide-react';
import { ERPView } from './Sidebar';
import { UserProfile, Order, ServiceAccount, Customer } from '../../types/erp';
import { getEffectiveAccountStatus, getDaysRemaining, resolveOrderCustomerName } from '../../utils/serviceAccounts';

interface HeaderProps {
  currentView: ERPView;
  onSelectView: (view: ERPView) => void;
  onOpenSearch: () => void;
  unreadNotificationsCount?: number;
  currentUser?: UserProfile;
  profiles?: UserProfile[];
  orders?: Order[];
  customers?: Customer[];
  serviceAccounts?: ServiceAccount[];
  onSelectProfile?: (user: UserProfile) => void;
  onLogout?: () => void;
  onOpenSessionsModal?: () => void;
  onOpenProfileSettings?: () => void;
  onOpenRenewalTab?: (tab: '3d' | '7d' | 'expired', orderIds: string[]) => void;
  onOpenAccounts?: (accountId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  onOpenSearch,
  unreadNotificationsCount = 2,
  currentUser = {
    id: 'admin_1',
    fullName: 'James Noah',
    email: 'admin@recura.io',
    role: 'ADMIN',
    createdAt: '2026-01-01',
  },
  profiles = [],
  orders = [],
  customers = [],
  serviceAccounts = [],
  onSelectProfile,
  onLogout,
  onOpenSessionsModal,
  onOpenProfileSettings,
  onOpenRenewalTab,
  onOpenAccounts,
}) => {
  const expiring3DOrders = orders.filter((o) => o.status === 'EXPIRING_3D');
  const expiring7DOrders = orders.filter((o) => o.status === 'EXPIRING_7D');
  const expiredOrders = orders.filter((o) => o.status === 'EXPIRED');
  const expiring3DNames = expiring3DOrders.map((o) => resolveOrderCustomerName(o, customers)).slice(0, 3);
  const expiring7DNames = expiring7DOrders.map((o) => resolveOrderCustomerName(o, customers)).slice(0, 3);
  const expiredNames = expiredOrders.map((o) => resolveOrderCustomerName(o, customers)).slice(0, 3);

  const expiring3DAccounts = serviceAccounts.filter(
    (a) => getEffectiveAccountStatus(a) === 'Active' && getDaysRemaining(a) >= 0 && getDaysRemaining(a) <= 3
  );
  const expiring7DAccounts = serviceAccounts.filter(
    (a) => getEffectiveAccountStatus(a) === 'Active' && getDaysRemaining(a) > 3 && getDaysRemaining(a) <= 7
  );
  const expiredAccounts = serviceAccounts.filter((a) => getEffectiveAccountStatus(a) === 'Expired');
  const hasOrderAlerts = expiring3DOrders.length > 0 || expiring7DOrders.length > 0 || expiredOrders.length > 0;
  const hasAccountAlerts = expiring3DAccounts.length > 0 || expiring7DAccounts.length > 0 || expiredAccounts.length > 0;
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser.role === 'ADMIN';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const rawTopTabs: { id: ERPView; label: string; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'orders', label: 'Revenue' },
    { id: 'customers', label: 'Customers' },
    { id: 'alerts', label: 'Retention' },
  ];

  const topTabs = isAdmin ? rawTopTabs : rawTopTabs.filter((t) => !t.adminOnly);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header
      id="subly-top-header"
      className="ml-0 md:ml-[80px] h-[72px] bg-[#F5F7FA] border-b border-[#E8EAF0] px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs"
    >
      {/* Brand & Center Navigation Pills */}
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-1.5 bg-white p-1 rounded-full border border-[#E8EAF0] shadow-2xs">
          {topTabs.map((tab) => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                id={`btn-header-tab-${tab.id}`}
                onClick={() => onSelectView(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#4A90FF] text-white shadow-xs font-bold'
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F5F7FA]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Controls Section */}
      <div className="flex items-center gap-4">
        {/* Quick Search Button */}
        <button
          id="btn-header-search"
          onClick={onOpenSearch}
          className="flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white border border-[#E8EAF0] text-[#6B7280] hover:text-[#111827] hover:border-slate-300 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span>Search orders, accounts...</span>
          <kbd className="hidden sm:inline-block bg-white text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            id="btn-header-notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full bg-[#F5F7FA] border border-[#E8EAF0] flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <span className="font-bold text-xs text-slate-900">System Alerts</span>
                <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                  {expiring3DOrders.length + expiring7DOrders.length + expiredOrders.length + expiring3DAccounts.length + expiring7DAccounts.length + expiredAccounts.length} Alert
                  {expiring3DOrders.length + expiring7DOrders.length + expiredOrders.length + expiring3DAccounts.length + expiring7DAccounts.length + expiredAccounts.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-3 text-xs max-h-80 overflow-y-auto pr-1">
                {/* Order Alerts */}
                {(hasOrderAlerts || hasAccountAlerts) && (
                  <>
                    {hasOrderAlerts && (
                      <div>
                        <p className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                          <ShoppingBag className="w-3 h-3" /> Orders
                        </p>
                        <div className="space-y-2">
                          {expiring3DOrders.length > 0 && (
                            <div
                              onClick={() => {
                                onOpenRenewalTab?.('3d', expiring3DOrders.map((o) => o.id));
                                setShowNotifications(false);
                              }}
                              className="p-2.5 rounded-xl bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200/60 cursor-pointer transition-colors flex items-start gap-2.5"
                            >
                              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                              <div>
                                <p className="font-bold text-amber-900">{expiring3DOrders.length} Order{expiring3DOrders.length > 1 ? 's' : ''} Expiring in 3 Days</p>
                                <p className="text-amber-700 text-[11px] mt-0.5">{expiring3DNames.join(', ')}</p>
                              </div>
                            </div>
                          )}
                          {expiring7DOrders.length > 0 && (
                            <div
                              onClick={() => {
                                onOpenRenewalTab?.('7d', expiring7DOrders.map((o) => o.id));
                                setShowNotifications(false);
                              }}
                              className="p-2.5 rounded-xl bg-yellow-50/80 hover:bg-yellow-100/80 border border-yellow-200/60 cursor-pointer transition-colors flex items-start gap-2.5"
                            >
                              <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1 shrink-0" />
                              <div>
                                <p className="font-bold text-yellow-900">{expiring7DOrders.length} Order{expiring7DOrders.length > 1 ? 's' : ''} Expiring in 7 Days</p>
                                <p className="text-yellow-700 text-[11px] mt-0.5">{expiring7DNames.join(', ')}</p>
                              </div>
                            </div>
                          )}
                          {expiredOrders.length > 0 && (
                            <div
                              onClick={() => {
                                onOpenRenewalTab?.('expired', expiredOrders.map((o) => o.id));
                                setShowNotifications(false);
                              }}
                              className="p-2.5 rounded-xl bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200/60 cursor-pointer transition-colors flex items-start gap-2.5"
                            >
                              <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                              <div>
                                <p className="font-bold text-rose-900">{expiredOrders.length} Expired Order{expiredOrders.length > 1 ? 's' : ''} Need{expiredOrders.length === 1 ? 's' : ''} Renewal</p>
                                <p className="text-rose-700 text-[11px] mt-0.5">{expiredNames.join(', ')}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {hasAccountAlerts && (
                      <div>
                        <p className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                          <Server className="w-3 h-3" /> Accounts
                        </p>
                        <div className="space-y-2">
                          {expiring3DAccounts.slice(0, 3).map((a) => (
                            <div
                              key={a.id}
                              onClick={() => {
                                onOpenAccounts?.(a.id);
                                setShowNotifications(false);
                              }}
                              title="Open this account"
                              className="p-2.5 rounded-xl bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200/60 cursor-pointer transition-colors flex items-start gap-2.5"
                            >
                              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-amber-900">Account Expiring in 3 Days</p>
                                <p className="text-amber-700 text-[11px] mt-0.5 truncate">{a.email}</p>
                              </div>
                            </div>
                          ))}
                          {expiring7DAccounts.slice(0, 3).map((a) => (
                            <div
                              key={a.id}
                              onClick={() => {
                                onOpenAccounts?.(a.id);
                                setShowNotifications(false);
                              }}
                              title="Open this account"
                              className="p-2.5 rounded-xl bg-yellow-50/80 hover:bg-yellow-100/80 border border-yellow-200/60 cursor-pointer transition-colors flex items-start gap-2.5"
                            >
                              <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-yellow-900">Account Expiring in 7 Days</p>
                                <p className="text-yellow-700 text-[11px] mt-0.5 truncate">{a.email}</p>
                              </div>
                            </div>
                          ))}
                          {expiredAccounts.slice(0, 3).map((a) => (
                            <div
                              key={a.id}
                              onClick={() => {
                                onOpenAccounts?.(a.id);
                                setShowNotifications(false);
                              }}
                              title="Open this account"
                              className="p-2.5 rounded-xl bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200/60 cursor-pointer transition-colors flex items-start gap-2.5"
                            >
                              <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-rose-900">Expired Account</p>
                                <p className="text-rose-700 text-[11px] mt-0.5 truncate">{a.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {!hasOrderAlerts && !hasAccountAlerts && (
                  <p className="text-xs text-slate-500 text-center py-2">No pending alerts</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Card & Switcher Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <div
            id="admin-profile-card"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full bg-[#F5F7FA] border border-[#E8EAF0] hover:bg-slate-100 transition-colors cursor-pointer select-none"
          >
            <div
              className={`w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center ring-2 ring-white shadow-2xs ${
                isAdmin ? 'bg-gradient-to-tr from-slate-800 to-slate-900' : 'bg-gradient-to-tr from-blue-600 to-blue-700'
              }`}
            >
              {getInitials(currentUser.fullName)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-[#111827]">{currentUser.fullName}</span>
                {isAdmin ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                )}
              </div>
              <p className="text-[10px] font-medium text-[#6B7280]">
                {isAdmin ? 'System Administrator' : 'Staff Member'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </div>

          {/* Profile Switcher Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2.5 bg-slate-50 rounded-xl mb-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">{currentUser.fullName}</span>
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isAdmin ? 'ADMIN' : currentUser.role}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    onOpenProfileSettings?.();
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <User className="w-4 h-4 text-blue-500" />
                  <span>Profile & Password Settings</span>
                </button>

                {isAdmin && onOpenSessionsModal && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenSessionsModal();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 text-blue-700 font-bold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Lock className="w-4 h-4 text-blue-600" />
                    <span>Active Sessions & Devices</span>
                  </button>
                )}

                {onLogout && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      id="btn-header-logout"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

