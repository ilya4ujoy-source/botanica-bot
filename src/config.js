require('dotenv').config();
function required(name){const v=process.env[name];if(!v)throw new Error(`Переменная окружения ${name} не задана`);return v;}
const config={whatsapp:{instanceId:required('GREEN_API_INSTANCE_ID'),token:required('GREEN_API_TOKEN')},sheets:{sheetId:required('GOOGLE_SHEET_ID'),credentials:JSON.parse(required('GOOGLE_SERVICE_ACCOUNT_JSON'))},schedule:{timezone:'Asia/Almaty',birthday:'0 13 * * *',sync:'0 15 * * *',reactivation:'0 16 * * *'}};
module.exports=config;