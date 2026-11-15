/**
 * NOUX private two-device synchronisation service.
 * The Durable Object stores ONLY opaque AES-GCM ciphertext and a SHA-256 verifier.
 * No itinerary, passphrase, names, pairing secret or decrypted item is logged.
 */
const DEFAULT_ORIGIN = 'https://benjbongard-sys.github.io';
const ID_RE = /^[A-Za-z0-9_-]{22}$/;   // 128-bit random room identifier
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/; // 256-bit bearer, never in URL or logs
const MAX_BODY_BYTES = 3_000_000;       // SQLite-backed Durable Object limit: 8MB
const MAX_CIPHERTEXT = 2_900_000;
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };

function response(data, status = 200) {
 return Response.json(data, { status, headers: JSON_HEADERS });
}
function cors(origin, allowed) {
 return {
  'Access-Control-Allow-Origin': origin === allowed ? allowed : 'null',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '600', 'Vary': 'Origin',
  'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer',
 };
}
async function tokenDigest(room, token) {
 const input = new TextEncoder().encode('noux-room-v1:' + room + ':' + token);
 const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', input));
 return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
function equalVerifier(a, b) {
 if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
 let d = 0;
 for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
 return d === 0;
}
function validBox(box) {
 return !!(box && typeof box === 'object' && !Array.isArray(box) &&
  box.version === 1 &&
  typeof box.iv === 'string' && /^[A-Za-z0-9+/]{16}$/.test(box.iv) &&
  typeof box.ct === 'string' && box.ct.length >= 24 && box.ct.length <= MAX_CIPHERTEXT &&
  /^[A-Za-z0-9+/]+={0,2}$/.test(box.ct));
}

export class NouxRoom {
 constructor(ctx) {
  this.ctx = ctx;
  // SQLite is strongly consistent within a room. Use synchronous SQL operations
  // for the revision check + write with no async gap after reading the current row.
  this.db = ctx.storage.sql;
  this.db.exec('CREATE TABLE IF NOT EXISTS room (id INTEGER PRIMARY KEY CHECK (id=1), verifier TEXT NOT NULL, revision INTEGER NOT NULL, box TEXT NOT NULL, updated_at TEXT NOT NULL)');
 }
 async fetch(request) {
  const uri = new URL(request.url);
  const room = request.headers.get('X-NOUX-Room') || '';
  const token = request.headers.get('Authorization') || '';
  if (!ID_RE.test(room) || !token.startsWith('Bearer ') || !TOKEN_RE.test(token.slice(7))) {
   return response({ error: 'Invalid credentials' }, 401);
  }
  const verifier = await tokenDigest(room, token.slice(7));
  const current = this.db.exec('SELECT verifier, revision, box, updated_at FROM room WHERE id=1').toArray()[0];
  if (current && !equalVerifier(current.verifier, verifier)) return response({ error: 'Not authorised for this trip' }, 403);
  if (request.method === 'GET') {
   if (!current) return response({ exists: false, revision: 0 }, 404);
   return response({ exists: true, revision: current.revision, encrypted: JSON.parse(current.box), updatedAt: current.updated_at });
  }
  if (request.method !== 'PUT') return response({ error: 'Method not allowed' }, 405);
  const size = Number(request.headers.get('Content-Length') || '0');
  if (size > MAX_BODY_BYTES) return response({ error: 'Encrypted state exceeds size limit' }, 413);
  const bodyText = await request.text();
  if (bodyText.length > MAX_BODY_BYTES) return response({ error: 'Encrypted state exceeds size limit' }, 413);
  let content;
  try { content = JSON.parse(bodyText); } catch (_) { return response({ error: 'Malformed JSON' }, 400); }
  if (!content || !Number.isSafeInteger(content.baseRevision) || content.baseRevision < 0 || !validBox(content.encrypted)) {
   return response({ error: 'Invalid encrypted document' }, 400);
  }
  // Re-read after body parsing: no await between optimistic version check and SQL write.
  const previous = this.db.exec('SELECT verifier, revision FROM room WHERE id=1').toArray()[0];
  if (previous && !equalVerifier(previous.verifier, verifier)) return response({ error: 'Not authorised for this trip' }, 403);
  const revision = previous ? previous.revision : 0;
  if (content.baseRevision !== revision) return response({ error: 'Revision conflict', revision }, 409);
  const next = revision + 1, updatedAt = new Date().toISOString();
  const serialized = JSON.stringify(content.encrypted);
  if (!previous) {
   this.db.exec('INSERT INTO room (id, verifier, revision, box, updated_at) VALUES (1, ?, ?, ?, ?)', verifier, next, serialized, updatedAt);
  } else {
   this.db.exec('UPDATE room SET revision=?, box=?, updated_at=? WHERE id=1', next, serialized, updatedAt);
  }
  return response({ ok: true, revision: next, updatedAt }, 200);
 }
}

export default {
 async fetch(request, env) {
  const url = new URL(request.url);
  const allowed = env.ALLOWED_ORIGIN || DEFAULT_ORIGIN;
  const origin = request.headers.get('Origin');
  const headers = cors(origin, allowed);
  const decorate = res => {
   const h = new Headers(res.headers);
   for (const [k, v] of Object.entries(headers)) h.set(k, v);
   h.set('Content-Type', 'application/json; charset=utf-8');
   return new Response(res.body, { status: res.status, headers: h });
  };
  if (request.method === 'OPTIONS') {
   return new Response(null, { status: origin === allowed ? 204 : 403, headers });
  }
  if (origin && origin !== allowed) return decorate(response({ error: 'Origin is not allowed' }, 403));
  if (url.pathname === '/health' && request.method === 'GET') {
   return decorate(response({ ok: true, protocol: 1, service: 'NOUX encrypted sync', storage: 'Cloudflare Durable Objects' }));
  }
  const match = /^\/v1\/rooms\/([A-Za-z0-9_-]{22})$/.exec(url.pathname);
  if (!match) return decorate(response({ error: 'Not found' }, 404));
  if (!['GET', 'PUT'].includes(request.method)) return decorate(response({ error: 'Method not allowed' }, 405));
  const token = request.headers.get('Authorization') || '';
  if (!/^Bearer [A-Za-z0-9_-]{43}$/.test(token)) return decorate(response({ error: 'Missing or invalid room authorisation' }, 401));
  if (!env.ROOMS) return decorate(response({ error: 'Room storage not configured' }, 503));
  try {
   const object = env.ROOMS.get(env.ROOMS.idFromName('noux-v1:' + match[1]));
   const forward = new Request('https://noux-room.internal/document', request);
   forward.headers.set('X-NOUX-Room', match[1]);
   return decorate(await object.fetch(forward));
  } catch (_) {
   return decorate(response({ error: 'Shared trip temporarily unavailable' }, 503));
  }
 }
};
