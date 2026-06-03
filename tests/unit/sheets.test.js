jest.mock('googleapis', () => {
  const mockGet=jest.fn(), mockUpdate=jest.fn(), mockAppend=jest.fn();
  return { google: { auth:{GoogleAuth:jest.fn().mockImplementation(()=>({}))}, sheets:jest.fn().mockReturnValue({spreadsheets:{values:{get:mockGet,update:mockUpdate,append:mockAppend}}}), _mocks:{mockGet,mockUpdate,mockAppend} } };
});
const {google}=require('googleapis');
const {mockGet,mockUpdate,mockAppend}=google._mocks;
const {createSheetsClient}=require('../../src/db/sheets');
const db=createSheetsClient({credentials:{},sheetId:'SHEET_ID'});
beforeEach(()=>{jest.clearAllMocks();mockGet.mockResolvedValue({data:{values:[]}});mockUpdate.mockResolvedValue({});mockAppend.mockResolvedValue({});});

describe('readGuests',()=>{
  test('парсит строки',async()=>{
    mockGet.mockResolvedValue({data:{values:[['77051234567','Алина','01.05.2026','5','15.05.2026','sleeping']]}});
    const g=await db.readGuests();
    expect(g[0]).toMatchObject({rowIndex:2,phone:'77051234567',name:'Алина',visitCount:5,status:'sleeping'});
  });
  test('пустая таблица',async()=>{expect(await db.readGuests()).toEqual([]);});
  test('неполные строки',async()=>{mockGet.mockResolvedValue({data:{values:[['77051234567']]}});const g=await db.readGuests();expect(g[0].name).toBe('');});
});

describe('upsertGuest — обновление',()=>{
  const ex={rowIndex:5,phone:'77051234567',name:'Алина',lastVisit:'01.04.2026',visitCount:3,lastMessageSent:'10.05.2026',status:'lost'};
  test('update по rowIndex',async()=>{await db.upsertGuest(ex,{phone:'77051234567',status:'sleeping',lastVisit:'01.06.2026'});expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({range:'guests!A5:F5'}));});
  test('НЕ затирает lastMessageSent',async()=>{await db.upsertGuest(ex,{phone:'77051234567',status:'sleeping',lastVisit:''});expect(mockUpdate.mock.calls[0][0].requestBody.values[0][4]).toBe('10.05.2026');});
  test('НЕ затирает lastVisit',async()=>{await db.upsertGuest(ex,{phone:'77051234567',status:'sleeping',lastVisit:''});expect(mockUpdate.mock.calls[0][0].requestBody.values[0][2]).toBe('01.04.2026');});
  test('НЕ понижает статус до dead',async()=>{await db.upsertGuest(ex,{phone:'77051234567',status:'dead',lastVisit:''});expect(mockUpdate.mock.calls[0][0].requestBody.values[0][5]).toBe('lost');});
  test('повышает статус до sleeping',async()=>{await db.upsertGuest(ex,{phone:'77051234567',status:'sleeping',lastVisit:'01.06.2026'});expect(mockUpdate.mock.calls[0][0].requestBody.values[0][5]).toBe('sleeping');});
});

describe('upsertGuest — новый',()=>{
  test('append для нового гостя',async()=>{await db.upsertGuest(null,{phone:'77059999999',name:'Новый',lastVisit:'01.06.2026',visitCount:1,status:'sleeping'});expect(mockAppend).toHaveBeenCalled();expect(mockUpdate).not.toHaveBeenCalled();});
});

describe('markMessageSent',()=>{
  test('пишет дату в E',async()=>{await db.markMessageSent(10,'03.06.2026');expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({range:'guests!E10',requestBody:{values:[['03.06.2026']]}}));});
});

describe('readBirthdays',()=>{
  test('парсит именинников',async()=>{
    mockGet.mockResolvedValue({data:{values:[['Алина','77051234567','15.06','2025']]}});
    const b=await db.readBirthdays();
    expect(b[0]).toMatchObject({rowIndex:2,name:'Алина',phone:'77051234567',birthday:'15.06',lastSentYear:'2025'});
  });
  test('пустой список',async()=>{expect(await db.readBirthdays()).toEqual([]);});
});

describe('markBirthdaySent',()=>{
  test('пишет год в D',async()=>{await db.markBirthdaySent(7,2026);expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({range:'birthdays!D7',requestBody:{values:[['2026']]}}));});
});