// Local self-test for the backend's guest checks (Google services faked in memory).
// Run: node apps-script/selftest.mjs
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const TOKEN = '11111111-2222-3333-4444-555555555555';

// --- fakes ---------------------------------------------------------------
const books = { main: {}, geheim: {} };
function fakeSheet(rows) {
  return {
    rows,
    getDataRange: () => ({ getValues: () => rows.map((r) => [...r]) }),
    appendRow: (r) => rows.push([...r]),
    getLastRow: () => rows.length,
    getRange: (row, col, nr = 1, nc = 1) => ({
      getValues: () => [rows[row - 1].slice(col - 1, col - 1 + nc)],
      setValues: (v) => v[0].forEach((x, i) => (rows[row - 1][col - 1 + i] = x)),
      setValue: (x) => (rows[row - 1][col - 1] = x)
    })
  };
}
const cache = new Map();
const ctx = {
  console,
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => ({ HOCHZEIT_SHEET_ID: 'main', HOCHZEIT_GEHEIM_SHEET_ID: 'geheim', SITE_URL: 'https://example.org/site/' })[k] ?? null }) },
  SpreadsheetApp: {
    openById: (id) => ({
      getSheetByName: (n) => books[id][n] ?? null,
      insertSheet: (n) => (books[id][n] = fakeSheet([]))
    })
  },
  CacheService: { getScriptCache: () => ({ get: (k) => cache.get(k) ?? null, put: (k, v) => cache.set(k, v) }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ setMimeType: () => ({ body: JSON.parse(t) }) }) },
  Utilities: {
    getUuid: () => 'uuid',
    DigestAlgorithm: { SHA_256: 'sha256' },
    computeDigest: (_a, s) => [...createHash('sha256').update(s).digest()],
    base64EncodeWebSafe: (b) => Buffer.from(b).toString('base64url')
  }
};
vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('./apps-script.gs', import.meta.url), 'utf8'), ctx);

const gaeste = ctx.SpreadsheetApp.openById('main').insertSheet('Gäste');
gaeste.appendRow(['Einladung-ID', 'Name', 'Stufe', 'Token', 'Code', 'E-Mail', 'Telefon', 'RSVP-Status', 'Notizen', 'Gehört zu']);
gaeste.appendRow(['E1', 'Erika Beispiel', 'alles', TOKEN, 'K7M2QX', '', '', '', '', '']);
const post = (body) => ctx.doPost({ postData: { contents: JSON.stringify(body) } }).body;
const get = (parameter) => ctx.doGet({ parameter }).body;

// --- checks ----------------------------------------------------------------
for (const type of ['rsvp', 'kuchen', 'frage', 'ueberraschung', 'trauzeugen']) {
  assert.deepEqual(post({ type, idea: 'x', question: 'x' }), { error: 'forbidden' }, `${type} without token`);
  assert.deepEqual(post({ type, token: 'wrong', idea: 'x', question: 'x' }), { error: 'forbidden' }, `${type} with wrong token`);
}
assert.deepEqual(post({ type: 'kuchen', token: TOKEN, who: 'Erika', what: '<img src=x onerror=alert(1)>', slices: 12, kind: 'k' }), { ok: true });
assert.deepEqual(post({ type: 'frage', token: TOKEN, question: '=HYPERLINK("x")', contact: '' }), { ok: true });
assert.equal(books.main['Fragen'].rows[1][1], '\'=HYPERLINK("x")', 'formula guard');

assert.deepEqual(get({ action: 'kuchen_list' }), { error: 'forbidden' }, 'cake list without token');
const cakes = get({ action: 'kuchen_list', t: TOKEN });
assert.deepEqual(Object.keys(cakes[0]).sort(), ['Art', 'Beitrag', 'Name', 'Stücke'], 'cake list fields');

assert.deepEqual(post({ type: 'guest_list', password: 'x' }), { error: 'unknown type' }, 'guest_list removed');
assert.equal(get({ action: 'guest_lookup', code: 'k7m2qx' }).token, TOKEN, 'code lookup ignores case');
assert.deepEqual(get({ action: 'guest_lookup', code: '1234' }), { error: 'not found' });

for (let i = 0; i < 40; i++) post({ type: 'frage', token: TOKEN, question: 'flood' });
assert.deepEqual(post({ type: 'frage', token: TOKEN, question: 'one more' }), { error: 'rate limited' }, 'write limit');
assert.ok(books.main['Fragen'].rows.length <= 31, 'flood capped');

const code = ctx.newGuestCode_();
assert.match(code, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/, 'new code format');
assert.equal(ctx.qrData().guests[0].token, TOKEN, 'qrData lists guests');

console.log('apps-script selftest: all checks passed');
