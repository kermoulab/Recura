/**
 * Database facade.
 *
 * `getDatabase()` is the single entry point the UI uses. It exposes the
 * DatabaseAdapter plus a set of domain repositories. The UI must never import
 * a provider SDK or a provider client directly — everything goes through here.
 */
import { SupabaseAdapter } from './SupabaseAdapter';
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

let database: Database | null = null;

export function getDatabase(): Database {
  if (!database) {
    const adapter = new SupabaseAdapter();
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
