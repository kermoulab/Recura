import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Customer, Plan, Order, AuditLog, UserProfile, Language, WhatsAppTemplate, ServiceAccount } from '../types/erp';

function getSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('Supabase not configured.');
    return null;
  }
  return supabase;
}

/**
 * Returns the Supabase client or THROWS if it is not configured.
 * Mutations use this so a missing .env / failed write surfaces to the caller
 * instead of silently succeeding in memory and losing data on refresh.
 */
function requireSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Database not connected. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, restart the app, then try again.');
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
  const client = requireSupabaseClient();
  const formatted = formatCustomerForDb(customer);

  const { data, error } = await client
    .from('Customer')
    .insert([formatted])
    .select()
    .single();
  if (error || !data) {
    throw new Error(`Failed to save customer to database: ${error?.message || 'no row returned'}`);
  }
  return formatCustomerFromDb(data);
}

export async function updateCustomerInSupabase(customer: Customer): Promise<Customer> {
  const client = requireSupabaseClient();
  const formatted = formatCustomerForDb(customer);

  const { data, error } = await client
    .from('Customer')
    .update(formatted)
    .eq('id', customer.id)
    .select()
    .single();
  if (error || !data) {
    throw new Error(`Failed to update customer in database: ${error?.message || 'no row returned'}`);
  }
  return formatCustomerFromDb(data);
}

export async function deleteCustomerFromSupabase(id: string): Promise<void> {
  const client = requireSupabaseClient();

  const { error } = await client.from('Customer').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete customer from database: ${error.message}`);
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
  const client = requireSupabaseClient();
  const formatted = formatPlanForDb(plan);

  const { data, error } = await client
    .from('Plan')
    .insert([formatted])
    .select()
    .single();
  if (error || !data) {
    throw new Error(`Failed to save plan to database: ${error?.message || 'no row returned'}`);
  }
  return formatPlanFromDb(data);
}

export async function updatePlanInSupabase(plan: Plan): Promise<Plan> {
  const client = requireSupabaseClient();
  const formatted = formatPlanForDb(plan);

  const { data, error } = await client
    .from('Plan')
    .update(formatted)
    .eq('id', plan.id)
    .select()
    .single();
  if (error || !data) {
    throw new Error(`Failed to update plan in database: ${error?.message || 'no row returned'}`);
  }
  return formatPlanFromDb(data);
}

export async function deletePlanFromSupabase(id: string): Promise<void> {
  const client = requireSupabaseClient();

  const { error } = await client.from('Plan').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete plan from database: ${error.message}`);
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
  const client = requireSupabaseClient();
  const formatted = formatOrderForDb(order);

  const { data, error } = await client
    .from('Order')
    .insert([formatted])
    .select()
    .single();
  if (error || !data) {
    throw new Error(`Failed to save order to database: ${error?.message || 'no row returned'}`);
  }
  return formatOrderFromDb(data);
}

export async function updateOrderInSupabase(order: Order): Promise<Order> {
  const client = requireSupabaseClient();
  const formatted = formatOrderForDb(order);

  const { data, error } = await client
    .from('Order')
    .update(formatted)
    .eq('id', order.id)
    .select()
    .single();
  if (error || !data) {
    throw new Error(`Failed to update order in database: ${error?.message || 'no row returned'}`);
  }
  return formatOrderFromDb(data);
}

export async function deleteOrderFromSupabase(id: string): Promise<void> {
  const client = requireSupabaseClient();

  const { error } = await client.from('Order').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete order from database: ${error.message}`);
  }
}

/* =======================================================
   4. SERVICE ACCOUNTS CRUD (shared provider accounts)
   ======================================================= */
export async function fetchServiceAccountsFromSupabase(): Promise<ServiceAccount[]> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('Supabase not configured - returning empty service accounts array.');
    return [];
  }

  try {
    const { data, error } = await client
      .from('service_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) {
      console.warn('Supabase service accounts fetch error or no data, returning empty array.', error);
      return [];
    }
    return data.map(formatServiceAccountFromDb);
  } catch (err) {
    console.warn('Supabase service accounts fetch failed:', err);
    return [];
  }
}

export async function insertServiceAccountToSupabase(account: ServiceAccount): Promise<ServiceAccount> {
  const client = requireSupabaseClient();
  const formatted = formatServiceAccountForDb(account);

  const { data, error } = await client
    .from('service_accounts')
    .insert([formatted])
    .select()
    .single();
  if (error || !data) {
    throw new Error(`Failed to save service account to database: ${error?.message || 'no row returned'}`);
  }
  return formatServiceAccountFromDb(data);
}

export async function updateServiceAccountInSupabase(account: ServiceAccount): Promise<ServiceAccount> {
  const client = requireSupabaseClient();
  const formatted = formatServiceAccountForDb(account);

  const { data, error } = await client
    .from('service_accounts')
    .update(formatted)
    .eq('id', account.id)
    .select()
    .single();
  if (error || !data) {
    throw new Error(`Failed to update service account in database: ${error?.message || 'no row returned'}`);
  }
  return formatServiceAccountFromDb(data);
}

export async function deleteServiceAccountFromSupabase(id: string): Promise<void> {
  const client = requireSupabaseClient();

  const { error } = await client.from('service_accounts').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete service account from database: ${error.message}`);
  }
}

