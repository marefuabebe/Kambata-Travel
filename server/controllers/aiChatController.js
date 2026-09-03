const { GoogleGenerativeAI } = require('@google/generative-ai');
const { aiToolDeclarations } = require('../utils/ai/toolDeclarations');
const { toolExecutors } = require('../utils/ai/toolExecutors');
const AILog = require('../models/AILog');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `You are the Kambata Travel Enterprise AI Assistant, a premium AI travel concierge. 

ABOUT THE WEBSITE:
"Kambata Travel" is an elite enterprise travel agency platform. You help users book tours, explore travel packages, manage payments, find hotels, and connect with expert local guides. You MUST prioritize using live data from the database via your backend tools whenever a user asks about schedules, prices, availability, bookings, or their travel profile. Never invent dynamic business data.

ABOUT KAMBATA ZONE:
You are an expert on the Kambata Zone (Kembata Tembaro), located in the Central Ethiopia Regional State. 
Key facts you know:
- Capital City: Durame.
- Major Attractions: Mount Hambaricho (famous for its 777 steps to the summit and breathtaking panoramic views), Ajora Falls (twin waterfalls), and local hot springs.
- Culture & Food: The staple food is 'Kocho', made from Enset (false banana). The people are known for their vibrant Meskel festival (finding of the true cross) celebrations in September.
- Geography: Known for its lush, green, mountainous landscape and high population density.

RULES:
1. Support English, Amharic, and Afaan Oromo natively. 
2. Respect role-based permissions (Guest, Traveler, Guide, Admin). 
3. Always provide concise, professional, and luxurious-feeling responses. 
4. If no tool can answer a database request, politely direct the user to customer support. Never fabricate information.`;

// Initialize the model with tools
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  systemInstruction,
  tools: [{ functionDeclarations: aiToolDeclarations }]
});

const handleChatRequest = async (req, res, next) => {
  try {
    const { history, message, language } = req.body;
    const userId = req.user ? req.user._id : null; 

    const contents = [];
    if (history && Array.isArray(history)) {
      contents.push(...history);
    }

    const langMap = { 'en': 'English', 'am': 'Amharic', 'om': 'Afaan Oromo' };
    const targetLang = langMap[language] || language || 'English';
    
    let finalMessage = `[System Hint: The user's UI is in ${targetLang}. Reply in the language they speak to you, but default to ${targetLang} if ambiguous.]\n${message}`;

    contents.push({ role: "user", parts: [{ text: finalMessage }] });

    let result = await model.generateContent({ contents });
    let functionCalls = result.response.functionCalls();
    
    let iterations = 0;
    const MAX_ITERATIONS = 2;

    while (functionCalls && functionCalls.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;
      
      // Append the model's function call precisely as returned, preserving thought_signature
      contents.push({
        role: "model",
        parts: result.response.candidates[0].content.parts
      });

      const functionResponses = [];

      for (const call of functionCalls) {
        const functionName = call.name;
        const functionArgs = call.args;

        console.log(`[AI Tools] Gemini requested tool: ${functionName}`, functionArgs);

        let toolResponseData;
        try {
          if (toolExecutors[functionName]) {
            toolResponseData = await toolExecutors[functionName](functionArgs, userId);
          } else {
            toolResponseData = { error: `Function ${functionName} not found on server.` };
          }
        } catch (err) {
          console.error(`Error executing tool ${functionName}:`, err);
          toolResponseData = { error: err.message };
        }

        const formattedResponse = (typeof toolResponseData === 'object' && toolResponseData !== null && !Array.isArray(toolResponseData)) 
          ? toolResponseData 
          : { results: toolResponseData };

        const responsePart = {
          functionResponse: {
            name: functionName,
            response: formattedResponse
          }
        };
        if (call.id) {
          responsePart.functionResponse.id = call.id;
        }
        functionResponses.push(responsePart);
      }

      contents.push({ role: "user", parts: functionResponses });
      result = await model.generateContent({ contents });
      
      functionCalls = result.response.functionCalls();
    }

    let aiResponseText = "";
    try {
      aiResponseText = result.response.text();
    } catch(e) {
      aiResponseText = "I have fetched the information but was unable to generate a summary. Please ask again if needed.";
    }

    // Append the final model response to history
    contents.push({
      role: "model",
      parts: [{ text: aiResponseText }]
    });

    if (userId) {
      try {
        if(AILog && AILog.create) {
           await AILog.create({ user: userId, prompt: message, response: aiResponseText });
        }
      } catch (e) {}
    }

    res.json({
      success: true,
      data: {
        text: aiResponseText,
        history: contents,
      }
    });

  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ success: false, message: `AI Error: ${error.message}` });
  }
};

module.exports = { handleChatRequest };
