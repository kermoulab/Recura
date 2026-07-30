import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Customer, Plan, Order, AuditLog, UserProfile } from '../types/erp';


/* =======================================================
   1. CUSTOMERS CRUD
   ======================================================= */
export async function fetchCustomersFromSupabase(): Promise<Customer[]> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - returning empty customers array.');
    return [];
  }

  try {
    const { data, error } = await supabase.from('"Customer"').select('*');
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
        .from('"Customer"')
        .insert([formatted])
        .select()
        .single();
      if (!error && data) {
        return formatCustomerFromDb(data);
      }
    } catch (e) {
      console.warn('Supabase insert failed', e);
    }
  }

  return customer;
}

export async function updateCustomerInSupabase(customer: Customer): Promise<Customer> {
  const formatted = formatCustomerForDb(customer);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('"Customer"')
        .update(formatted)
        .eq('id', customer.id)
        .select()
        .single();
      if (!error && data) {
        return formatCustomerFromDb(data);
      }
    } catch (e) {
      console.warn('Supabase update failed', e);
    }
  }

  return customer;
}

export async function deleteCustomerFromSupabase(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('"Customer"').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete failed', e);
    }
  }
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
    const { data, error } = await supabase.from('"Plan"').select('*');
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
        .from('"Plan"')
        .insert([formatted])
        .select()
        .single();
      if (!error && data) {
        return formatPlanFromDb(data);
      }
    } catch (e) {
      console.warn('Supabase plan insert error', e);
    }
  }

  return plan;
}

export async function updatePlanInSupabase(plan: Plan): Promise<Plan> {
  const formatted = formatPlanForDb(plan);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('"Plan"')
        .update(formatted)
        .eq('id', plan.id)
        .select()
        .single();
      if (!error && data) {
        return formatPlanFromDb(data);
      }
    } catch (e) {
      console.warn('Supabase plan update error', e);
    }
  }

  return plan;
}

export async function deletePlanFromSupabase(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('"Plan"').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase plan delete error', e);
    }
  }
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
      .from('"Order"')
      .select('*')
      .order('startDate', { ascending: false });
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
        .from('"Order"')
        .insert([formatted])
        .select()
        .single();
      if (!error && data) {
        return formatOrderFromDb(data);
      }
    } catch (e) {
      console.warn('Supabase order insert error', e);
    }
  }

  return order;
}

export async function updateOrderInSupabase(order: Order): Promise<Order> {
  const formatted = formatOrderForDb(order);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('"Order"')
        .update(formatted)
        .eq('id', order.id)
        .select()
        .single();
      if (!error && data) {
        return formatOrderFromDb(data);
      }
    } catch (e) {
      console.warn('Supabase order update error', e);
    }
  }

  return order;
}

export async function deleteOrderFromSupabase(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('"Order"').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase order delete error', e);
    }
  }
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
      .from('"AuditLog"')
      .select('*')
      .order('createdAt', { ascending: false });
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
      await supabase.from('"AuditLog"').insert([formatted]);
    } catch (e) {
      console.warn('Supabase audit insert error', e);
    }
  }

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
    const { data, error } = await supabase.from('"User"').select('*');
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
        .from('"User"')
        .insert([formatted])
        .select()
        .single();
      if (!error && data) {
        return formatProfileFromDb(data);
      }
    } catch (e) {
      console.warn('Supabase profile insert error', e);
    }
  }

  return profile;
}

export async function updateUserProfileInSupabase(profile: UserProfile): Promise<UserProfile> {
  const formatted = formatProfileForDb(profile);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('"User"')
        .update(formatted)
        .eq('id', profile.id)
        .select()
        .single();
      if (!error && data) {
        return formatProfileFromDb(data);
      }
    } catch (e) {
      console.warn('Supabase profile update error', e);
    }
  }

  return profile;
}

export async function deleteUserProfileFromSupabase(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('"User"').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase profile delete error', e);
    }
  }
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
    preferredLanguage: c.preferredLanguage,
    createdAt: c.registrationDate || new Date().toISOString(),
    status: c.status,
    notes: c.notes || null,
  };
}

function formatCustomerFromDb(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    whatsapp: row.whatsapp,
    email: row.email || undefined,
    preferredLanguage: row.preferredLanguage || row.preferred_language || 'EN',
    registrationDate: row.createdAt || row.registrationDate || new Date().toISOString().split('T')[0],
    status: row.status || 'ACTIVE',
    ordersCount: Number(row.ordersCount ?? row.orders_count ?? 0),
    totalSpent: Number(row.totalSpent ?? row.total_spent ?? 0),
    notes: row.notes || undefined,
  };
}

