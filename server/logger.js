/**
 * Logging.
 *
 * SAFETY RULE: no passwords, connection credentials, session tokens, or full
 * error stacks that could embed secrets may ever reach the log. The install log
 * is intentionally coarse-grained; detailed SQL errors go back to the browser
 * (sanitized) so the user can act on them, but not to disk.
 */

const LOG_LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

function ts() {
  return new Date().toISOString();
}

function write(level, scope, message, meta) {
  const line = `${ts()} [${level.toUpperCase()}] [${scope}] ${message}`;
  if (level === 'error') console.error(line, meta ?? '');
  else if (level === 'warn') console.warn(line, meta ?? '');
  else console.log(line, meta ?? '');
}

export function makeLogger(level = process.env.RECURA_LOG_LEVEL || 'info') {
  const threshold = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  return {
    debug(scope, msg, meta) { if (threshold <= LOG_LEVELS.debug) write('debug', scope, msg, meta); },
    info(scope, msg, meta) { if (threshold <= LOG_LEVELS.info) write('info', scope, msg, meta); },
    warn(scope, msg, meta) { if (threshold <= LOG_LEVELS.warn) write('warn', scope, msg, meta); },
    error(scope, msg, meta) { if (threshold <= LOG_LEVELS.error) write('error', scope, msg, meta); },
  };
}

export const logger = makeLogger();
