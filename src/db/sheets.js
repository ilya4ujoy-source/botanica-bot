const { google } = require('googleapis');

const COL = { PHONE:0, NAME:1, LAST_VISIT:2, VISIT_COUNT:3, LAST_MSG_SENT:4, STATUS:5, BD_NAME:0, BD_PHONE:1, BD_BIRTHDAY:2, BD_LAST_YEAR:3 };
const STATUS_PRIORITY = { active:5, sleeping:4, lost:3, very_old:2, dead:1, '':0 };

function resolveStatus(newS, oldS) {
  const np = STATUS_PRIORITY[newS]||0, op = STATUS_PRIORITY[oldS]||0;
  if (np>0 && np>=op) return newS;
  if (op>0) return oldS;
  return newS||'';
}

function createSheetsClient(config) {
  const { credentials, sheetId } = config;
  let _client = null;

  async function getClient() {
    if (_client) return _client;
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    _client = google.sheets({ version:'v4', auth });
    return _client;
  }

  async function readRange(range) {
    const c = await getClient();
    const res = await c.spreadsheets.values.get({ spreadsheetId:sheetId, range });
    return res.data.values || [];
  }

  async function writeRange(range, values) {
    const c = await getClient();
    await c.spreadsheets.values.update({ spreadsheetId:sheetId, range, valueInputOption:'RAW', requestBody:{values} });
  }

  async function appendRows(sheet, values) {
    const c = await getClient();
    await c.spreadsheets.values.append({ spreadsheetId:sheetId, range:`${sheet}!A:F`, valueInputOption:'RAW', requestBody:{values} });
  }

  async function readGuests() {
    const rows = await readRange('guests!A2:F');
    return rows.map((row,i) => ({
      rowIndex:i+2, phone:row[COL.PHONE]||'', name:row[COL.NAME]||'',
      lastVisit:row[COL.LAST_VISIT]||'', visitCount:parseInt(row[COL.VISIT_COUNT])||0,
      lastMessageSent:row[COL.LAST_MSG_SENT]||'', status:row[COL.STATUS]||'',
    }));
  }

  async function upsertGuest(existing, updates) {
    const merged = {
      phone:           updates.phone           || existing?.phone           || '',
      name:            updates.name            || existing?.name            || '',
      lastVisit:       updates.lastVisit       || existing?.lastVisit       || '',
      visitCount:      updates.visitCount      ?? existing?.visitCount      ?? 0,
      lastMessageSent: existing?.lastMessageSent || '',
      status:          resolveStatus(updates.status, existing?.status),
    };
    const values = [[merged.phone, merged.name, merged.lastVisit, String(merged.visitCount), merged.lastMessageSent, merged.status]];
    if (existing) await writeRange(`guests!A${existing.rowIndex}:F${existing.rowIndex}`, values);
    else await appendRows('guests', values);
  }

  async function markMessageSent(rowIndex, date) {
    await writeRange(`guests!E${rowIndex}`, [[date]]);
  }

  async function readBirthdays() {
    const rows = await readRange('birthdays!A2:D');
    return rows.map((row,i) => ({
      rowIndex:i+2, name:row[COL.BD_NAME]||'', phone:row[COL.BD_PHONE]||'',
      birthday:row[COL.BD_BIRTHDAY]||'', lastSentYear:row[COL.BD_LAST_YEAR]||'',
    }));
  }

  async function markBirthdaySent(rowIndex, year) {
    await writeRange(`birthdays!D${rowIndex}`, [[String(year)]]);
  }

  return { readGuests, upsertGuest, markMessageSent, readBirthdays, markBirthdaySent };
}

module.exports = { createSheetsClient };