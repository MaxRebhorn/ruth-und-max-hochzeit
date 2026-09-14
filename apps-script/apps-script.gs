/**
 * Backend for the Ruth & Max wedding site. This is the ONLY server-side
 * component (site itself is static, hosted on GitHub Pages). Deploy with
 * `clasp push` from this folder, then `clasp deploy` — see README.md.
 *
 * Simplified pass: 3 guest tiers (trauung/party/alles) unlocked instantly
 * via a shared secret word in the URL, no email/name verification. RSVP has
 * no email field, so submissions are append-only (no upsert-by-email).
 *
 * Script properties required (Project Settings > Script properties):
 *   RSVP_SHEET_ID, KUCHEN_SHEET_ID
 */

const PROPS = PropertiesService.getScriptProperties();

function doGet(e) {
  const action = e.parameter.action;
  try {
    switch (action) {
      case 'kuchen_list':
        return json_(listSheetRows_(PROPS.getProperty('KUCHEN_SHEET_ID'), KUCHEN_COLUMNS));
      default:
        return json_({ error: 'unknown action' }, 400);
    }
  } catch (err) {
    return json_({ error: String(err) }, 500);
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.honeypot) return json_({ ok: true }); // silently swallow bot submissions

    switch (body.type) {
      case 'rsvp':
        appendRow_(PROPS.getProperty('RSVP_SHEET_ID'), [
          new Date(), clean_(body.name), Number(body.count) || 0, clean_(body.teilnahme),
          clean_(body.allergien), clean_(body.song), !!body.uebernachtung, clean_(body.nachricht)
        ]);
        return json_({ ok: true });
      case 'kuchen':
        appendRow_(PROPS.getProperty('KUCHEN_SHEET_ID'), [
          new Date(), clean_(body.who), clean_(body.what), Number(body.slices) || 0, clean_(body.kind),
          !!body.cooled, !!body.veganVeg, !!body.nuts, !!body.stand
        ]);
        return json_({ ok: true });
      default:
        return json_({ error: 'unknown type' }, 400);
    }
  } catch (err) {
    return json_({ error: String(err) }, 500);
  }
}

// --- sheets ------------------------------------------------------------

const KUCHEN_COLUMNS = ['Zeit', 'Name', 'Beitrag', 'Stücke', 'Art', 'Kühlung nötig', 'vegan/vegetarisch', 'enthält Nüsse', 'braucht Kuchenplatte'];

function listSheetRows_(sheetId, columns) {
  const sheet = openSheet_(sheetId);
  const values = sheet.getDataRange().getValues();
  return values.slice(1).map((row) => {
    const obj = {};
    columns.forEach((col, i) => (obj[col] = row[i]));
    return obj;
  });
}

// --- helpers -------------------------------------------------------------

function openSheet_(id) {
  return SpreadsheetApp.openById(id).getSheets()[0];
}

function appendRow_(sheetId, row) {
  openSheet_(sheetId).appendRow(row.map((v) => (typeof v === 'string' ? clean_(v) : v)));
}

const MAX_FIELD_LENGTH = 500;

/** Guards against spreadsheet formula injection and caps field length. */
function clean_(value) {
  let s = String(value ?? '').slice(0, MAX_FIELD_LENGTH);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj, status) {
  const out = ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  // Apps Script web apps don't support setting a custom HTTP status directly;
  // callers should check the JSON `error` field. `status` kept for readability.
  void status;
  return out;
}
