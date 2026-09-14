/**
 * Backend for the Ruth & Max wedding site. This is the ONLY server-side
 * component (site itself is static, hosted on GitHub Pages). Deploy with
 * `clasp push` from this folder, then `clasp deploy` — see README.md.
 *
 * Script properties required (Project Settings > Script properties):
 *   RSVP_SHEET_ID, SURPRISE_SHEET_ID, FRAGEN_SHEET_ID, GUESTS_SHEET_ID,
 *   KUCHEN_SHEET_ID, DRIVE_FOTOS_FOLDER_ID, WEDDING_DATE_ISO,
 *   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
 */

const PROPS = PropertiesService.getScriptProperties();

function doGet(e) {
  const action = e.parameter.action;
  try {
    switch (action) {
      case 'guest':
        return json_({ level: lookupGuestLevel_(e.parameter.name, e.parameter.email) });
      case 'songs':
        return json_(searchSpotify_(e.parameter.q || ''));
      case 'kuchen_list':
        return json_(listSheetRows_(PROPS.getProperty('KUCHEN_SHEET_ID'), KUCHEN_COLUMNS));
      case 'fotos_list':
        return json_(listFotos_());
      case 'mail_send':
        requireCliAuth_(e);
        sendInfoMail_(e.parameter.subject || '', e.parameter.body || '');
        return json_({ ok: true });
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
      case 'essen':
      case 'lied':
      case 'uebernachtung':
        upsertRsvpRow_(body.type, body);
        return json_({ ok: true });
      case 'ueberraschung':
        appendRow_(PROPS.getProperty('SURPRISE_SHEET_ID'), [new Date(), clean_(body.name), clean_(body.email), clean_(body.text)]);
        return json_({ ok: true });
      case 'frage':
        appendRow_(PROPS.getProperty('FRAGEN_SHEET_ID'), [new Date(), clean_(body.name), clean_(body.email), clean_(body.question)]);
        notifyCoupleOfQuestion_(body);
        return json_({ ok: true });
      case 'kuchen':
        appendRow_(PROPS.getProperty('KUCHEN_SHEET_ID'), [
          new Date(), clean_(body.who), clean_(body.what), Number(body.slices) || 0, clean_(body.kind),
          !!body.cooled, !!body.veganVeg, !!body.nuts, !!body.stand
        ]);
        return json_({ ok: true });
      case 'foto':
        return json_(uploadFoto_(body));
      default:
        return json_({ error: 'unknown type' }, 400);
    }
  } catch (err) {
    return json_({ error: String(err) }, 500);
  }
}

// --- Guests / access -------------------------------------------------------

function lookupGuestLevel_(name, email) {
  const sheet = openSheet_(PROPS.getProperty('GUESTS_SHEET_ID'));
  const rows = sheet.getDataRange().getValues(); // Name, E-Mail, Stufe
  const wantEmail = String(email || '').trim().toLowerCase();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim().toLowerCase() === wantEmail) {
      const level = Number(rows[i][2]);
      return level >= 0 && level <= 3 ? level : null;
    }
  }
  return null;
}

// --- RSVP upsert (rsvp / essen / lied / uebernachtung share one row) ------

const RSVP_COLUMNS = ['Zeit', 'Name', 'E-Mail', 'Teilnahme', 'Essen', 'Allergien', 'Song', 'Übernachtung', 'Info-Mail-Opt-in'];
const KUCHEN_COLUMNS = ['Zeit', 'Name', 'Beitrag', 'Stücke', 'Art', 'Kühlung nötig', 'vegan/vegetarisch', 'enthält Nüsse', 'braucht Kuchenplatte'];

function upsertRsvpRow_(type, body) {
  const sheet = openSheet_(PROPS.getProperty('RSVP_SHEET_ID'));
  const values = sheet.getDataRange().getValues();
  const email = String(body.email || '').trim().toLowerCase();
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][2]).trim().toLowerCase() === email) {
      rowIndex = i + 1; // 1-based sheet row
      break;
    }
  }
  const patch = fieldsForType_(type, body);
  if (rowIndex === -1) {
    const row = RSVP_COLUMNS.map((_, i) => (i === 0 ? new Date() : i === 1 ? clean_(body.name) : i === 2 ? clean_(body.email) : patch[i] ?? ''));
    sheet.appendRow(row);
  } else {
    RSVP_COLUMNS.forEach((_, i) => {
      if (patch[i] !== undefined) sheet.getRange(rowIndex, i + 1).setValue(patch[i]);
    });
  }
}

