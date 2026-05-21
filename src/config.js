require('dotenv').config();

module.exports = {
  greenApi: {
    instanceId: process.env.GREEN_API_INSTANCE_ID,
    token: process.env.GREEN_API_TOKEN,
    baseUrl: () => `https://api.green-api.com/waInstance${process.env.GREEN_API_INSTANCE_ID}`,
  },
  google: {
    sheetId: process.env.GOOGLE_SHEET_ID || '159PBK3Nfz29OC0vBoSqZu76qfn-nIjrVK76dCPC2GfY',
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}'),
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
  },
  bot: {
    reactivationPauseDays: 30,
    sleepingAfterDays: 30,    // спящий — не было 30+ дней
    lostAfterDays: 60,        // потерянный — не было 60+ дней
    birthdayDaysBefore: 7,
    barName: 'Ботаника',
  },
};