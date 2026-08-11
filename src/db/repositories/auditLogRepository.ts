import { AuditLog } from '../../types/erp';
import { DatabaseAdapter, contextualizeError } from '../types';

export interface AuditLogRepository {
  fetchAll(): Promise<AuditLog[]>;
  insert(log: AuditLog): Promise<AuditLog>;
}

/** Raw row shape for the "AuditLog" table. */
type AuditLogRow = Record<string, any>;

function formatForDb(a: AuditLog) {
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

function formatFromDb(row: AuditLogRow): AuditLog {
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

export function createAuditLogRepository(adapter: DatabaseAdapter): AuditLogRepository {
  return {
    async fetchAll() {
      try {
        const rows = await adapter.list<AuditLogRow>('AuditLog', {
          orderBy: { column: 'createdAt', ascending: false },
        });
        return rows.map(formatFromDb);
      } catch (err) {
        console.warn('Failed to fetch audit logs:', err);
        return [];
      }
    },

    async insert(log) {
      try {
        await adapter.insert<AuditLogRow>('AuditLog', [formatForDb(log)]);
        return log;
      } catch (err) {
        throw contextualizeError(err, 'Failed to save audit log to database', 'AuditLog', 'insert');
      }
    },
  };
}
