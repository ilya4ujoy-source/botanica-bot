const axios = require('axios');
const { toChatId } = require('../utils/phone');

const BASE_DELAY_MS = 1000;
const MAX_RETRIES   = 3;
const REQUEST_GAP_MS = 200;

async function withRetry(fn, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await delay(REQUEST_GAP_MS);
      const res = await fn();
      return res.data;
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 && attempt < retries) {
        const waitMs = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[WA] 429 Rate limit — ждём ${waitMs}ms (попытка ${attempt + 1}/${retries})`);
        await delay(waitMs);
        continue;
      }
      console.error('[WA] Ошибка запроса:', err.response?.data || err.message);
      return null;
    }
  }
  return null;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function createClient(config) {
  const { instanceId, token } = config;
  const base = (process.env.GREEN_API_URL || 'https://7107.api.greenapi.com') + '/waInstance' + instanceId;
  const url = method => `${base}/${method}/${token}`;

  async function getStatus() {
    const data = await withRetry(() => axios.get(url('getStateInstance')));
    return data?.stateInstance ?? null;
  }

  async function getChats() {
    const data = await withRetry(() => axios.get(url('getChats')));
    if (!Array.isArray(data)) return [];
    return data.filter(c => !c.id?.includes('@g.us'));
  }

  async function getChatHistory(phone, count = 20) {
    const chatId = toChatId(phone);
    const data = await withRetry(() => axios.post(url('getChatHistory'), { chatId, count }));
    return Array.isArray(data) ? data : [];
  }

  async function getContactInfo(phone) {
    const chatId = toChatId(phone);
    const data = await withRetry(() => axios.post(url('getContactInfo'), { chatId }));
    return data?.pushname || data?.name || null;
  }

  async function sendMessage(phone, message) {
    const chatId = toChatId(phone);
    const data = await withRetry(() => axios.post(url('sendMessage'), { chatId, message }));
    const ok = !!data?.idMessage;
    if (ok) console.log(`[WA] ✅ Отправлено → ${phone}`);
    return ok;
  }

  return { getStatus, getChats, getChatHistory, getContactInfo, sendMessage };
}

module.exports = { createClient };
