export type Language = 'AR' | 'FR' | 'EN';

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRING_7D' | 'EXPIRING_3D' | 'EXPIRED';

export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'VIP';

export interface Customer {
  id: string;
  name: string;
  whatsapp: string;
  email?: string;
  preferredLanguage: Language;
  registrationDate: string;
  status: CustomerStatus;
  ordersCount: number;
  totalSpent: number;
  notes?: string;
}

export interface Plan {
  id: string;
  name: string;
  category: 'Netflix' | 'Disney+' | 'Prime Video' | 'Spotify' | 'IPTV' | 'YouTube Premium' | 'HBO Max' | 'Other';
  price: number;
  durationMonths: number;
  notes?: string;
  availableStock: number;
  totalAccounts: number;
  activeOrders: number;
}

export interface Order {
  id: string;
  orderNumber?: number;
  customerId: string;
  customerName: string;
  customerWhatsApp: string;
  planId: string;
  planName: string;
  price: number;
  durationMonths: number;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  accountEmail: string;
  accountPasswordEncrypted: string;
  pinCodeEncrypted?: string;
  screenProfileName?: string;
  notes?: string;
  contactedForRenewal?: boolean;
  contactedAt?: string;
  serviceAccountId?: string;
  profileNumber?: number;
  createdAt?: string;
}

export type ServiceType =
  | 'Netflix'
  | 'Disney+'
  | 'Prime Video'
  | 'Spotify'
  | 'IPTV'
  | 'YouTube Premium'
  | 'HBO Max'
  | 'Other';

export type ServiceAccountStatus = 'Active' | 'Expired' | 'Suspended';

export interface ServiceAccount {
  id: string;
  serviceType: ServiceType;
  providerId?: string;
  email: string;
  passwordEncrypted?: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  purchaseCost: number;
  capacity: number;
  status: ServiceAccountStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WhatsAppTemplate {
  language: Language;
  expiring3Days: string;
  expired: string;
  thanksClient: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  action: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'CUSTOMER_CREATE' | 'CUSTOMER_EDIT' | 'PLAN_CREATE' | 'ORDER_CREATE' | 'ORDER_EDIT' | 'STATUS_CHANGE' | 'WHATSAPP_SENT' | 'SETTINGS_CHANGE' | 'EXPORT_DATA' | 'ACCOUNT_CREATE' | 'ACCOUNT_EDIT' | 'ACCOUNT_DELETE' | 'ACCOUNT_RENEW' | 'ACCOUNT_STATUS_CHANGE';
  details: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface KPIStats {
  totalOrders: number;
  activeCustomers: number;
  totalSales: number;
  totalIncome: number;
  expiring3DaysCount: number;
  expiring7DaysCount: number;
  expiredCount: number;
  mrrGrowth: number;
}

export type UserRole = 'ADMIN' | 'AGENT';

export interface DeviceInfo {
  browser: string;
  os: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  deviceName: string;
  isCurrentDevice?: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  sessionToken: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo: DeviceInfo;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  cookieFlags: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None';
  };
}

export type AccountStatus = 'ACTIVE' | 'DISABLED' | 'BLOCKED';

export interface UserProfile {
  id: string;
  fullName: string;
  username?: string;
  email: string;
  password?: string;
  passwordHash?: string;
  role: UserRole;
  createdAt: string;
  status?: AccountStatus;
  isBlocked?: boolean;
  maxSessionsAllowed?: number;
  activeSessionsCount?: number;
  currency?: string;
}

export interface MobileDevice {
  id: string;
  installation_id: string;
  device_id: string;
  device_name: string;
  platform: string;
  app_version?: string;
  status: 'active' | 'revoked' | 'inactive';
  created_at: string;
  last_seen_at: string;
  revoked_at?: string;
  user_id?: string;
  user_name?: string;
}

export interface MobilePairingToken {
  id: string;
  installation_id: string;
  token_hash: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
  created_by: string;
}
