/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Sidebar, ERPView } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { CustomersView } from './components/customers/CustomersView';
import { PlansView } from './components/plans/PlansView';
import { OrdersView } from './components/orders/OrdersView';
import { AlertsView } from './components/alerts/AlertsView';
import { DatabaseView } from './components/database/DatabaseView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsView } from './components/settings/SettingsView';
import { DEFAULT_WHATSAPP_TEMPLATES } from './utils/whatsapp';

import { NewCustomerModal } from './components/modals/NewCustomerModal';
import { NewPlanModal } from './components/modals/NewPlanModal';
import { NewOrderModal } from './components/modals/NewOrderModal';
import { QuickSearchModal } from './components/modals/QuickSearchModal';
import { NewProfileModal } from './components/modals/NewProfileModal';
import { LoginView } from './components/auth/LoginView';
import { ActiveSessionsModal } from './components/auth/ActiveSessionsModal';

import { saveActiveSession, getActiveSession, validateSession, terminateActiveSession, setupMultiTabSessionSync, touchSessionActivity } from './utils/sessionManager';

// Replaced mock KPI defaults with an empty baseline so app relies on DB-driven data
const INITIAL_KPI_STATS: KPIStats = {
  totalOrders: 0,
  activeCustomers: 0,
  totalSales: 0,
  totalIncome: 0,
  expiring3DaysCount: 0,
  expiring7DaysCount: 0,
  expiredCount: 0,
  mrrGrowth: 0,
};
import { Customer, Plan, Order, AuditLog, KPIStats, UserProfile, UserSession, Language, WhatsAppTemplate } from './types/erp';
import { hashPasswordArgon2id, createSecureSessionToken } from './utils/security';
import {
  fetchCustomersFromSupabase,
  insertCustomerToSupabase,
  updateCustomerInSupabase,
  deleteCustomerFromSupabase,
  fetchPlansFromSupabase,
  insertPlanToSupabase,
  updatePlanInSupabase,
  deletePlanFromSupabase,
  fetchOrdersFromSupabase,
  insertOrderToSupabase,
  updateOrderInSupabase,
  deleteOrderFromSupabase,
  fetchAuditLogsFromSupabase,
  insertAuditLogToSupabase,
  fetchUserProfilesFromSupabase,
  insertUserProfileToSupabase,
  updateUserProfileInSupabase,
  deleteUserProfileFromSupabase,
  fetchWhatsAppTemplatesFromSupabase,
  saveWhatsAppTemplatesToSupabase,
} from './services/supabaseService';

const LAST_VIEW_KEY = 'recura_last_view_v1';
const VALID_VIEWS: ERPView[] = ['dashboard', 'customers', 'orders', 'plans', 'alerts', 'database', 'audit', 'settings'];
const CURRENCY_KEY = 'recura_currency_v1';

function loadLastView(): ERPView {
  try {
    const saved = localStorage.getItem(LAST_VIEW_KEY);
    return saved && (VALID_VIEWS as string[]).includes(saved) ? (saved as ERPView) : 'dashboard';
  } catch {
    return 'dashboard';
  }
}

