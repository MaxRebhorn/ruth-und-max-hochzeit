/**
 * Backend for the Ruth & Max wedding site. This is the ONLY server-side
 * component (site itself is static, hosted on GitHub Pages). Deploy with
 * `clasp push` from this folder, then `clasp deploy -i <deployment-id>`
 * (in-place, so the /exec URL in config.json never has to change) — see
 * README.md.
 *
 * Guests are identified by a per-invitation token (QR link `?t=<token>`)
 * or a 4-digit fallback code, looked up against the `Gäste` tab — see
 * technical-spec.md §1. RSVP upserts by the resulting `Einladung-ID`;
 * everything else (Kuchenbuffet, Fragen, Überraschungen,
 * Trauzeugen-Nachrichten) stays append-only, same as before.
 *
 * Two spreadsheet files, each with several named tabs:
 *   HOCHZEIT_SHEET_ID        — Gäste, RSVP, RSVP-Log, Kuchenbuffet, Fragen
 *                               (shared with Ruth & Max)
 *   HOCHZEIT_GEHEIM_SHEET_ID — Überraschungen, Trauzeugen-Nachrichten
 *                               (same account, separate file — the couple
 *                               isn't meant to see this one day-to-day)
 *
 * Script properties required (Project Settings > Script properties):
 *   HOCHZEIT_SHEET_ID, HOCHZEIT_GEHEIM_SHEET_ID
 */

const PROPS = PropertiesService.getScriptProperties();

const SHEET_NAMES = {
  gaeste: 'Gäste',
  rsvp: 'RSVP',
  rsvpLog: 'RSVP-Log',
  kuchen: 'Kuchenbuffet',
  fragen: 'Fragen'
};

const GEHEIM_SHEET_NAMES = {
  ueberraschungen: 'Überraschungen',
  trauzeugen: 'Trauzeugen-Nachrichten'
};

const GAESTE_COLUMNS = ['Einladung-ID', 'Name', 'Stufe', 'Token', 'Code', 'E-Mail', 'Telefon', 'RSVP-Status', 'Notizen'];
const RSVP_COLUMNS = [
  'Zeit', 'Einladung-ID', 'Name', 'E-Mail', 'Telefon', 'Anzahl', 'Teilnahme', 'Allergien', 'Song',
  'Übernachtung', 'Nachricht', 'Essenswahl', 'Liedwunsch', 'Übernachtung-Details'
];
const KUCHEN_COLUMNS = [
  'Zeit', 'Einladung-ID', 'Name', 'Beitrag', 'Stücke', 'Art', 'Kühlung nötig', 'vegan/vegetarisch', 'enthält Nüsse',
  'braucht Kuchenplatte'
];
const FRAGEN_COLUMNS = ['Zeit', 'Frage', 'Kontakt'];
const UEBERRASCHUNGEN_COLUMNS = ['Zeit', 'Von', 'Kontakt', 'Idee', 'Geheim'];
const TRAUZEUGEN_COLUMNS = ['Zeit', 'An', 'Name', 'Kontakt', 'Nachricht'];

const RATE_LIMIT_KEY = 'code_fail_count';
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_SECONDS = 60;

const MAX_FIELD_LENGTH = 500;