function formatPlanForDb(p: Plan) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    durationMonths: p.durationMonths,
    notes: p.notes || null,
    availableStock: p.availableStock,
    totalAccounts: p.totalAccounts,
    activeOrders: p.activeOrders,
  };
}

function formatPlanFromDb(row: any): Plan {
  return {
    id: row.id,
    name: row.name,
    category: row.category || 'Other',
    price: Number(row.price || 0),
    durationMonths: row.durationMonths ?? row.duration_months ?? 1,
    notes: row.notes || undefined,
    availableStock: row.availableStock ?? row.available_stock ?? 0,
    totalAccounts: row.totalAccounts ?? row.total_accounts ?? 0,
    activeOrders: row.activeOrders ?? row.active_orders ?? 0,
  };
}

function formatOrderForDb(o: Order) {
  return {
    id: o.id,
    customerId: o.customerId,
    customerName: o.customerName,
    customerWhatsApp: o.customerWhatsApp,
    planId: o.planId,
    planName: o.planName,
    price: o.price,
    durationMonths: o.durationMonths,
    startDate: o.startDate,
    endDate: o.endDate,
    status: o.status,
    accountEmail: o.accountEmail,
    accountPasswordEncrypted: o.accountPasswordEncrypted,
    pinCodeEncrypted: o.pinCodeEncrypted || null,
    screenProfileName: o.screenProfileName || null,
    notes: o.notes || null,
    contactedForRenewal: o.contactedForRenewal || false,
    contactedAt: o.contactedAt || null,
  };
}

function formatOrderFromDb(row: any): Order {
  return {
    id: row.id,
    customerId: row.customerId || row.customer_id || '',
    customerName: row.customerName || row.customer_name || 'Customer',
    customerWhatsApp: row.customerWhatsApp || row.customer_whatsapp || '',
    planId: row.planId || row.plan_id || '',
    planName: row.planName || row.plan_name || 'Subscription',
    price: Number(row.price || 0),
    durationMonths: row.durationMonths ?? row.duration_months ?? 1,
    startDate: row.startDate || row.start_date || new Date().toISOString().split('T')[0],
    endDate: row.endDate || row.end_date || new Date().toISOString().split('T')[0],
    status: row.status || 'ACTIVE',
    accountEmail: row.accountEmail || row.account_email || '',
    accountPasswordEncrypted: row.accountPasswordEncrypted || row.account_password_encrypted || '',
    pinCodeEncrypted: row.pinCodeEncrypted || row.pin_code_encrypted || undefined,
    screenProfileName: row.screenProfileName || row.screen_profile_name || undefined,
    notes: row.notes || undefined,
    contactedForRenewal: Boolean(row.contactedForRenewal ?? row.contacted_for_renewal ?? false),
    contactedAt: row.contactedAt || row.contacted_at || undefined,
  };
}

function formatAuditLogForDb(a: AuditLog) {
  return {
    id: a.id,
    timestamp: a.timestamp,
    userEmail: a.userEmail,
    userName: a.userName,
    action: a.action,
    details: a.details,
    ipAddress: a.ipAddress,
    status: a.status,
  };
}

function formatAuditLogFromDb(row: any): AuditLog {
  return {
    id: row.id,
    timestamp: row.timestamp || new Date().toISOString(),
    userEmail: row.userEmail || row.user_email || 'system',
    userName: row.userName || row.user_name || 'System User',
    action: row.action || 'LOGIN',
    details: row.details || '',
    ipAddress: row.ipAddress || row.ip_address || '127.0.0.1',
    status: row.status || 'SUCCESS',
  };
}

function formatProfileForDb(p: UserProfile) {
  return {
    id: p.id,
    name: p.fullName,
    username: p.username || null,
    email: p.email,
    passwordHash: p.passwordHash || p.password || null,
    role: p.role,
    mfaEnabled: false,
    createdAt: p.createdAt || new Date().toISOString(),
  };
}

function formatProfileFromDb(row: any): UserProfile {
  return {
    id: row.id,
    fullName: row.name || row.fullName || 'User',
    username: row.username || undefined,
    email: row.email || '',
    passwordHash: row.passwordHash || row.password_hash || undefined,
    role: row.role || 'AGENT',
    createdAt: row.createdAt || row.created_at || new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    isBlocked: false,
    maxSessionsAllowed: 3,
    activeSessionsCount: 0,
  };
}