function loadCurrency(): string {
  try {
    return localStorage.getItem(CURRENCY_KEY) || 'USD ($)';
  } catch {
    return 'USD ($)';
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState<ERPView>(loadLastView);

  // Persist current view so refresh returns to the same page
  useEffect(() => {
    try {
      localStorage.setItem(LAST_VIEW_KEY, currentView);
    } catch {
      /* ignore storage errors */
    }
  }, [currentView]);

  // User Profile & Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>(loadCurrency);

  // Persist currency so refresh keeps the selected currency instantly
  useEffect(() => {
    try {
      localStorage.setItem(CURRENCY_KEY, currency);
    } catch {
      /* ignore storage errors */
    }
  }, [currency]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: '',
    fullName: '',
    username: '',
    email: '',
    role: 'AGENT',
    createdAt: new Date().toISOString(),
    status: 'ACTIVE',
  });
  const [isNewProfileModalOpen, setIsNewProfileModalOpen] = useState(false);

  // State collections connected to Supabase
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [whatsAppTemplates, setWhatsAppTemplates] = useState<Record<Language, WhatsAppTemplate>>(DEFAULT_WHATSAPP_TEMPLATES);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial Load from Supabase (SELECT queries)
  useEffect(() => {
    async function loadDataFromSupabase() {
      setIsLoading(true);
      try {
        const [loadedProfiles, loadedCustomers, loadedPlans, loadedOrders, loadedLogs, loadedTemplates] = await Promise.all([
          fetchUserProfilesFromSupabase(),
          fetchCustomersFromSupabase(),
          fetchPlansFromSupabase(),
          fetchOrdersFromSupabase(),
          fetchAuditLogsFromSupabase(),
          fetchWhatsAppTemplatesFromSupabase(),
        ]);

        setProfiles(loadedProfiles);
        setCustomers(loadedCustomers);
        setPlans(loadedPlans);
        setOrders(loadedOrders);
        setAuditLogs(loadedLogs);
        if (loadedTemplates) {
          setWhatsAppTemplates(loadedTemplates);
        }
      } catch (error) {
        console.error('Failed fetching data from Supabase:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDataFromSupabase();
  }, []);


  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // On mount, immediately restore logged-in state from session (prevents login flash)
  // then sync to the correct profile once profiles load.
  const sessionRestoredRef = useRef(false);
  useEffect(() => {
    if (sessionRestoredRef.current) return;

    const sessionCheck = validateSession();
    if (!sessionCheck.isValid || !sessionCheck.session) {
      setIsLoggedIn(false);
      sessionRestoredRef.current = true;
      return;
    }

    // Immediately mark as logged in with a temp profile from session data
    const session = sessionCheck.session;
    setIsLoggedIn(true);
    sessionRestoredRef.current = true;

    // If profiles already loaded, use the real profile
    if (profiles.length > 0) {
      const matchedUser = profiles.find((p) => p.id === session.userId || p.email === session.userEmail);
      if (matchedUser) {
        setCurrentUser(matchedUser);
        return;
      }
    }

    // Otherwise set temp profile; will be updated when profiles load (see next effect)
    setCurrentUser({
      id: session.userId,
      fullName: session.userName || session.userEmail.split('@')[0],
      email: session.userEmail,
      role: 'AGENT',
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
    });
  }, []); // runs once on mount

  // Sync currentUser to the real profile once profiles arrive (after mount only)
  useEffect(() => {
    if (!sessionRestoredRef.current) return;
    if (profiles.length === 0) return;

    const sessionCheck = validateSession();
    if (!sessionCheck.isValid || !sessionCheck.session) return;

    const session = sessionCheck.session;
    const matchedUser = profiles.find((p) => p.id === session.userId || p.email === session.userEmail);
    if (matchedUser) {
      setCurrentUser(matchedUser);
      if (matchedUser.currency) {
        setCurrency(matchedUser.currency);
      }
      // If restored view is admin-only and user is not ADMIN, fall back to dashboard
      if (matchedUser.role !== 'ADMIN' && ['plans', 'database', 'audit'].includes(currentView)) {
        setCurrentView('dashboard');
      }
    }
  }, [profiles]);

  // Multi-Tab Session Synchronization & Periodic Expiration Check
  useEffect(() => {
    if (!isLoggedIn) return;

    // Listen for multi-tab sync events (e.g. logout in Tab 2 logs out Tab 1 instantly)
    const cleanupSync = setupMultiTabSessionSync((type) => {
      if (type === 'SESSION_TERMINATED') {
        setIsLoggedIn(false);
        setIsSessionsModalOpen(false);
        toast.info('Session terminated from another tab or device.');
      }
    });

    // Periodic interval checking session validity every 5s
    const checkInterval = setInterval(() => {
      touchSessionActivity();
      const validation = validateSession();
      if (!validation.isValid) {
        setIsLoggedIn(false);
        setIsSessionsModalOpen(false);
        toast.error('Session expired. Please sign in again.');
      }
    }, 5000);

    return () => {
      cleanupSync();
      clearInterval(checkInterval);
    };
  }, [isLoggedIn]);

  // RBAC view switch safety check
  const handleSelectView = (view: ERPView) => {
    const sessionCheck = validateSession();
    if (!sessionCheck.isValid) {
      setIsLoggedIn(false);
      toast.error('Session expired. Please log in.');
      return;
    }

    if (currentUser.role !== 'ADMIN' && (view === 'plans' || view === 'database' || view === 'audit')) {
      toast.error('Access Restricted: Low-level staff profiles cannot access this page.');
      setCurrentView('orders');
      return;
    }
    setCurrentView(view);
    setIsMobileSidebarOpen(false);
  };

  // Keyboard shortcut listener for Cmd + K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute live KPIs
  const expiring3DaysCount = orders.filter((o) => o.status === 'EXPIRING_3D').length;
  const expiring7DaysCount = orders.filter((o) => o.status === 'EXPIRING_7D').length;
  const expiredCount = orders.filter((o) => o.status === 'EXPIRED').length;

  const totalSales = orders.reduce((sum, o) => sum + o.price, 0);
  const totalIncome = totalSales;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthRevenue = orders
    .filter((o) => {
      const d = new Date(o.startDate);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, o) => sum + o.price, 0);

  const prevMonthRevenue = orders
    .filter((o) => {
      const d = new Date(o.startDate);
      return !isNaN(d.getTime()) && d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    })
    .reduce((sum, o) => sum + o.price, 0);

  const mrrGrowth = prevMonthRevenue > 0 ? Math.round(((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100) : 0;

  const currentKPIs: KPIStats = {
    ...INITIAL_KPI_STATS,
    totalOrders: orders.length,
    activeCustomers: customers.filter((c) => c.status === 'ACTIVE').length,
    expiring3DaysCount,
    expiring7DaysCount,
    expiredCount,
    totalSales,
    totalIncome,
    mrrGrowth,
  };

  // Audit Logger helper - attributes to current user or specified credentials
  const logAudit = async (
    action: AuditLog['action'],
    details: string,
    status: AuditLog['status'] = 'SUCCESS',
    userEmail?: string,
    userName?: string
  ) => {
    const newLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userEmail: userEmail || currentUser?.email || 'admin@recura.io',
      userName: userName || currentUser?.fullName || 'System User',
      action,
      details,
      ipAddress: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
      status,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    await insertAuditLogToSupabase(newLog);
  };

  // Authentication & Session Handlers
  const handleLogout = () => {
    terminateActiveSession('LOGOUT');
    logAudit('LOGOUT', `Logged out and expired session for ${currentUser.fullName} (${currentUser.email})`);
    setIsLoggedIn(false);
    setIsSessionsModalOpen(false);
    toast.info('Session ended. Logged out successfully.');
  };

  const handleLoginSuccess = (user: UserProfile, session?: UserSession) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    if (user.currency) {
      setCurrency(user.currency);
    }

    if (session) {
      saveActiveSession(session);
    }

    toast.success(`Welcome back, ${user.fullName}!`);
    if (user.role !== 'ADMIN' && (currentView === 'plans' || currentView === 'database' || currentView === 'audit')) {
      setCurrentView('orders');
    }
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency);
    if (!currentUser.id) return;

    const updated = { ...currentUser, currency: newCurrency };
    setCurrentUser(updated);
    setProfiles((prev) => prev.map((p) => (p.id === currentUser.id ? updated : p)));
    await updateUserProfileInSupabase(updated);
    logAudit('SETTINGS_CHANGE', `Changed system currency to ${newCurrency}`);
  };

  const handleSaveWhatsAppTemplates = async (templates: Record<Language, WhatsAppTemplate>) => {
    setWhatsAppTemplates(templates);
    await saveWhatsAppTemplatesToSupabase(templates);
    logAudit('SETTINGS_CHANGE', 'Updated WhatsApp notification templates');
  };

  // Profile Management Handlers
  const handleCreateProfile = async (profileData: Omit<UserProfile, 'id' | 'createdAt'>) => {
    const passwordHash = profileData.password ? await hashPasswordArgon2id(profileData.password) : undefined;
    const newProfile: UserProfile = {
      ...profileData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().split('T')[0],
      password: undefined,
      passwordHash,
    };

    setProfiles((prev) => [...prev, newProfile]);
    await insertUserProfileToSupabase(newProfile);
    toast.success(`Created profile: ${newProfile.fullName} (${newProfile.role === 'ADMIN' ? 'Admin' : 'Limited Staff'})`);
    logAudit('SETTINGS_CHANGE', `Created user profile: ${newProfile.fullName} (${newProfile.email}) - Access Level: ${newProfile.role}`);
  };

  const handleUpdateCurrentProfile = async (data: { fullName: string; username?: string; email: string; password?: string }) => {
    const passwordHash = data.password ? await hashPasswordArgon2id(data.password) : currentUser.passwordHash;
    const updated = { ...currentUser, ...data, password: undefined, passwordHash };
    setCurrentUser(updated);
    setProfiles((prev) => prev.map((p) => (p.id === currentUser.id ? updated : p)));
    await updateUserProfileInSupabase(updated);
    toast.success('Updated profile credentials!');
    logAudit('SETTINGS_CHANGE', `Updated profile credentials for ${data.fullName} (${data.email})`);
  };

  const handleSelectProfile = (profile: UserProfile) => {
    setCurrentUser(profile);
    if (profile.currency) {
      setCurrency(profile.currency);
    }
    const newSession = createSecureSessionToken(profile.id, profile.email, profile.fullName);
    saveActiveSession(newSession);
    toast.info(`Switched active profile to ${profile.fullName} (${profile.role === 'ADMIN' ? 'System Administrator' : 'Limited Staff'})`);
    logAudit('LOGIN', `Switched active profile session to ${profile.fullName} (${profile.email})`);
    if (profile.role !== 'ADMIN' && (currentView === 'plans' || currentView === 'database' || currentView === 'audit')) {
      setCurrentView('orders');
    }
  };

  const handleDeleteProfile = async (userId: string) => {
    const target = profiles.find((p) => p.id === userId);
    setProfiles((prev) => prev.filter((p) => p.id !== userId));
    await deleteUserProfileFromSupabase(userId);
    toast.info(`Deleted user profile ${target?.fullName || userId}`);
    logAudit('SETTINGS_CHANGE', `Deleted user profile ${target?.fullName || userId}`);
  };

  // Customer Handlers
  const handleSaveCustomer = async (
    customerData: Omit<Customer, 'id' | 'registrationDate' | 'ordersCount' | 'totalSpent'>
  ) => {
    if (editingCustomer) {
      const updated: Customer = { ...editingCustomer, ...customerData };
      setCustomers((prev) =>
        prev.map((c) => (c.id === editingCustomer.id ? updated : c))
      );
      await updateCustomerInSupabase(updated);
      toast.success(`Updated customer profile: ${customerData.name}`);
      logAudit('CUSTOMER_EDIT', `Updated customer profile for ${customerData.name}`);
      setEditingCustomer(null);
    } else {
      const newCust: Customer = {
        ...customerData,
        id: crypto.randomUUID(),
        registrationDate: new Date().toISOString().split('T')[0],
        ordersCount: 0,
        totalSpent: 0,
      };
      setCustomers((prev) => [newCust, ...prev]);
      await insertCustomerToSupabase(newCust);
      toast.success(`Created customer: ${customerData.name}`);
      logAudit('CUSTOMER_CREATE', `Created new customer profile for ${customerData.name}`);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    const cust = customers.find((c) => c.id === id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    await deleteCustomerFromSupabase(id);
    toast.info(`Deleted customer ${cust?.name || id}`);
  };

  const handleToggleBlockCustomer = async (id: string) => {
    const target = customers.find((c) => c.id === id);
    if (!target) return;
    const newStatus = target.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    const updated: Customer = { ...target, status: newStatus };

    setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
    await updateCustomerInSupabase(updated);
    toast.info(`${newStatus === 'BLOCKED' ? 'Blocked' : 'Unblocked'} customer ${target.name}`);
    logAudit('STATUS_CHANGE', `${newStatus === 'BLOCKED' ? 'Blocked' : 'Unblocked'} customer ${target.name}`);
  };

  // Plan Handlers
  const handleSavePlan = async (planData: Omit<Plan, 'id' | 'activeOrders'>) => {
    if (editingPlan) {
      const updated: Plan = { ...editingPlan, ...planData };
      setPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? updated : p)));
      await updatePlanInSupabase(updated);
      toast.success(`Updated plan: ${planData.name}`);
      setEditingPlan(null);
    } else {
      const newPlan: Plan = {
        ...planData,
        id: crypto.randomUUID(),
        activeOrders: 0,
      };
      setPlans((prev) => [newPlan, ...prev]);
      await insertPlanToSupabase(newPlan);
      toast.success(`Added new plan: ${planData.name}`);
      logAudit('PLAN_CREATE', `Created new streaming plan: ${planData.name}`);
    }
  };

  const handleDeletePlan = async (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    await deletePlanFromSupabase(id);
    toast.info('Deleted plan');
  };

  // Order Handlers
  const handleSaveOrder = async (orderData: Omit<Order, 'id'>) => {
    if (editingOrder) {
      const updated: Order = { ...orderData, id: editingOrder.id };
      setOrders((prev) =>
        prev.map((o) => (o.id === editingOrder.id ? updated : o))
      );
      await updateOrderInSupabase(updated);
      toast.success(`Updated order #${editingOrder.id}`);
      logAudit('ORDER_EDIT', `Updated order #${editingOrder.id} (${orderData.planName})`);
      setEditingOrder(null);
    } else {
      const nextOrderNumber = orders.reduce((max, o) => Math.max(max, o.orderNumber || 0), 0) + 1;
      const newOrd: Order = {
        ...orderData,
        id: crypto.randomUUID(),
        orderNumber: nextOrderNumber,
      };
      setOrders((prev) => [newOrd, ...prev]);
      await insertOrderToSupabase(newOrd);

      // Update customer stats in Supabase
      const customerToUpdate = customers.find((c) => c.id === orderData.customerId);
      if (customerToUpdate) {
        const updatedCust: Customer = {
          ...customerToUpdate,
          ordersCount: customerToUpdate.ordersCount + 1,
          totalSpent: customerToUpdate.totalSpent + orderData.price,
        };
        setCustomers((prev) => prev.map((c) => (c.id === updatedCust.id ? updatedCust : c)));
        await updateCustomerInSupabase(updatedCust);
      }

      // Update plan stock & active orders in Supabase
      const planToUpdate = plans.find((p) => p.id === orderData.planId);
      if (planToUpdate) {
        const updatedPlan: Plan = {
          ...planToUpdate,
          activeOrders: planToUpdate.activeOrders + 1,
          availableStock: Math.max(0, planToUpdate.availableStock - 1),
        };
        setPlans((prev) => prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)));
        await updatePlanInSupabase(updatedPlan);
      }

      toast.success(`Order provisioned for ${orderData.customerName}!`);
      logAudit('ORDER_CREATE', `Provisioned order #${newOrd.id} (${orderData.planName}) for ${orderData.customerName}`);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    await deleteOrderFromSupabase(id);
    toast.info('Order removed');
  };

  // Alert renewal status handler
  const handleMarkContacted = async (orderId: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const updated: Order = { ...targetOrder, contactedForRenewal: true, contactedAt: nowStr };
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    await updateOrderInSupabase(updated);

    toast.success('Marked as contacted via WhatsApp!');
    logAudit('WHATSAPP_SENT', `Sent renewal notice for order #${orderId}`);
  };

  const handleBulkMarkContacted = async (orderIds: string[]) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setOrders((prev) =>
      prev.map((o) =>
        orderIds.includes(o.id)
          ? { ...o, contactedForRenewal: true, contactedAt: nowStr }
          : o
      )
    );

    for (const orderId of orderIds) {
      const targetOrder = orders.find((o) => o.id === orderId);
      if (targetOrder) {
        await updateOrderInSupabase({ ...targetOrder, contactedForRenewal: true, contactedAt: nowStr });
      }
    }

    toast.success(`Marked ${orderIds.length} orders as contacted!`);
  };


  // Export JSON backup
  const handleExportAllData = () => {
    const backupObj = {
      exportedAt: new Date().toISOString(),
      version: 'Recura ERP v2.6',
      customers,
      plans,
      orders,
      auditLogs,
    };
    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recura_erp_backup_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exported complete ERP database backup!');
    logAudit('EXPORT_DATA', 'Exported complete system JSON data backup');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] text-[#111827] font-sans antialiased">
        <Toaster position="top-right" richColors />
        <LoginView
          profiles={profiles}
          onLoginSuccess={handleLoginSuccess}
          onAuditLog={logAudit}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111827] font-sans antialiased selection:bg-blue-200">
      <Toaster position="top-right" richColors />

      {/* Mobile Floating Sidebar Toggle (below top bar, top-left) */}
      <button
        id="btn-mobile-sidebar-toggle"
        onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
        className="md:hidden fixed top-[78px] left-3 z-[60] w-10 h-10 rounded-full bg-[#111111] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
        title="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Fixed Left 80px Vertical Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={handleSelectView}
        expiringBadgeCount={expiring3DaysCount + expiredCount}
        userRole={currentUser.role}
        onLogout={handleLogout}
        mobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Top Full-Width Navigation Header */}
      <Header
        currentView={currentView}
        onSelectView={handleSelectView}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        unreadNotificationsCount={expiring3DaysCount + expiredCount}
        currentUser={currentUser}
        profiles={profiles}
        orders={orders}
        onSelectProfile={handleSelectProfile}
        onLogout={handleLogout}
        onOpenSessionsModal={() => setIsSessionsModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="ml-0 md:ml-[80px]">
        {currentView === 'dashboard' && (
          <DashboardView
            kpis={currentKPIs}
            customers={customers}
            orders={orders}
            plans={plans}
            currency={currency}
            onOpenNewCustomer={() => {
              setEditingCustomer(null);
              setIsCustomerModalOpen(true);
            }}
            onOpenNewOrder={() => {
              setEditingOrder(null);
              setIsOrderModalOpen(true);
            }}
            onOpenNewPlan={() => {
              setEditingPlan(null);
              setIsPlanModalOpen(true);
            }}
            onNavigate={handleSelectView}
            userRole={currentUser.role}
          />
        )}

        {currentView === 'customers' && (
          <CustomersView
            customers={customers}
            orders={orders}
            currency={currency}
            onAddCustomer={() => {
              setEditingCustomer(null);
              setIsCustomerModalOpen(true);
            }}
            onEditCustomer={(cust) => {
              setEditingCustomer(cust);
              setIsCustomerModalOpen(true);
            }}
            onDeleteCustomer={handleDeleteCustomer}
            onToggleBlockCustomer={handleToggleBlockCustomer}
          />
        )}

        {currentView === 'plans' && (
          <PlansView
            plans={plans}
            currency={currency}
            onAddPlan={() => {
              setEditingPlan(null);
              setIsPlanModalOpen(true);
            }}
            onEditPlan={(plan) => {
              setEditingPlan(plan);
              setIsPlanModalOpen(true);
            }}
            onDeletePlan={handleDeletePlan}
          />
        )}

        {currentView === 'orders' && (
          <OrdersView
            orders={orders}
            currency={currency}
            onAddOrder={() => {
              setEditingOrder(null);
              setIsOrderModalOpen(true);
            }}
            onEditOrder={(order) => {
              setEditingOrder(order);
              setIsOrderModalOpen(true);
            }}
            onDeleteOrder={handleDeleteOrder}
          />
        )}

        {currentView === 'alerts' && (
          <AlertsView
            orders={orders}
            templates={whatsAppTemplates}
            onMarkContacted={handleMarkContacted}
            onBulkMarkContacted={handleBulkMarkContacted}
          />
        )}

        {currentView === 'database' && <DatabaseView />}

        {currentView === 'audit' && <AuditLogsView logs={auditLogs} />}

        {currentView === 'settings' && (
          <SettingsView
            currentUser={currentUser}
            profiles={profiles}
            currency={currency}
            onCurrencyChange={handleCurrencyChange}
            onExportAllData={handleExportAllData}
            onOpenNewProfileModal={() => setIsNewProfileModalOpen(true)}
            onUpdateCurrentProfile={handleUpdateCurrentProfile}
            onSelectProfile={handleSelectProfile}
            onDeleteProfile={handleDeleteProfile}
            onOpenSessionsModal={() => setIsSessionsModalOpen(true)}
            templates={whatsAppTemplates}
            onSaveWhatsAppTemplates={handleSaveWhatsAppTemplates}
          />
        )}
      </main>

      {/* ERP Interactive Modals */}
      <NewProfileModal
        isOpen={isNewProfileModalOpen}
        onClose={() => setIsNewProfileModalOpen(false)}
        onSubmit={handleCreateProfile}
        existingProfiles={profiles}
      />

      <NewCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleSaveCustomer}
        initialData={editingCustomer}
      />


      <NewPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => {
          setIsPlanModalOpen(false);
          setEditingPlan(null);
        }}
        currency={currency}
        onSubmit={handleSavePlan}
        initialData={editingPlan}
      />

      <NewOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setEditingOrder(null);
        }}
        customers={customers}
        plans={plans}
        currency={currency}
        onSubmit={handleSaveOrder}
        initialData={editingOrder}
      />

      <QuickSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        customers={customers}
        orders={orders}
        plans={plans}
        currency={currency}
        onSelectResult={(type) => {
          if (type === 'customer') setCurrentView('customers');
          else if (type === 'order') setCurrentView('orders');
          else if (type === 'plan') setCurrentView('plans');
        }}
      />

      <ActiveSessionsModal
        isOpen={isSessionsModalOpen}
        onClose={() => setIsSessionsModalOpen(false)}
        currentUserEmail={currentUser.email}
        currentUserId={currentUser.id}
        onSessionTerminated={handleLogout}
      />
    </div>
  );
}
