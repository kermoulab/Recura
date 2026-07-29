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
}

export interface WhatsAppTemplate {
  language: Language;
  expiring3Days: string;
  expired: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  action: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'CUSTOMER_CREATE' | 'CUSTOMER_EDIT' | 'PLAN_CREATE' | 'ORDER_CREATE' | 'ORDER_EDIT' | 'STATUS_CHANGE' | 'WHATSAPP_SENT' | 'SETTINGS_CHANGE' | 'EXPORT_DATA';
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

export type UserRole = 'ADMIN' | 'LIMITED';

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
}