function doGet(e) {
  const action = e.parameter.action;
  try {
    switch (action) {
      case 'kuchen_list':
        return json_(listSheetRows_(mainSheet_(SHEET_NAMES.kuchen), KUCHEN_COLUMNS));
      case 'guest_lookup':
        return json_(guestLookup_(e.parameter.t, e.parameter.code));
      default:
        return json_({ error: 'unknown action' });
    }
  } catch (err) {
    return json_({ error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.honeypot) return json_({ ok: true }); // silently swallow bot submissions

    switch (body.type) {
      case 'rsvp':
        upsertRsvp_(body);
        return json_({ ok: true });
      case 'kuchen':
        appendRow_(mainSheet_(SHEET_NAMES.kuchen), [
          new Date(), resolveEinladungId_(body.token), clean_(body.who), clean_(body.what), Number(body.slices) || 0,
          clean_(body.kind), !!body.cooled, !!body.veganVeg, !!body.nuts, !!body.stand
        ]);
        return json_({ ok: true });
      case 'frage':
        appendRow_(mainSheet_(SHEET_NAMES.fragen), [new Date(), clean_(body.question), clean_(body.contact)]);
        return json_({ ok: true });
      case 'ueberraschung':
        appendRow_(geheimSheet_(GEHEIM_SHEET_NAMES.ueberraschungen), [
          new Date(), clean_(body.who), clean_(body.contact), clean_(body.idea), !!body.secret
        ]);
        return json_({ ok: true });
      case 'trauzeugen':
        appendRow_(geheimSheet_(GEHEIM_SHEET_NAMES.trauzeugen), [
          new Date(), clean_(body.towhom), clean_(body.name), clean_(body.contact), clean_(body.message)
        ]);
        return json_({ ok: true });
      default:
        return json_({ error: 'unknown type' });
    }
  } catch (err) {
    return json_({ error: String(err) });
  }
}

// --- guest lookup (gate) -------------------------------------------------

/**
 * `t` (token, from a QR link) is effectively unguessable (122-bit UUID) and
 * isn't rate-limited. `code` (4-digit, typed in by hand) is short and
 * guessable by design, so it's the one behind the rate limiter. Apps Script
 * web apps don't expose the caller's IP, so this is a *global* throttle —
 * see technical-spec.md §1.5.
 */
function guestLookup_(token, code) {
  if (token) {
    const row = findGuestRow_('Token', token);
    return row ? { name: row['Name'], stufe: row['Stufe'], token: row['Token'] } : { error: 'not found' };
  }
  if (code) {
    if (isRateLimited_()) return { error: 'rate limited' };
    const row = findGuestRow_('Code', code);
    if (!row) {
      registerFailedAttempt_();
      return { error: 'not found' };
    }
    // Echo the real long-lived token back even though the guest typed the short
    // code — the client then uses the same token for every later submission,
    // regardless of which route (QR vs manual code) originally identified them.
    return { name: row['Name'], stufe: row['Stufe'], token: row['Token'] };
  }
  return { error: 'missing token or code' };
}

function isRateLimited_() {
  const cache = CacheService.getScriptCache();
  return (Number(cache.get(RATE_LIMIT_KEY)) || 0) >= RATE_LIMIT_MAX;
}

function registerFailedAttempt_() {
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get(RATE_LIMIT_KEY)) || 0;
  cache.put(RATE_LIMIT_KEY, String(count + 1), RATE_LIMIT_WINDOW_SECONDS);
}

function findGuestRow_(column, value) {
  if (!value) return null;
  const values = mainSheet_(SHEET_NAMES.gaeste).getDataRange().getValues();
  const header = values[0];
  const colIndex = header.indexOf(column);
  if (colIndex === -1) return null;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][colIndex]).trim() === String(value).trim()) {
      const obj = {};
      header.forEach((h, j) => (obj[h] = values[i][j]));
      return obj;
    }
  }
  return null;
}

function resolveEinladungId_(token) {
  const row = token ? findGuestRow_('Token', token) : null;
  return row ? row['Einladung-ID'] : '';
}

// --- RSVP upsert -----------------------------------------------------------

/**
 * Merge-only upsert keyed by Einladung-ID: a blank field in a new
 * submission never blanks out a previously-filled one. Every submission
 * also lands untouched in RSVP-Log first — the undo button if an upsert
 * ever does something unexpected. Wrapped in a script lock because Sheets
 * itself isn't transactional and two guests could otherwise race on the
 * same row (see technical-spec.md §1.5).
 */
function upsertRsvp_(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const einladungId = resolveEinladungId_(body.token);
    const rowValues = rsvpRowValues_(einladungId, body);

    appendRow_(mainSheet_(SHEET_NAMES.rsvpLog), rowValues);

    const rsvpSheet = mainSheet_(SHEET_NAMES.rsvp);
    const existing = einladungId ? findRowByColumn_(rsvpSheet, 'Einladung-ID', einladungId) : null;
    if (existing) {
      mergeRowInPlace_(rsvpSheet, existing.rowIndex, rowValues);
    } else {
      appendRow_(rsvpSheet, rowValues);
    }

    if (einladungId) updateGuestStatus_(einladungId, body);
  } finally {
    lock.releaseLock();
  }
}

function rsvpRowValues_(einladungId, body) {
  return [
    new Date(), einladungId, clean_(body.name), clean_(body.email), clean_(body.phone), Number(body.count) || 0,
    clean_(body.teilnahme), clean_(body.allergien), clean_(body.song), !!body.uebernachtung, clean_(body.nachricht),
    '', '', '' // Essenswahl / Liedwunsch / Übernachtung-Details — reserved until those forms exist
  ];
}

/** Overwrites only the columns where the new value isn't blank; Zeit (col 1) always refreshes. */
function mergeRowInPlace_(sheet, rowIndex, newValues) {
  const range = sheet.getRange(rowIndex, 1, 1, RSVP_COLUMNS.length);
  const existing = range.getValues()[0];
  const merged = newValues.map((v, i) => (v === '' || v === null || v === undefined ? existing[i] : v));
  merged[0] = newValues[0];
  range.setValues([merged]);
}

function findRowByColumn_(sheet, columnName, value) {
  const values = sheet.getDataRange().getValues();
  const colIndex = values[0].indexOf(columnName);
  if (colIndex === -1) return null;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][colIndex]).trim() === String(value).trim()) return { rowIndex: i + 1, values: values[i] };
  }
  return null;
}

