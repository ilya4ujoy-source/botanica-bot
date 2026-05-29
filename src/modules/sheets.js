const { google } = require('googleapis');
const config = require('../config');
let sheets;

async function getClient() {
  if (sheets) return sheets;
  const auth = new google.auth.GoogleAuth({ credentials: config.google.credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}
const SHEET_ID = config.google.sheetId;

async function getBirthdays() {
  const client = await getClient();
  const res = await client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'birthdays!A2:D' });
  return (res.data.values || []).map((row, i) => ({ rowIndex: i+2, name: row[0]||'', phone: row[1]||'', birthday: row[2]||'', lastMessageYear: row[3]||'' }));
}

async function updateBirthdayLastMessage(rowIndex, year) {
  const client = await getClient();
  await client.spreadsheets.values.update({ spreadsheetId: SHEET_ID, range: `birthdays!D${rowIndex}`, valueInputOption: 'RAW', requestBody: { values: [[String(year)]] } });
}

async function getGuests() {
  const client = await getClient();
  const res = await client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'guests!A2:F' });
  return (res.data.values || []).map((row, i) => ({ rowIndex: i+2, phone: row[0]||'', name: row[1]||'', lastVisit: row[2]||'', visitCount: parseInt(row[3])||0, lastMessageSent: row[4]||'', status: row[5]||'' }));
}

async function upsertGuest(guest) {
  const client = await getClient();
  const existing = await getGuests();
  const found = existing.find(g => g.phone === guest.phone);
  // Никогда не перезаписываем старые данные пустыми
  const lastMessageSent = guest.lastMessageSent || (found ? found.lastMessageSent : '') || '';
  const lastVisit = guest.lastVisit || (found ? found.lastVisit : '') || '';
  // Не меняем статус на dead если он уже лучше
  const oldStatus = found ? found.status : '';
  const statusPriority = { active:5, sleeping:4, lost:3, very_old:2, dead:1, '':0 };
  const newPriority = statusPriority[guest.status] || 0;
  const oldPriority = statusPriority[oldStatus] || 0;
  const status = (guest.status && newPriority > 0) ? guest.status : (oldStatus || guest.status || '');
  const values = [[
    guest.phone,
    guest.name || (found ? found.name : '') || '',
    lastVisit,
    String(guest.visitCount || (found ? found.visitCount : 0) || 0),
    lastMessageSent,
    status,
  ]];
  if (found) {
    await client.spreadsheets.values.update({ spreadsheetId: SHEET_ID, range: `guests!A${found.rowIndex}:F${found.rowIndex}`, valueInputOption: 'RAW', requestBody: { values } });
  } else {
    await client.spreadsheets.values.append({ spreadsheetId: SHEET_ID, range: 'guests!A:F', valueInputOption: 'RAW', requestBody: { values } });
  }
}

async function updateGuestMessageSent(rowIndex, date) {
  const client = await getClient();
  await client.spreadsheets.values.update({ spreadsheetId: SHEET_ID, range: `guests!E${rowIndex}`, valueInputOption: 'RAW', requestBody: { values: [[date]] } });
}

async function markGuestContacted(phone, name, date) {
  const existing = await getGuests();
  const found = existing.find(g => g.phone === phone);
  if (found) {
    await updateGuestMessageSent(found.rowIndex, date);
  } else {
    const client = await getClient();
    await client.spreadsheets.values.append({ spreadsheetId: SHEET_ID, range: 'guests!A:F', valueInputOption: 'RAW', requestBody: { values: [[phone, name||'', '', '0', date, 'active']] } });
  }
  console.log(`[Sheets] Контакт записан: ${name||phone} — ${date}`);
}

module.exports = { getBirthdays, updateBirthdayLastMessage, getGuests, upsertGuest, updateGuestMessageSent, markGuestContacted };