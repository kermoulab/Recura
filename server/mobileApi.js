import crypto from 'node:crypto';
import { queryOne, queryAll, connectClient } from './db.js';
import { readConfig } from './config.js';
import { verifyAppSession } from './auth.js';
import { verifyPassword } from './hash.js';
import { logger } from './logger.js';
import { quoteIdent } from './schema.js';

/** Lazily-created connection pool-ish helper. */
async function withConnection(fn) {
  const config = readConfig();
  if (!config) {
    throw Object.assign(new Error('Recura is not installed or its database is not configured.'), { code: 'NOT_CONFIGURED' });
  }
  const client = await connectClient(config);
  try {
    return await fn(client);
  } finally {
    try { await client.end(); } catch { /* ignore */ }
  }
}

/** Hashes a token using SHA-256 for fast server-side verification. */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Generates a random alphanumeric code of length N. */
function generateCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like 1, I, O, 0
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(crypto.randomInt(chars.length));
  }
  return code;
}

export async function handleMobileApi(req, res, route, body, headers = {}) {
  try {
    switch (route) {
      case 'generate':
        return await handleGeneratePairing(res, body, headers);
      case 'pair':
        return await handlePairDevice(res, body);
      case 'login':
        return await handleMobileLogin(res, body);
      case 'logout':
        return await handleMobileLogout(res, headers);
      case 'devices':
        if (req.method === 'GET') {
          return await handleListDevices(res, headers);
        } else if (req.method === 'POST' && body.action === 'revoke') {
          return await handleRevokeDevice(res, body.id, headers);
        }
        break;
      default:
        return sendJson(res, 404, { ok: false, code: 'NOT_FOUND', message: 'Unknown mobile route.' });
    }
  } catch (err) {
    logger.error('mobile', `Mobile API error: ${err?.message ?? err}`);
    sendJson(res, err.code === 'PERMISSION_DENIED' ? 401 : 500, { ok: false, code: err.code || 'INTERNAL', message: err.message || 'Internal server error.' });
  }
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(payload);
}

/** Web App: Generate a new pairing token and QR code */
async function handleGeneratePairing(res, body, headers) {
  const tokenHeader = String(headers.authorization || '').replace(/^Bearer\s+/i, '');
  const session = verifyAppSession(tokenHeader);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: 'PERMISSION_DENIED', message: 'Unauthorized' });
  }

  const rawCode = generateCode(8);
  const tokenHash = hashToken(rawCode);

  await withConnection(async (client) => {
    // Ensure installation exists
    const inst = await queryOne(client, 'SELECT id FROM installation LIMIT 1');
    if (!inst) {
      throw new Error('Installation identity not found');
    }

    const user = await queryOne(client, 'SELECT id FROM "User" WHERE email = $1 LIMIT 1', [session.email]);
    if (!user) throw new Error('User not found');

    // Token expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await client.query(
      `INSERT INTO mobile_pairing_tokens (installation_id, token_hash, expires_at, created_by)
       VALUES ($1, $2, $3, $4)`,
      [inst.id, tokenHash, expiresAt, user.id]
    );

    sendJson(res, 200, { ok: true, code: rawCode, expiresAt });
  });
}

/** Android App: Pair device using the token */
async function handlePairDevice(res, body) {
  const { code, deviceName, platform, appVersion } = body;
  if (!code || !deviceName || !platform) {
    return sendJson(res, 400, { ok: false, code: 'VALIDATION', message: 'Missing required fields' });
  }

  const tokenHash = hashToken(code);

  await withConnection(async (client) => {
    const inst = await queryOne(client, 'SELECT id FROM installation LIMIT 1');
    
    // Find valid token
    const token = await queryOne(client,
      `SELECT id FROM mobile_pairing_tokens 
       WHERE token_hash = $1 AND expires_at > now() AND used_at IS NULL AND installation_id = $2`,
      [tokenHash, inst.id]
    );

    if (!token) {
      return sendJson(res, 403, { ok: false, code: 'INVALID_TOKEN', message: 'Invalid or expired pairing code.' });
    }

    // Mark used
    await client.query(`UPDATE mobile_pairing_tokens SET used_at = now() WHERE id = $1`, [token.id]);

    const deviceId = crypto.randomUUID();

    const device = await queryOne(client,
      `INSERT INTO mobile_devices (installation_id, device_id, device_name, platform, app_version, status)
       VALUES ($1, $2, $3, $4, $5, 'active') RETURNING id, device_id`,
      [inst.id, deviceId, deviceName, platform, appVersion]
    );

    sendJson(res, 200, { ok: true, installation_id: inst.id, device_id: device.device_id });
  });
}

