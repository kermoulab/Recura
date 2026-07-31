import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Customer, Plan, Order, AuditLog, UserProfile, Language, WhatsAppTemplate } from '../types/erp';

function getSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }
  return supabase;
}

/* =======================================================
   1. CUSTOMERS CRUD
   ======================================================= */
export async function fetchCustomersFromSupabase(): Promise<Customer[]> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('Supabase not configured - returning empty customers array.');
    return [];
  }

  try {
    const { data, error } = await client.from('Customer').select('*');
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
  const client = getSupabaseClient();

  if (!client) {
    return customer;
  }

  try {
    const { data, error } = await client
      .from('Customer')
      .insert([formatted])
      .select()
      .single();
    if (!error && data) {
      return formatCustomerFromDb(data);
    }
  } catch (e) {
    console.warn('Supabase insert failed', e);
  }

  return customer;
}

export async function updateCustomerInSupabase(customer: Customer): Promise<Customer> {
  const formatted = formatCustomerForDb(customer);
  const client = getSupabaseClient();

  if (!client) {
    return customer;
  }

  try {
    const { data, error } = await client
      .from('Customer')
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

  return customer;
}

export async function deleteCustomerFromSupabase(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  try {
    await client.from('Customer').delete().eq('id', id);
  } catch (e) {
    console.warn('Supabase delete failed', e);
  }
}

/* =======================================================
   2. PLANS CRUD
   ======================================================= */
export async function fetchPlansFromSupabase(): Promise<Plan[]> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('Supabase not configured - returning empty plans array.');
    return [];
  }

  try {
    const { data, error } = await client.from('Plan').select('*');
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
  const client = getSupabaseClient();

  if (!client) {
    return plan;
  }

  try {
    const { data, error } = await client
      .from('Plan')
      .insert([formatted])
      .select()
      .single();
    if (!error && data) {
      return formatPlanFromDb(data);
    }
  } catch (e) {
    console.warn('Supabase plan insert error', e);
  }

  return plan;
}

export async function updatePlanInSupabase(plan: Plan): Promise<Plan> {
  const formatted = formatPlanForDb(plan);
  const client = getSupabaseClient();

  if (!client) {
    return plan;
  }

  try {
    const { data, error } = await client
      .from('Plan')
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

  return plan;
}

export async function deletePlanFromSupabase(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  try {
    await client.from('Plan').delete().eq('id', id);
  } catch (e) {
    console.warn('Supabase plan delete error', e);
  }
}

/* =======================================================
   3. ORDERS CRUD
   ======================================================= */
export async function fetchOrdersFromSupabase(): Promise<Order[]> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('Supabase not configured - returning empty orders array.');
    return [];
  }

  try {
    const { data, error } = await client
      .from('Order')
      .select('*')
      .order('createdAt', { ascending: false });
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
  const client = getSupabaseClient();

  if (!client) {
    return order;
  }

  try {
    const { data, error } = await client
      .from('Order')
      .insert([formatted])
      .select()
      .single();
    if (!error && data) {
      return formatOrderFromDb(data);
    }
  } catch (e) {
    console.warn('Supabase order insert error', e);
  }

  return order;
}

export async function updateOrderInSupabase(order: Order): Promise<Order> {
  const formatted = formatOrderForDb(order);
  const client = getSupabaseClient();

  if (!client) {
    return order;
  }

  try {
    const { data, error } = await client
      .from('Order')
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

  return order;
}

export async function deleteOrderFromSupabase(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  try {
    await client.from('Order').delete().eq('id', id);
  } catch (e) {
    console.warn('Supabase order delete error', e);
  }
}

/* =======================================================
   4. AUDIT LOGS CRUD
   ======================================================= */
export async function fetchAuditLogsFromSupabase(): Promise<AuditLog[]> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('Supabase not configured - returning empty audit log array.');
    return [];
  }

  try {
    const { data, error } = await client
      .from('AuditLog')
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
  const client = getSupabaseClient();

  if (!client) {
    return log;
  }

  try {
    await client.from('AuditLog').insert([formatted]);
  } catch (e) {
    console.warn('Supabase audit insert error', e);
  }

  return log;
}

/* =======================================================
   5. USER PROFILES CRUD
   ======================================================= */
export async function fetchUserProfilesFromSupabase(): Promise<UserProfile[]> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('Supabase not configured - returning empty user profiles array.');
    return [];
  }

  try {
    const { data, error } = await client.from('User').select('*');
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
  const client = getSupabaseClient();

  if (!client) {
    return profile;
  }

  try {
    const { data, error } = await client
      .from('User')
      .insert([formatted])
      .select()
      .single();
    if (!error && data) {
      return formatProfileFromDb(data);
    }
  } catch (e) {
    console.warn('Supabase profile insert error', e);
  }

  return profile;
}

export async function updateUserProfileInSupabase(profile: UserProfile): Promise<UserProfile> {
  const formatted = formatProfileForDb(profile);
  const client = getSupabaseClient();

  if (!client) {
    return profile;
  }

  try {
    const { data, error } = await client
      .from('User')
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

  return profile;
}

export async function deleteUserProfileFromSupabase(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  try {
    await client.from('User').delete().eq('id', id);
  } catch (e) {
    console.warn('Supabase profile delete error', e);
  }
}

/* =======================================================
   6. WHATSAPP TEMPLATES (global, one row per language)
   ======================================================= */
export async function fetchWhatsAppTemplatesFromSupabase(): Promise<Record<Language, WhatsAppTemplate> | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client.from('WhatsAppTemplate').select('*');
    if (error || !data || data.length === 0) {
      return null;
    }
    const templates = {} as Record<Language, WhatsAppTemplate>;
    for (const row of data) {
      const lang = row.language as Language;
      if (!lang) continue;
      templates[lang] = {
        language: lang,
        expiring3Days: row.expiring3Days || row.expiring_3_days || '',
        expired: row.expired || '',
      };
    }
    return Object.keys(templates).length > 0 ? templates : null;
  } catch (err) {
    console.warn('Supabase WhatsApp templates fetch failed:', err);
    return null;
  }
}

export async function saveWhatsAppTemplatesToSupabase(templates: Record<Language, WhatsAppTemplate>): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  try {
    const rows = (Object.keys(templates) as Language[]).map((lang) => ({
      language: lang,
      expiring3Days: templates[lang].expiring3Days,
      expired: templates[lang].expired,
      updatedAt: new Date().toISOString(),
    }));

    await client.from('WhatsAppTemplate').upsert(rows, { onConflict: 'language' });
  } catch (e) {
    console.warn('Supabase WhatsApp templates save error', e);
  }
}

/* =======================================================
   DATA MAPPING UTILITIES (camelCase <-> PostgreSQL columns)
   ======================================================= */
function formatCustomerForDb(c: Customer) {
  return {
    id: c.id,
    name: c.name,
    whatsapp: c.whatsapp,
    email: c.email || null,
    preferredLanguage: c.preferredLanguage,
    status: c.status,
    notes: c.notes || null,
    isDeleted: false,
    createdAt: c.registrationDate || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    orderNumber: o.orderNumber || null,
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
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function formatOrderFromDb(row: any): Order {
  return {
    id: row.id,
    orderNumber: Number(row.orderNumber || 0) || undefined,
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
    createdAt: a.timestamp,
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
    passwordHash: p.passwordHash || null,
    role: p.role,
    mfaEnabled: false,
    currency: p.currency || null,
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    currency: row.currency || undefined,
  };
}
