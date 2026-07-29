import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Customer, Plan, Order, AuditLog, UserProfile } from '../types/erp';

// Fallback persistence keys for browser offline / initial seed
const STORAGE_KEYS = {
  CUSTOMERS: 'recura_supabase_customers',
  PLANS: 'recura_supabase_plans',
  ORDERS: 'recura_supabase_orders',
  AUDIT_LOGS: 'recura_supabase_audit_logs',
  PROFILES: 'recura_supabase_user_profiles',
};

// In-memory cache replacing browser local storage
const memoryStore: Record<string, any[]> = {};

const getLocalData = <T>(key: string, fallback: T[]): T[] => {
  if (!memoryStore[key]) {
    memoryStore[key] = [...fallback];
  }
  return memoryStore[key] as T[];
};

const setLocalData = <T>(key: string, data: T[]): void => {
  memoryStore[key] = [...data];
};

// Initial default seed data if database or local storage is brand new
const INITIAL_PROFILES_SEED: UserProfile[] = [
  {
    id: 'user_admin_1',
    fullName: 'James Noah',
    username: 'admin',
    email: 'admin@recura.io',
    password: 'password123',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$simulated_admin_hash_9921',
    role: 'ADMIN',
    createdAt: '2026-01-01',
    status: 'ACTIVE',
    isBlocked: false,
    maxSessionsAllowed: 5,
    activeSessionsCount: 1,
  },
  {
    id: 'user_staff_1',
    fullName: 'Sarah Connor',
    username: 'sarah',
    email: 'sarah@recura.io',
    password: 'password123',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$simulated_sarah_hash_3310',
    role: 'LIMITED',
    createdAt: '2026-02-15',
    status: 'ACTIVE',
    isBlocked: false,
    maxSessionsAllowed: 2,
    activeSessionsCount: 1,
  },
];

const INITIAL_CUSTOMERS_SEED: Customer[] = [
  {
    id: 'cust_101',
    name: 'Karim Mansouri',
    whatsapp: '+212661234567',
    email: 'karim.m@gmail.com',
    preferredLanguage: 'AR',
    registrationDate: '2026-01-15',
    status: 'ACTIVE',
    ordersCount: 4,
    totalSpent: 120,
    notes: 'VIP Client, prefers Netflix 4K and IPTV.',
  },
  {
    id: 'cust_102',
    name: 'Sophie Laurent',
    whatsapp: '+33612345678',
    email: 'sophie.laurent@outlook.fr',
    preferredLanguage: 'FR',
    registrationDate: '2026-02-01',
    status: 'ACTIVE',
    ordersCount: 2,
    totalSpent: 45,
    notes: 'French customer, Disney+ & Prime Video.',
  },
];

const INITIAL_PLANS_SEED: Plan[] = [
  {
    id: 'plan_1',
    name: 'Netflix 4K UHD - 1 Screen / 1 Profile',
    category: 'Netflix',
    price: 10.00,
    durationMonths: 1,
    notes: 'Private screen with custom PIN lock. Ultra HD 4K.',
    availableStock: 14,
    totalAccounts: 20,
    activeOrders: 6,
  },
  {
    id: 'plan_2',
    name: 'Disney+ Premium - 1 Screen',
    category: 'Disney+',
    price: 8.00,
    durationMonths: 1,
    notes: '4K HDR profile, all Marvel & Star Wars library.',
    availableStock: 8,
    totalAccounts: 15,
    activeOrders: 7,
  },
];

const INITIAL_ORDERS_SEED: Order[] = [
  {
    id: 'ord_1001',
    customerId: 'cust_101',
    customerName: 'Karim Mansouri',
    customerWhatsApp: '+212661234567',
    planId: 'plan_1',
    planName: 'Netflix 4K UHD - 1 Screen',
    price: 10.00,
    durationMonths: 1,
    startDate: '2026-07-25',
    endDate: '2026-08-25',
    status: 'ACTIVE',
    accountEmail: 'netflix.shared.01@recura.io',
    accountPasswordEncrypted: 'Kx9#mP2$vL',
    pinCodeEncrypted: '4921',
    screenProfileName: 'Karim - Profile 2',
    contactedForRenewal: false,
  },
];