/** Android App: Login user and issue mobile session */
async function handleMobileLogin(res, body) {
  const { device_id, username, password } = body;
  if (!device_id || !username || !password) {
    return sendJson(res, 400, { ok: false, code: 'VALIDATION', message: 'Missing credentials.' });
  }

  await withConnection(async (client) => {
    // Verify device
    const device = await queryOne(client,
      `SELECT id, status FROM mobile_devices WHERE device_id = $1 LIMIT 1`,
      [device_id]
    );

    if (!device) {
      return sendJson(res, 403, { ok: false, code: 'UNKNOWN_DEVICE', message: 'Device not paired.' });
    }
    if (device.status !== 'active') {
      return sendJson(res, 403, { ok: false, code: 'REVOKED_DEVICE', message: 'Device is revoked.' });
    }

    // Verify user
    const user = await queryOne(client,
      `SELECT id, passwordHash, email FROM "User" WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1) LIMIT 1`,
      [username]
    );

    if (!user) {
      return sendJson(res, 401, { ok: false, code: 'AUTH_FAILED', message: 'Invalid credentials.' });
    }

    const valid = await verifyPassword(password, user.passwordHash || '');
    if (!valid) {
      return sendJson(res, 401, { ok: false, code: 'AUTH_FAILED', message: 'Invalid credentials.' });
    }

    // Associate device with user
    await client.query(`UPDATE mobile_devices SET user_id = $1 WHERE id = $2`, [user.id, device.id]);

    // Issue session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionHash = hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    await client.query(
      `INSERT INTO mobile_sessions (mobile_device_id, user_id, session_token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [device.id, user.id, sessionHash, expiresAt]
    );

    sendJson(res, 200, { ok: true, session_token: sessionToken });
  });
}

/** Android App: Logout user (destroy session) */
async function handleMobileLogout(res, headers) {
  const tokenHeader = String(headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!tokenHeader) {
    return sendJson(res, 401, { ok: false, code: 'UNAUTHORIZED', message: 'Missing token' });
  }

  const sessionHash = hashToken(tokenHeader);

  await withConnection(async (client) => {
    await client.query(`DELETE FROM mobile_sessions WHERE session_token_hash = $1`, [sessionHash]);
    sendJson(res, 200, { ok: true });
  });
}

/** Web App: List active devices */
async function handleListDevices(res, headers) {
  const tokenHeader = String(headers.authorization || '').replace(/^Bearer\s+/i, '');
  const session = verifyAppSession(tokenHeader);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: 'PERMISSION_DENIED', message: 'Unauthorized' });
  }

  await withConnection(async (client) => {
    const devices = await queryAll(client,
      `SELECT d.id, d.device_name, d.platform, d.app_version, d.status, d.last_seen_at, d.created_at, u.username as user_name
       FROM mobile_devices d
       LEFT JOIN "User" u ON d.user_id = u.id
       ORDER BY d.created_at DESC`
    );
    sendJson(res, 200, { ok: true, devices });
  });
}

/** Web App: Revoke device */
async function handleRevokeDevice(res, deviceId, headers) {
  const tokenHeader = String(headers.authorization || '').replace(/^Bearer\s+/i, '');
  const session = verifyAppSession(tokenHeader);
  if (!session) {
    return sendJson(res, 401, { ok: false, code: 'PERMISSION_DENIED', message: 'Unauthorized' });
  }

  await withConnection(async (client) => {
    // Find device
    const device = await queryOne(client, `SELECT id FROM mobile_devices WHERE id = $1`, [deviceId]);
    if (!device) {
      return sendJson(res, 404, { ok: false, code: 'NOT_FOUND', message: 'Device not found' });
    }

    await client.query(`UPDATE mobile_devices SET status = 'revoked', revoked_at = now() WHERE id = $1`, [deviceId]);
    
    // Invalidate sessions
    await client.query(`DELETE FROM mobile_sessions WHERE mobile_device_id = $1`, [deviceId]);

    sendJson(res, 200, { ok: true });
  });
}