/** Writes the guest's contact info + a status summary back onto their Gäste row, purely informational. */
function updateGuestStatus_(einladungId, body) {
  const sheet = mainSheet_(SHEET_NAMES.gaeste);
  const found = findRowByColumn_(sheet, 'Einladung-ID', einladungId);
  if (!found) return;
  const header = sheet.getDataRange().getValues()[0];
  const set = (col, val) => {
    const idx = header.indexOf(col);
    if (idx !== -1 && val) sheet.getRange(found.rowIndex, idx + 1).setValue(val);
  };
  set('E-Mail', clean_(body.email));
  set('Telefon', clean_(body.phone));
  set('RSVP-Status', clean_(body.teilnahme) || 'angemeldet');
}

// --- guest-list maintenance menu (Sheet UI, no external tool needed) -------

/**
 * Simple triggers like a plain `onOpen()` only fire automatically for a
 * script *bound* to the spreadsheet (Extensions → Apps Script from inside
 * the file). If this project is standalone instead (e.g. an existing
 * project was reused rather than creating a bound one), `onOpen()` needs an
 * *installable* trigger to fire when the Gäste spreadsheet opens — run
 * `installOnOpenTrigger_()` once manually from the script editor to set
 * that up. Safe to run again later; it clears any previous onOpen trigger
 * from this project first so they don't pile up.
 */
function installOnOpenTrigger_() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'onOpen')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('onOpen').forSpreadsheet(PROPS.getProperty('HOCHZEIT_SHEET_ID')).onOpen().create();
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Hochzeit').addItem('Tokens & Codes für neue Gäste erzeugen', 'generateGuestTokens').addToUi();
}

/** Fills blank Einladung-ID/Token/Code cells on the Gäste tab — safe to run repeatedly, only ever fills gaps. */
function generateGuestTokens() {
  const sheet = mainSheet_(SHEET_NAMES.gaeste);
  const values = sheet.getDataRange().getValues();
  const header = values[0];
  const idCol = header.indexOf('Einladung-ID');
  const tokenCol = header.indexOf('Token');
  const codeCol = header.indexOf('Code');
  const usedCodes = new Set(values.slice(1).map((r) => String(r[codeCol])).filter(Boolean));

  let updated = 0;
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    let changed = false;
    if (!row[idCol]) {
      sheet.getRange(i + 1, idCol + 1).setValue('E' + i);
      changed = true;
    }
    if (!row[tokenCol]) {
      sheet.getRange(i + 1, tokenCol + 1).setValue(Utilities.getUuid());
      changed = true;
    }
    if (!row[codeCol]) {
      let code;
      do {
        code = String(Math.floor(1000 + Math.random() * 9000));
      } while (usedCodes.has(code));
      usedCodes.add(code);
      sheet.getRange(i + 1, codeCol + 1).setValue(code);
      changed = true;
    }
    if (changed) updated++;
  }
  SpreadsheetApp.getUi().alert(updated + ' Zeile(n) aktualisiert.');
}

// --- sheets ------------------------------------------------------------

function listSheetRows_(sheet, columns) {
  const values = sheet.getDataRange().getValues();
  return values.slice(1).map((row) => {
    const obj = {};
    columns.forEach((col, i) => (obj[col] = row[i]));
    return obj;
  });
}

function mainSheet_(tabName) {
  return namedSheet_(PROPS.getProperty('HOCHZEIT_SHEET_ID'), tabName);
}

function geheimSheet_(tabName) {
  return namedSheet_(PROPS.getProperty('HOCHZEIT_GEHEIM_SHEET_ID'), tabName);
}

/** Opens a tab by name, creating it (with a header row) on first use so a fresh spreadsheet needs no manual tab setup. */
function namedSheet_(spreadsheetId, tabName) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  let sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    sheet.appendRow(columnsFor_(tabName));
  }
  return sheet;
}

function columnsFor_(tabName) {
  switch (tabName) {
    case SHEET_NAMES.gaeste:
      return GAESTE_COLUMNS;
    case SHEET_NAMES.rsvp:
    case SHEET_NAMES.rsvpLog:
      return RSVP_COLUMNS;
    case SHEET_NAMES.kuchen:
      return KUCHEN_COLUMNS;
    case SHEET_NAMES.fragen:
      return FRAGEN_COLUMNS;
    case GEHEIM_SHEET_NAMES.ueberraschungen:
      return UEBERRASCHUNGEN_COLUMNS;
    case GEHEIM_SHEET_NAMES.trauzeugen:
      return TRAUZEUGEN_COLUMNS;
    default:
      return [];
  }
}

function appendRow_(sheet, row) {
  sheet.appendRow(row.map((v) => (typeof v === 'string' ? clean_(v) : v)));
}

// --- helpers -------------------------------------------------------------

/** Guards against spreadsheet formula injection and caps field length. */
function clean_(value) {
  let s = String(value ?? '').slice(0, MAX_FIELD_LENGTH);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
