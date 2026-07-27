require('dotenv').config({ path: 'C:/kambata-travel/server/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { aiToolDeclarations } = require('./utils/ai/toolDeclarations');

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    tools: [{ functionDeclarations: aiToolDeclarations }]
  });
  
  let contents = [
    { role: "user", parts: [{ text: "የጉዞ ፓኬጆችን አሳየኝ" }] }
  ];
  let result = await model.generateContent({ contents });
  
  let functionCalls = result.response.functionCalls();
  let iterations = 0;
  while (functionCalls && functionCalls.length > 0 && iterations < 5) {
    iterations++;
    console.log(`Iteration ${iterations}, Model requested:`, functionCalls.map(c => c.name));
    
    // Append the model's function call to history exactly as returned
    contents.push({
      role: "model",
      parts: result.response.candidates[0].content.parts
    });
    
    // Construct the function response as a USER message
    const responses = functionCalls.map(call => ({
      functionResponse: {
        name: call.name,
        id: call.id,
        response: { message: "User is not authenticated. Please log in to view your bookings." }
      }
    }));
    contents.push({ role: "user", parts: responses });
    
    result = await model.generateContent({ contents });
    functionCalls = result.response.functionCalls();
  }
  
  console.log("Final text:", result.response.text());
}

test();
