jest.mock('axios');
const axios = require('axios');
const { createClient } = require('../../src/wa/client');
const client = createClient({ instanceId: 'TEST123', token: 'TOKEN456' });

function mockSuccess(data) { axios.get.mockResolvedValue({ data }); axios.post.mockResolvedValue({ data }); }
function mockError(status) { const e = { response: { status, data: {} } }; axios.get.mockRejectedValue(e); axios.post.mockRejectedValue(e); }
beforeEach(() => jest.clearAllMocks());

describe('getStatus', () => {
  test('возвращает stateInstance', async () => { mockSuccess({ stateInstance: 'authorized' }); expect(await client.getStatus()).toBe('authorized'); });
  test('возвращает null при ошибке', async () => { mockError(500); expect(await client.getStatus()).toBeNull(); });
});
describe('getChats', () => {
  test('фильтрует группы', async () => {
    mockSuccess([{ id: '111@c.us', name: 'A' }, { id: '222@g.us', name: 'G' }, { id: '333@c.us', name: 'B' }]);
    const chats = await client.getChats();
    expect(chats).toHaveLength(2);
    expect(chats.every(c => !c.id.includes('@g.us'))).toBe(true);
  });
  test('возвращает [] при ошибке', async () => { mockError(500); expect(await client.getChats()).toEqual([]); });
  test('возвращает [] если не массив', async () => { mockSuccess({}); expect(await client.getChats()).toEqual([]); });
});
describe('getChatHistory', () => {
  test('возвращает сообщения', async () => { mockSuccess([{ type: 'incoming' }]); expect(await client.getChatHistory('77051234567')).toHaveLength(1); });
  test('правильный chatId', async () => { mockSuccess([]); await client.getChatHistory('77051234567', 20); expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('getChatHistory'), expect.objectContaining({ chatId: '77051234567@c.us', count: 20 })); });
  test('возвращает [] при ошибке', async () => { mockError(500); expect(await client.getChatHistory('77051234567')).toEqual([]); });
});
describe('getContactInfo', () => {
  test('возвращает pushname', async () => { mockSuccess({ pushname: 'Алина', name: 'Иванова' }); expect(await client.getContactInfo('77051234567')).toBe('Алина'); });
  test('fallback на name', async () => { mockSuccess({ pushname: '', name: 'Иванова' }); expect(await client.getContactInfo('77051234567')).toBe('Иванова'); });
  test('null при ошибке', async () => { mockError(500); expect(await client.getContactInfo('77051234567')).toBeNull(); });
});
describe('sendMessage', () => {
  test('true при успехе', async () => { mockSuccess({ idMessage: 'msg_1' }); expect(await client.sendMessage('77051234567', 'Привет!')).toBe(true); });
  test('false без idMessage', async () => { mockSuccess({}); expect(await client.sendMessage('77051234567', 'Привет!')).toBe(false); });
  test('правильные параметры', async () => { mockSuccess({ idMessage: '1' }); await client.sendMessage('77051234567', 'Тест'); expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('sendMessage'), expect.objectContaining({ chatId: '77051234567@c.us', message: 'Тест' })); });
  test('false при ошибке', async () => { mockError(500); expect(await client.sendMessage('77051234567', 'Тест')).toBe(false); });
});
describe('retry при 429', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  test('повторяет и возвращает результат', async () => {
    axios.get.mockRejectedValueOnce({ response: { status: 429, data: {} } }).mockRejectedValueOnce({ response: { status: 429, data: {} } }).mockResolvedValueOnce({ data: { stateInstance: 'authorized' } });
    const p = client.getStatus(); await jest.runAllTimersAsync(); expect(await p).toBe('authorized'); expect(axios.get).toHaveBeenCalledTimes(3);
  });
  test('null если все попытки исчерпаны', async () => {
    axios.get.mockRejectedValue({ response: { status: 429, data: {} } });
    const p = client.getStatus(); await jest.runAllTimersAsync(); expect(await p).toBeNull(); expect(axios.get).toHaveBeenCalledTimes(4);
  });
});