const INITIAL_AUDIT_SEED: AuditLog[] = [
  {
    id: 'audit_1',
    timestamp: '2026-07-28 09:15:00',
    userEmail: 'admin@recura.io',
    userName: 'James Noah',
    action: 'LOGIN',
    details: 'System Administrator logged in successfully',
    ipAddress: '192.168.1.105',
    status: 'SUCCESS',
  },
];

/* =======================================================
   1. CUSTOMERS CRUD
   ======================================================= */
export async function fetchCustomersFromSupabase(): Promise<Customer[]> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - returning empty customers array.');
    return [];
  }

  try {
    const { data, error } = await supabase.from('customers').select('*');
    if (error || !data) {
      console.warn('Supabase customers fetch error or no data, returning empty array.', error);
      return [];
    }
    return data.map(formatCustomerFromDb);
  } catch (err) {
    console.warn('Supabase customers fetch failed:', err);
    return [];
  }
}

export async function insertCustomerToSupabase(customer: Customer): Promise<Customer> {
  const formatted = formatCustomerForDb(customer);
  
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([formatted])
        .select()
        .single();
      if (!error && data) {
        const result = formatCustomerFromDb(data);
        syncLocal(STORAGE_KEYS.CUSTOMERS, result, 'INSERT');
        return result;
      }
    } catch (e) {
      console.warn('Supabase insert failed, persisting locally', e);
    }
  }

  syncLocal(STORAGE_KEYS.CUSTOMERS, customer, 'INSERT');
  return customer;
}

export async function updateCustomerInSupabase(customer: Customer): Promise<Customer> {
  const formatted = formatCustomerForDb(customer);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(formatted)
        .eq('id', customer.id)
        .select()
        .single();
      if (!error && data) {
        const result = formatCustomerFromDb(data);
        syncLocal(STORAGE_KEYS.CUSTOMERS, result, 'UPDATE');
        return result;
      }
    } catch (e) {
      console.warn('Supabase update failed, persisting locally', e);
    }
  }

  syncLocal(STORAGE_KEYS.CUSTOMERS, customer, 'UPDATE');
  return customer;
}

export async function deleteCustomerFromSupabase(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('customers').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete failed', e);
    }
  }
  syncLocal(STORAGE_KEYS.CUSTOMERS, { id } as Customer, 'DELETE');
}

/* =======================================================
   2. PLANS CRUD
   ======================================================= */
export async function fetchPlansFromSupabase(): Promise<Plan[]> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - returning empty plans array.');
    return [];
  }

  try {
    const { data, error } = await supabase.from('plans').select('*');
    if (error || !data) {
      console.warn('Supabase plans fetch error or no data, returning empty array.', error);
      return [];
    }
    return data.map(formatPlanFromDb);
  } catch (err) {
    console.warn('Supabase plans fetch failed:', err);
    return [];
  }
}

export async function insertPlanToSupabase(plan: Plan): Promise<Plan> {
  const formatted = formatPlanForDb(plan);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('plans')
        .insert([formatted])
        .select()
        .single();
      if (!error && data) {
        const result = formatPlanFromDb(data);
        syncLocal(STORAGE_KEYS.PLANS, result, 'INSERT');
        return result;
      }
    } catch (e) {
      console.warn('Supabase plan insert error', e);
    }
  }

  syncLocal(STORAGE_KEYS.PLANS, plan, 'INSERT');
  return plan;
}