function fieldsForType_(type, body) {
  // index -> value, aligned to RSVP_COLUMNS
  const patch = {};
  if (type === 'rsvp') {
    patch[3] = clean_(body.teilnahme);
    patch[8] = !!body.optIn;
  } else if (type === 'essen') {
    patch[4] = clean_(body.essen);
    patch[5] = clean_(body.allergien);
  } else if (type === 'lied') {
    patch[6] = clean_(body.song);
  } else if (type === 'uebernachtung') {
    patch[7] = clean_(body.uebernachtung);
  }
  return patch;
}

// --- Kuchen / Fotos ----------------------------------------------------

function listSheetRows_(sheetId, columns) {
  const sheet = openSheet_(sheetId);
  const values = sheet.getDataRange().getValues();
  return values.slice(1).map((row) => {
    const obj = {};
    columns.forEach((col, i) => (obj[col] = row[i]));
    return obj;
  });
}

function listFotos_() {
  const folder = DriveApp.getFolderById(PROPS.getProperty('DRIVE_FOTOS_FOLDER_ID'));
  const files = folder.getFiles();
  const out = [];
  while (files.hasNext()) {
    const f = files.next();
    out.push({ id: f.getId(), name: f.getName(), url: f.getUrl() });
  }
  return out;
}

function uploadFoto_(body) {
  const weddingDate = new Date(PROPS.getProperty('WEDDING_DATE_ISO'));
  if (new Date() < weddingDate) {
    return { ok: false, error: 'locked_until_wedding_day' };
  }
  const folder = DriveApp.getFolderById(PROPS.getProperty('DRIVE_FOTOS_FOLDER_ID'));
  const bytes = Utilities.base64Decode(body.dataBase64);
  const blob = Utilities.newBlob(bytes, body.mimeType || 'image/jpeg', clean_(body.filename) || 'foto.jpg');
  const file = folder.createFile(blob);
  file.setDescription('Hochgeladen von: ' + clean_(body.uploaderName || ''));
  return { ok: true, id: file.getId(), url: file.getUrl() };
}

// --- Spotify -------------------------------------------------------------

function searchSpotify_(query) {
  if (!query) return [];
  const token = getSpotifyToken_();
  const res = UrlFetchApp.fetch(
    'https://api.spotify.com/v1/search?type=track&limit=8&q=' + encodeURIComponent(query),
    { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true }
  );
  const data = JSON.parse(res.getContentText());
  const tracks = (data.tracks && data.tracks.items) || [];
  return tracks.map((t) => ({ name: t.name, artist: (t.artists || []).map((a) => a.name).join(', '), uri: t.uri }));
}

function getSpotifyToken_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('spotify_token');
  if (cached) return cached;
  const res = UrlFetchApp.fetch('https://accounts.spotify.com/api/token', {
    method: 'post',
    headers: { Authorization: 'Basic ' + Utilities.base64Encode(PROPS.getProperty('SPOTIFY_CLIENT_ID') + ':' + PROPS.getProperty('SPOTIFY_CLIENT_SECRET')) },
    payload: { grant_type: 'client_credentials' }
  });
  const data = JSON.parse(res.getContentText());
  cache.put('spotify_token', data.access_token, Math.max(60, (data.expires_in || 3600) - 60));
  return data.access_token;
}

// --- Mail ------------------------------------------------------------------

function requireCliAuth_(e) {
  // The CLI is a trusted, manually-run tool — a shared secret in an env
  // var is enough here; there's no need for a full auth system for 60-80 guests.
  if (e.parameter.cliToken !== PROPS.getProperty('CLI_TOKEN')) throw new Error('unauthorized');
}

function sendInfoMail_(subject, body) {
  const sheet = openSheet_(PROPS.getProperty('RSVP_SHEET_ID'));
  const values = sheet.getDataRange().getValues();
  const emails = values.slice(1).filter((row) => row[8]).map((row) => row[2]).filter(Boolean);
  emails.forEach((email) => MailApp.sendEmail(email, subject, body));
}

function notifyCoupleOfQuestion_(body) {
  const to = PROPS.getProperty('COUPLE_EMAIL');
  if (!to) return;
  MailApp.sendEmail(to, 'Neue Frage über die Hochzeitswebsite', clean_(body.name) + ' (' + clean_(body.email) + '):\n\n' + clean_(body.question));
}

// --- Helpers -----------------------------------------------------------

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
