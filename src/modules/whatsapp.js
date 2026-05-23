const axios = require('axios');
const config = require('../config');

const api = (method) =>
  `${config.greenApi.baseUrl()}/${method}/${config.greenApi.token}`;

async function sendMessage(phone, message) {
  const chatId = formatChatId(phone);
  try {
    const res = await axios.post(api('sendMessage'), { chatId, message });
    console.log(`[WA] Сообщение → ${phone}`);
    return res.data;
  } catch (e) {
    console.error(`[WA] Ошибка sendMessage ${phone}:`, e.response?.data || e.message);
    return null;
  }
}

async function getContactInfo(phone) {
  const chatId = formatChatId(phone);
  try {
    const res = await axios.post(api('getContactInfo'), { chatId });
    // Green API возвращает name — имя из профиля самого пользователя
    return res.data?.name || null;
  } catch (e) {
    console.error(`[WA] Ошибка getContactInfo ${phone}:`, e.response?.data || e.message);
    return null;
  }
}

async function getChats() {
  try {
    const res = await axios.get(api('getChats'));
    return res.data.filter(c => !c.id.includes('@g.us'));
  } catch (e) {
    console.error('[WA] Ошибка getChats:', e.response?.data || e.message);
    return [];
  }
}

async function getChatHistory(chatId, count = 100) {
  try {
    const res = await axios.post(api('getChatHistory'), { chatId, count });
    return res.data;
  } catch (e) {
    console.error(`[WA] Ошибка getChatHistory ${chatId}:`, e.response?.data || e.message);
    return [];
  }
}

async function getStatus() {
  try {
    const res = await axios.get(api('getStateInstance'));
    return res.data.stateInstance;
  } catch (e) {
    console.error('[WA] Ошибка getStatus:', e.message);
    return null;
  }
}

function formatChatId(phone) {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@c.us`;
}

module.exports = { sendMessage, getContactInfo, getChats, getChatHistory, formatChatId, getStatus };