/* =======================================================
   5. AUDIT LOGS CRUD
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
  const client = requireSupabaseClient();
  const formatted = formatAuditLogForDb(log);

  const { error } = await client.from('AuditLog').insert([formatted]);
  if (error) {
    throw new Error(`Failed to save audit log to database: ${error.message}`);
  }
  return log;
}

/* =======================================================
   6. USER PROFILES CRUD
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
  const client = requireSupabaseClient();
  const formatted = formatProfileForDb(profile);

  const { data, error } = await client
    .from('User')
    .insert([formatted])
    .select()
    .single();
  if (error || !data) {
    throw new Error(`Failed to save user profile to database: ${error?.message || 'no row returned'}`);
  }
  return formatProfileFromDb(data);
}

export async function updateUserProfileInSupabase(profile: UserProfile): Promise<UserProfile> {
  const client = requireSupabaseClient();
  const formatted = formatProfileForDb(profile);

  const { data, error } = await client
    .from('User')
    .update(formatted)
    .eq('id', profile.id)
    .select()
    .single();
  if (error || !data) {
    throw new Error(`Failed to update user profile in database: ${error?.message || 'no row returned'}`);
  }
  return formatProfileFromDb(data);
}

export async function deleteUserProfileFromSupabase(id: string): Promise<void> {
  const client = requireSupabaseClient();

  const { error } = await client.from('User').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete user profile from database: ${error.message}`);
  }
}

/* =======================================================
   7. WHATSAPP TEMPLATES (global, one row per language)
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
  const client = requireSupabaseClient();

  const rows = (Object.keys(templates) as Language[]).map((lang) => ({
    language: lang,
    expiring3Days: templates[lang].expiring3Days,
    expired: templates[lang].expired,
    updatedAt: new Date().toISOString(),
  }));

  const { error } = await client.from('WhatsAppTemplate').upsert(rows, { onConflict: 'language' });
  if (error) {
    throw new Error(`Failed to save WhatsApp templates to database: ${error.message}`);
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
    service_account_id: o.serviceAccountId || null,
    profile_number: o.profileNumber || null,
    isDeleted: false,
    createdAt: o.createdAt || new Date().toISOString(),
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
    startDate: toDateOnly(row.startDate || row.start_date),
    endDate: toDateOnly(row.endDate || row.end_date),
    status: row.status || 'ACTIVE',
    accountEmail: row.accountEmail || row.account_email || '',
    accountPasswordEncrypted: row.accountPasswordEncrypted || row.account_password_encrypted || '',
    pinCodeEncrypted: row.pinCodeEncrypted || row.pin_code_encrypted || undefined,
    screenProfileName: row.screenProfileName || row.screen_profile_name || undefined,
    notes: row.notes || undefined,
    contactedForRenewal: Boolean(row.contactedForRenewal ?? row.contacted_for_renewal ?? false),
    contactedAt: row.contactedAt || row.contacted_at || undefined,
    serviceAccountId: row.serviceAccountId || row.service_account_id || undefined,
    profileNumber: row.profileNumber || row.profile_number || undefined,
    createdAt: row.createdAt || row.created_at || undefined,
  };
}

function formatServiceAccountForDb(a: ServiceAccount) {
  return {
    id: a.id,
    service_type: a.serviceType,
    provider_id: a.providerId || null,
    email: a.email,
    password: a.passwordEncrypted || null,
    subscription_start: a.subscriptionStart || null,
    subscription_end: a.subscriptionEnd || null,
    purchase_cost: a.purchaseCost || 0,
    capacity: a.capacity,
    status: a.status,
    notes: a.notes || null,
    created_at: a.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function formatServiceAccountFromDb(row: any): ServiceAccount {
  return {
    id: row.id,
    serviceType: row.serviceType || row.service_type || 'Other',
    providerId: row.providerId || row.provider_id || undefined,
    email: row.email || '',
    passwordEncrypted: row.password || undefined,
    subscriptionStart: toDateOnly(row.subscriptionStart || row.subscription_start),
    subscriptionEnd: toDateOnly(row.subscriptionEnd || row.subscription_end),
    purchaseCost: Number(row.purchaseCost ?? row.purchase_cost ?? 0),
    capacity: row.capacity || 1,
    status: row.status || 'Active',
    notes: row.notes || undefined,
    createdAt: row.createdAt || row.created_at || new Date().toISOString(),
    updatedAt: row.updatedAt || row.updated_at || undefined,
  };
}

/**
 * Normalizes a DB timestamp/date value to YYYY-MM-DD so it can be used in
 * <input type="date"> and date comparisons. Falls back to today when missing.
 */
function toDateOnly(value?: string | null): string {
  if (!value) return new Date().toISOString().split('T')[0];
  const d = new Date(value);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  return d.toISOString().split('T')[0];
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