export async function updatePlanInSupabase(plan: Plan): Promise<Plan> {
  const formatted = formatPlanForDb(plan);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('plans')
        .update(formatted)
        .eq('id', plan.id)
        .select()
        .single();
      if (!error && data) {
        const result = formatPlanFromDb(data);
        syncLocal(STORAGE_KEYS.PLANS, result, 'UPDATE');
        return result;
      }
    } catch (e) {
      console.warn('Supabase plan update error', e);
    }
  }

  syncLocal(STORAGE_KEYS.PLANS, plan, 'UPDATE');
  return plan;
}

export async function deletePlanFromSupabase(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('plans').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase plan delete error', e);
    }
  }
  syncLocal(STORAGE_KEYS.PLANS, { id } as Plan, 'DELETE');
}

/* =======================================================
   3. ORDERS CRUD
   ======================================================= */
export async function fetchOrdersFromSupabase(): Promise<Order[]> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - returning empty orders array.');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('start_date', { ascending: false });
    if (error || !data) {
      console.warn('Supabase orders fetch error or no data, returning empty array.', error);
      return [];
    }
    return data.map(formatOrderFromDb);
  } catch (err) {
    console.warn('Supabase orders fetch failed:', err);
    return [];
  }
}

export async function insertOrderToSupabase(order: Order): Promise<Order> {
  const formatted = formatOrderForDb(order);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([formatted])
        .select()
        .single();
      if (!error && data) {
        const result = formatOrderFromDb(data);
        syncLocal(STORAGE_KEYS.ORDERS, result, 'INSERT');
        return result;
      }
    } catch (e) {
      console.warn('Supabase order insert error', e);
    }
  }

  syncLocal(STORAGE_KEYS.ORDERS, order, 'INSERT');
  return order;
}

export async function updateOrderInSupabase(order: Order): Promise<Order> {
  const formatted = formatOrderForDb(order);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update(formatted)
        .eq('id', order.id)
        .select()
        .single();
      if (!error && data) {
        const result = formatOrderFromDb(data);
        syncLocal(STORAGE_KEYS.ORDERS, result, 'UPDATE');
        return result;
      }
    } catch (e) {
      console.warn('Supabase order update error', e);
    }
  }

  syncLocal(STORAGE_KEYS.ORDERS, order, 'UPDATE');
  return order;
}

export async function deleteOrderFromSupabase(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('orders').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase order delete error', e);
    }
  }
  syncLocal(STORAGE_KEYS.ORDERS, { id } as Order, 'DELETE');
}

/* =======================================================
   4. AUDIT LOGS CRUD
   ======================================================= */
export async function fetchAuditLogsFromSupabase(): Promise<AuditLog[]> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - returning empty audit log array.');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error || !data) {
      console.warn('Supabase audit logs fetch error or no data, returning empty array.', error);
      return [];
    }
    return data.map(formatAuditLogFromDb);
  } catch (err) {
    console.warn('Supabase audit logs fetch failed:', err);
    return [];
  }
}

export async function insertAuditLogToSupabase(log: AuditLog): Promise<AuditLog> {
  const formatted = formatAuditLogForDb(log);

  if (isSupabaseConfigured) {
    try {
      await supabase.from('audit_logs').insert([formatted]);
    } catch (e) {
      console.warn('Supabase audit insert error', e);
    }
  }

  syncLocal(STORAGE_KEYS.AUDIT_LOGS, log, 'INSERT');
  return log;
}

/* =======================================================
   5. USER PROFILES CRUD
   ======================================================= */
export async function fetchUserProfilesFromSupabase(): Promise<UserProfile[]> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - returning empty user profiles array.');
    return [];
  }

  try {
    const { data, error } = await supabase.from('user_profiles').select('*');
    if (error || !data) {
      console.warn('Supabase user profiles fetch error or no data, returning empty array.', error);
      return [];
    }
    return data.map(formatProfileFromDb);
  } catch (err) {
    console.warn('Supabase user profiles fetch failed:', err);
    return [];
  }
}

