require('dotenv').config({ path: 'C:/kambata-travel/server/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Hello!");
    console.log(result.response.text());
  } catch (e) {
    console.error("2.5-flash Error:", e.status, e.statusText, e.message);
  }
}

test();
