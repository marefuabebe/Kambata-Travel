const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'frontend/src/locales/en.json');
const amPath = path.join(__dirname, 'frontend/src/locales/am.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const amData = JSON.parse(fs.readFileSync(amPath, 'utf8'));

enData.payments = {
  title: "Payment History",
  subtitle: "View your transactions and download receipts",
  noTransactions: "No transactions found.",
  table: {
    transactionRef: "Transaction Ref",
    item: "Item",
    amount: "Amount",
    status: "Status",
    date: "Date",
    receipt: "Receipt"
  },
  packageBooking: "Package Booking",
  tourBooking: "Tour Booking",
  refunded: "Refunded: ETB",
  downloadReceipt: "Receipt"
};

amData.payments = {
  title: "የክፍያ ታሪክ",
  subtitle: "ግብይቶችዎን ይመልከቱ እና ደረሰኞችን ያውርዱ",
  noTransactions: "ምንም ግብይቶች አልተገኙም።",
  table: {
    transactionRef: "የግብይት ማጣቀሻ",
    item: "ዕቃ",
    amount: "መጠን",
    status: "ሁኔታ",
    date: "ቀን",
    receipt: "ደረሰኝ"
  },
  packageBooking: "የጥቅል ማስያዣ",
  tourBooking: "የጉብኝት ማስያዣ",
  refunded: "ተመላሽ ተደርጓል: ETB",
  downloadReceipt: "ደረሰኝ"
};

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
fs.writeFileSync(amPath, JSON.stringify(amData, null, 2), 'utf8');
console.log('Payments locales updated.');