export async function insertUserProfileToSupabase(profile: UserProfile): Promise<UserProfile> {
  const formatted = formatProfileForDb(profile);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([formatted])
        .select()
        .single();
      if (!error && data) {
        const result = formatProfileFromDb(data);
        syncLocal(STORAGE_KEYS.PROFILES, result, 'INSERT');
        return result;
      }
    } catch (e) {
      console.warn('Supabase profile insert error', e);
    }
  }

  syncLocal(STORAGE_KEYS.PROFILES, profile, 'INSERT');
  return profile;
}

export async function updateUserProfileInSupabase(profile: UserProfile): Promise<UserProfile> {
  const formatted = formatProfileForDb(profile);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(formatted)
        .eq('id', profile.id)
        .select()
        .single();
      if (!error && data) {
        const result = formatProfileFromDb(data);
        syncLocal(STORAGE_KEYS.PROFILES, result, 'UPDATE');
        return result;
      }
    } catch (e) {
      console.warn('Supabase profile update error', e);
    }
  }

  syncLocal(STORAGE_KEYS.PROFILES, profile, 'UPDATE');
  return profile;
}

export async function deleteUserProfileFromSupabase(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('user_profiles').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase profile delete error', e);
    }
  }
  syncLocal(STORAGE_KEYS.PROFILES, { id } as UserProfile, 'DELETE');
}

/* =======================================================
   DATA MAPPING UTILITIES (snake_case <-> camelCase)
   ======================================================= */
function formatCustomerForDb(c: Customer) {
  return {
    id: c.id,
    name: c.name,
    whatsapp: c.whatsapp,
    email: c.email || null,
    preferred_language: c.preferredLanguage,
    registration_date: c.registrationDate,
    status: c.status,
    orders_count: c.ordersCount,
    total_spent: c.totalSpent,
    notes: c.notes || null,
  };
}

function formatCustomerFromDb(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    whatsapp: row.whatsapp,
    email: row.email || undefined,
    preferredLanguage: row.preferred_language || row.preferredLanguage || 'EN',
    registrationDate: row.registration_date || row.registrationDate || new Date().toISOString().split('T')[0],
    status: row.status || 'ACTIVE',
    ordersCount: row.orders_count ?? row.ordersCount ?? 0,
    totalSpent: Number(row.total_spent ?? row.totalSpent ?? 0),
    notes: row.notes || undefined,
  };
}

function formatPlanForDb(p: Plan) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    duration_months: p.durationMonths,
    notes: p.notes || null,
    available_stock: p.availableStock,
    total_accounts: p.totalAccounts,
    active_orders: p.activeOrders,
  };
}

function formatPlanFromDb(row: any): Plan {
  return {
    id: row.id,
    name: row.name,
    category: row.category || 'Other',
    price: Number(row.price || 0),
    durationMonths: row.duration_months ?? row.durationMonths ?? 1,
    notes: row.notes || undefined,
    availableStock: row.available_stock ?? row.availableStock ?? 0,
    totalAccounts: row.total_accounts ?? row.totalAccounts ?? 0,
    activeOrders: row.active_orders ?? row.activeOrders ?? 0,
  };
}

function formatOrderForDb(o: Order) {
  return {
    id: o.id,
    customer_id: o.customerId,
    customer_name: o.customerName,
    customer_whatsapp: o.customerWhatsApp,
    plan_id: o.planId,
    plan_name: o.planName,
    price: o.price,
    duration_months: o.durationMonths,
    start_date: o.startDate,
    end_date: o.endDate,
    status: o.status,
    account_email: o.accountEmail,
    account_password_encrypted: o.accountPasswordEncrypted,
    pin_code_encrypted: o.pinCodeEncrypted || null,
    screen_profile_name: o.screenProfileName || null,
    notes: o.notes || null,
    contacted_for_renewal: o.contactedForRenewal || false,
    contacted_at: o.contactedAt || null,
  };
}

