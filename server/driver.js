/**
 * Injectable database driver.
 *
 * Default: node-postgres. Tests call setPgModule() with a mock exposing the
 * same surface the rest of the server uses ({ Client } where the client has
 * connect(), query(sql, params) -> { rows }, end()).
 */

import pg from 'pg';

let currentPg = pg;

export function setPgModule(mod) {
  currentPg = mod;
}

export function getPgModule() {
  return currentPg;
}

export { currentPg };
