/**
 * Database facade.
 *
 * `getDatabase()` is the single entry point the UI uses. It exposes the
 * DatabaseAdapter plus a set of domain repositories. The UI must never import
 * a provider SDK or a provider client directly — everything goes through here.
 *
 * Provider selection is automatic and resolves before first render:
 *   * When the SPA is served by the Recura server and the install status is
 *     INSTALLED, the ApiAdapter is used (persistence over /api/db).
 *   * When the install has not completed, the app redirects to /install.
 *   * When the Recura server is unreachable (e.g. Vite dev / static hosting),
 *     it falls back to the Supabase adapter exactly as before.
 */
import { ApiAdapter } from './ApiAdapter';
import { apiUrl } from '../lib/apiClient';
import { DatabaseAdapter, DbStatus } from './types';
import { CustomerRepository, createCustomerRepository } from './repositories/customerRepository';
import { PlanRepository, createPlanRepository } from './repositories/planRepository';
import { OrderRepository, createOrderRepository } from './repositories/orderRepository';
import {
  ServiceAccountRepository,
  createServiceAccountRepository,
} from './repositories/serviceAccountRepository';
import { AuditLogRepository, createAuditLogRepository } from './repositories/auditLogRepository';
import { UserProfileRepository, createUserProfileRepository } from './repositories/userProfileRepository';
import {
  WhatsAppTemplateRepository,
  createWhatsAppTemplateRepository,
} from './repositories/whatsAppTemplateRepository';

export interface Database {
  readonly adapter: DatabaseAdapter;
  readonly customers: CustomerRepository;
  readonly plans: PlanRepository;
  readonly orders: OrderRepository;
  readonly serviceAccounts: ServiceAccountRepository;
  readonly auditLogs: AuditLogRepository;
  readonly userProfiles: UserProfileRepository;
  readonly whatsAppTemplates: WhatsAppTemplateRepository;

  isConnected(): boolean;
  getStatus(): DbStatus;
}

export type DatabaseMode = 'server' | 'supabase';

let database: Database | null = null;
let mode: DatabaseMode | null = null;
let needsInstall = false;

/**
 * Probes the Recura server once to decide which adapter to use. Call before
 * the first render (see src/main.tsx). Never throws — unreachable server
 * falls back to Supabase mode.
 */
export async function detectDatabaseMode(): Promise<DatabaseMode> {
  if (mode) return mode;
  try {
    const res = await fetch(apiUrl('/api/install/status'), { method: 'GET', credentials: 'include' });
    if (!res.ok) throw new Error('server unreachable');
    const body = (await res.json()) as { status?: string };
    mode = 'server';
    needsInstall = body?.status !== 'INSTALLED';
  } catch {
    // SECURITY: The server is strictly required. No falling back to Supabase.
    mode = 'server';
    needsInstall = false;
  }
  return mode;
}

/** Non-null when the app must route the user to the installer first. */
export function getInstallRedirectTarget(): string | null {
  return needsInstall ? '/install' : null;
}

export function getDatabaseMode(): DatabaseMode {
  return 'server';
}

export function getDatabase(): Database {
  if (!database) {
    const adapter = new ApiAdapter();
    database = {
      adapter,
      customers: createCustomerRepository(adapter),
      plans: createPlanRepository(adapter),
      orders: createOrderRepository(adapter),
      serviceAccounts: createServiceAccountRepository(adapter),
      auditLogs: createAuditLogRepository(adapter),
      userProfiles: createUserProfileRepository(adapter),
      whatsAppTemplates: createWhatsAppTemplateRepository(adapter),
      isConnected: () => adapter.isConnected(),
      getStatus: () => adapter.getStatus(),
    };
  }
  return database;
}

export * from './types';
export type {
  CustomerRepository,
  PlanRepository,
  OrderRepository,
  ServiceAccountRepository,
  AuditLogRepository,
  UserProfileRepository,
  WhatsAppTemplateRepository,
} from './repositories';