function formatOrderFromDb(row: any): Order {
  return {
    id: row.id,
    customerId: row.customer_id || row.customerId || '',
    customerName: row.customer_name || row.customerName || 'Customer',
    customerWhatsApp: row.customer_whatsapp || row.customerWhatsApp || '',
    planId: row.plan_id || row.planId || '',
    planName: row.plan_name || row.planName || 'Subscription',
    price: Number(row.price || 0),
    durationMonths: row.duration_months ?? row.durationMonths ?? 1,
    startDate: row.start_date || row.startDate || new Date().toISOString().split('T')[0],
    endDate: row.end_date || row.endDate || new Date().toISOString().split('T')[0],
    status: row.status || 'ACTIVE',
    accountEmail: row.account_email || row.accountEmail || '',
    accountPasswordEncrypted: row.account_password_encrypted || row.accountPasswordEncrypted || '',
    pinCodeEncrypted: row.pin_code_encrypted || row.pinCodeEncrypted || undefined,
    screenProfileName: row.screen_profile_name || row.screenProfileName || undefined,
    notes: row.notes || undefined,
    contactedForRenewal: Boolean(row.contacted_for_renewal ?? row.contactedForRenewal ?? false),
    contactedAt: row.contacted_at || row.contactedAt || undefined,
  };
}

function formatAuditLogForDb(a: AuditLog) {
  return {
    id: a.id,
    timestamp: a.timestamp,
    user_email: a.userEmail,
    user_name: a.userName,
    action: a.action,
    details: a.details,
    ip_address: a.ipAddress,
    status: a.status,
  };
}

function formatAuditLogFromDb(row: any): AuditLog {
  return {
    id: row.id,
    timestamp: row.timestamp || new Date().toISOString(),
    userEmail: row.user_email || row.userEmail || 'system',
    userName: row.user_name || row.userName || 'System User',
    action: row.action || 'LOGIN',
    details: row.details || '',
    ipAddress: row.ip_address || row.ipAddress || '127.0.0.1',
    status: row.status || 'SUCCESS',
  };
}

function formatProfileForDb(p: UserProfile) {
  return {
    id: p.id,
    full_name: p.fullName,
    username: p.username || null,
    email: p.email,
    password: p.password || null,
    password_hash: p.passwordHash || null,
    role: p.role,
    created_at: p.createdAt,
    status: p.status || 'ACTIVE',
    is_blocked: p.isBlocked || false,
    max_sessions_allowed: p.maxSessionsAllowed || 3,
    active_sessions_count: p.activeSessionsCount || 0,
  };
}

function formatProfileFromDb(row: any): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name || row.fullName || 'User',
    username: row.username || undefined,
    email: row.email || '',
    password: row.password || undefined,
    passwordHash: row.password_hash || row.passwordHash || undefined,
    role: row.role || 'LIMITED',
    createdAt: row.created_at || row.createdAt || new Date().toISOString().split('T')[0],
    status: row.status || 'ACTIVE',
    isBlocked: Boolean(row.is_blocked ?? row.isBlocked ?? false),
    maxSessionsAllowed: row.max_sessions_allowed ?? row.maxSessionsAllowed ?? 3,
    activeSessionsCount: row.active_sessions_count ?? row.activeSessionsCount ?? 0,
  };
}

function syncLocal<T extends { id: string }>(key: string, item: T, op: 'INSERT' | 'UPDATE' | 'DELETE') {
  const current = getLocalData<T>(key, []);
  let updated: T[] = [];

  if (op === 'INSERT') {
    updated = [item, ...current.filter((i) => i.id !== item.id)];
  } else if (op === 'UPDATE') {
    updated = current.map((i) => (i.id === item.id ? { ...i, ...item } : i));
  } else if (op === 'DELETE') {
    updated = current.filter((i) => i.id !== item.id);
  }

  setLocalData(key, updated);
}
