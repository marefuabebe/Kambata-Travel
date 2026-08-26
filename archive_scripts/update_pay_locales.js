const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'frontend/src/locales/en.json');
const amPath = path.join(__dirname, 'frontend/src/locales/am.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const amData = JSON.parse(fs.readFileSync(amPath, 'utf8'));

enData.requests.status.payNow = "Pay Now →";
enData.requests.status.processing = "Processing…";

amData.requests.status.payNow = "አሁን ክፈሉ →";
amData.requests.status.processing = "በማስኬድ ላይ…";

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
fs.writeFileSync(amPath, JSON.stringify(amData, null, 2), 'utf8');
console.log('Requests locales updated with PayNow button strings.');
