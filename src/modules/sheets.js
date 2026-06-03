const { google } = require('googleapis');
const config = require('../config');
let sheetsClient;

async function getClient() {
  if (sheetsClient) return sheetsClient;
  const auth = new google.auth.GoogleAuth({ credentials: config.google.credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}
const SHEET_ID = config.google.sheetId;

async function getBirthdays() {
  const c = await getClient();
  const res = await c.spreadsheets.values.get({ spreadsheetId:SHEET_ID, range:'birthdays!A2:D' });
  return (res.data.values||[]).map((row,i)=>({ rowIndex:i+2, name:row[0]||'', phone:row[1]||'', birthday:row[2]||'', lastMessageYear:row[3]||'' }));
}

async function updateBirthdayLastMessage(rowIndex, year) {
  const c = await getClient();
  await c.spreadsheets.values.update({ spreadsheetId:SHEET_ID, range:`birthdays!D${rowIndex}`, valueInputOption:'RAW', requestBody:{values:[[String(year)]]} });
}

async function getGuests() {
  const c = await getClient();
  const res = await c.spreadsheets.values.get({ spreadsheetId:SHEET_ID, range:'guests!A2:F' });
  return (res.data.values||[]).map((row,i)=>({ rowIndex:i+2, phone:row[0]||'', name:row[1]||'', lastVisit:row[2]||'', visitCount:parseInt(row[3])||0, lastMessageSent:row[4]||'', status:row[5]||'' }));
}

async function upsertGuestWithCache(guest, cache) {
  const c = await getClient();
  const found = cache.find(g=>g.phone===guest.phone);
  const lastMessageSent = guest.lastMessageSent||(found?found.lastMessageSent:'')||'';
  const lastVisit = guest.lastVisit||(found?found.lastVisit:'')||'';
  const pr={active:5,sleeping:4,lost:3,very_old:2,dead:1,'':0};
  const status=(pr[guest.status]||0)>0?guest.status:(found?found.status:guest.status)||'';
  const values=[[guest.phone, guest.name||(found?found.name:'')||'', lastVisit, String(guest.visitCount||(found?found.visitCount:0)||0), lastMessageSent, status]];
  if (found) {
    await c.spreadsheets.values.update({ spreadsheetId:SHEET_ID, range:`guests!A${found.rowIndex}:F${found.rowIndex}`, valueInputOption:'RAW', requestBody:{values} });
  } else {
    await c.spreadsheets.values.append({ spreadsheetId:SHEET_ID, range:'guests!A:F', valueInputOption:'RAW', requestBody:{values} });
    cache.push({ ...guest, rowIndex:cache.length+2, lastMessageSent, lastVisit, status });
  }
}

async function upsertGuest(guest) {
  const existing = await getGuests();
  return upsertGuestWithCache(guest, existing);
}

async function updateGuestMessageSent(rowIndex, date) {
  const c = await getClient();
  await c.spreadsheets.values.update({ spreadsheetId:SHEET_ID, range:`guests!E${rowIndex}`, valueInputOption:'RAW', requestBody:{values:[[date]]} });
}

async function markGuestContacted(phone, name, date) {
  const existing = await getGuests();
  const found = existing.find(g=>g.phone===phone);
  if (found) { await updateGuestMessageSent(found.rowIndex, date); }
  else {
    const c = await getClient();
    await c.spreadsheets.values.append({ spreadsheetId:SHEET_ID, range:'guests!A:F', valueInputOption:'RAW', requestBody:{values:[[phone,name||'','','0',date,'active']]} });
  }
  console.log(`[Sheets] Записан: ${name||phone} — ${date}`);
}

module.exports = { getBirthdays, updateBirthdayLastMessage, getGuests, upsertGuest, upsertGuestWithCache, updateGuestMessageSent, markGuestContacted };