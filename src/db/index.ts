/**
 * Database facade.
 *
 * `getDatabase()` is the single entry point the UI uses. It exposes the
 * DatabaseAdapter plus a set of domain repositories. The UI must never import
 * a provider SDK or a provider client directly — everything goes through here.
 *
 * Provider selection is automatic and resolves before first render:
 *   * When a hosted backend was configured by the installer (any PostgreSQL
 *     served through a PostgREST-style API, e.g. Supabase), the RestAdapter is
 *     used and the app talks to it directly from the browser (no Recura server
 *     needed).
 *   * Otherwise, when the install status on the Recura server is INSTALLED,
 *     the ApiAdapter is used (persistence over /api/db).
 *   * When nothing is configured yet, the app redirects to /install.
 */
import { ApiAdapter } from './ApiAdapter';
import { RestAdapter } from './RestAdapter';
import { apiUrl } from '../lib/apiClient';
import { loadHostedConfig } from '../lib/hostedBackend';
import { rest, isRestConfigured } from '../lib/restClient';
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

export type DatabaseMode = 'server' | 'rest';

let database: Database | null = null;
let mode: DatabaseMode | null = null;
let needsInstall = false;

/** True when the hosted backend already has an ADMIN account (post-install). */
async function hostedAdminExists(): Promise<boolean> {
  if (!isRestConfigured || !rest) return false;
  try {
    const { data, error } = await rest.count('User', { role: 'ADMIN' });
    if (error) return false;
    return (data ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Probes for the data provider once to decide which adapter to use. Call
 * before the first render (see src/main.tsx). Never throws — any failure
 * routes the user to the installer.
 */
export async function detectDatabaseMode(): Promise<DatabaseMode> {
  if (mode) return mode;

  // 1. Hosted backend configured by the installer (PostgREST URL + optional key).
  if (loadHostedConfig()) {
    mode = 'rest';
    needsInstall = !(await hostedAdminExists());
    return mode;
  }

  // 2. Recura server.
  try {
    const res = await fetch(apiUrl('/api/install/status'), { method: 'GET', credentials: 'include' });
    if (!res.ok) throw new Error('server unreachable');
    const body = (await res.json()) as { status?: string };
    mode = 'server';
    needsInstall = body?.status !== 'INSTALLED';
  } catch {
    // Nothing reachable and nothing configured — route to the installer so the
    // user can choose a backend.
    mode = 'server';
    needsInstall = true;
  }
  return mode;
}

/** Non-null when the app must route the user to the installer first. */
export function getInstallRedirectTarget(): string | null {
  return needsInstall ? '/install' : null;
}

export function getDatabaseMode(): DatabaseMode {
  return mode ?? 'server';
}

export function getDatabase(): Database {
  if (!database) {
    const adapter = getDatabaseMode() === 'rest' ? new RestAdapter() : new ApiAdapter();
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
