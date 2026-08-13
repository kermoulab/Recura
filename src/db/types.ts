/**
 * Database abstraction contract.
 *
 * This is the ONLY contract the rest of the application is allowed to depend
 * on. UI code talks to repositories (see src/db/repositories), repositories
 * talk to a DatabaseAdapter, and the adapter is the only place that knows how
 * to talk to a concrete database provider.
 *
 * The current implementation of this contract is SupabaseAdapter, but the
 * contract itself is provider-agnostic: no Supabase types, client instances,
 * table names, or column names leak into it.
 */

/**
 * Normalized error codes. Every database failure surfaces to the UI as a
 * DatabaseError carrying one of these codes, regardless of the provider.
 */
export type DbErrorCode =
  | 'NOT_CONFIGURED'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PERMISSION_DENIED'
  | 'AUTH_FAILED'
  | 'VALIDATION'
  | 'UNKNOWN';

export interface DatabaseErrorOptions {
  code: DbErrorCode;
  message: string;
  table?: string;
  operation?: string;
  cause?: unknown;
}

/**
 * Provider-agnostic database error. UI layers can rely on `code` to react
 * consistently (e.g. show "database not configured" vs "already exists").
 */
export class DatabaseError extends Error {
  readonly code: DbErrorCode;
  readonly table?: string;
  readonly operation?: string;
  readonly cause?: unknown;

  constructor(opts: DatabaseErrorOptions) {
    super(opts.message);
    this.name = 'DatabaseError';
    this.code = opts.code;
    this.table = opts.table;
    this.operation = opts.operation;
    this.cause = opts.cause;
  }
}

/**
 * Wraps a low-level adapter error with a domain-friendly message so toasts
 * stay meaningful. NOT_CONFIGURED errors pass through untouched because their
 * message already explains the fix (create .env / restart the app).
 */
export function contextualizeError(
  err: unknown,
  friendly: string,
  table: string,
  operation: string
): Error {
  if (err instanceof DatabaseError) {
    if (err.code === 'NOT_CONFIGURED') return err;
    return new DatabaseError({
      code: err.code,
      message: `${friendly}: ${err.message}`,
      table: err.table ?? table,
      operation: err.operation ?? operation,
      cause: err.cause ?? err,
    });
  }
  return new DatabaseError({
    code: 'UNKNOWN',
    message: `${friendly}: ${err instanceof Error ? err.message : String(err)}`,
    table,
    operation,
    cause: err,
  });
}

/** Sorting for list queries. The column name is provider-specific. */
export interface ListOptions {
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
}

export interface DbStatus {
  connected: boolean;
  provider: string;
  configured: boolean;
}

/**
 * Low-level, provider-agnostic persistence interface.
 *
 * Implementations work with raw rows (plain objects). Domain mapping — entity
 * <-> row — lives in the repositories, which is also where table/column names
 * are kept, so swapping the adapter does not leak provider schema into the UI.
 */
export interface DatabaseAdapter {
  readonly provider: string;
  isConnected(): boolean;
  getStatus(): DbStatus;

  /** Reads rows. Returns [] when the database is not configured. */
  list<T>(table: string, options?: ListOptions): Promise<T[]>;

  /** Inserts rows and returns the inserted rows. Throws when not configured. */
  insert<T>(table: string, rows: Record<string, unknown>[]): Promise<T[]>;

  /** Updates one row by id and returns the updated row. Throws when not found. */
  update<T>(table: string, id: string, patch: Record<string, unknown>): Promise<T>;

  /** Bulk update over rows matching all `match` pairs (used for snapshot sync). */
  updateWhere(table: string, match: Record<string, unknown>, patch: Record<string, unknown>): Promise<void>;

  /** Deletes one row by id. Throws when nothing was deleted. */
  delete(table: string, id: string): Promise<void>;

  /** Inserts or updates rows keyed by `conflictKey`. */
  upsert(table: string, rows: Record<string, unknown>[], conflictKey: string): Promise<void>;

  /**
   * Optional: server-backed providers register a server-side session after the
   * client-side login succeeds, so mutating queries carry a bearer token.
   * Local providers (e.g. Supabase anon-key) do not implement this.
   */
  registerSession?(user: { email: string; userName: string }): Promise<void>;

  /** Optional: revokes the server-side session on logout. Best effort. */
  unregisterSession?(): Promise<void>;
}
