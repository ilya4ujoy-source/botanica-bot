require('dotenv').config();

module.exports = {
  greenApi: {
    baseUrl: () => `https://api.green-api.com/waInstance${process.env.GREEN_API_INSTANCE_ID}`,
    token: process.env.GREEN_API_TOKEN,
  },
  google: {
    sheetId: process.env.GOOGLE_SHEET_ID,
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}'),
  },
  bot: {
    birthdayDaysBefore: 7,
    sleepingAfterDays: 30,
    lostAfterDays: 60,
    veryOldAfterDays: 120,
    deadAfterDays: 365,
  },
};