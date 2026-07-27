"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, User, Info } from "lucide-react";
import styles from "./Oracle.module.css";

const ELDER_RESPONSES: { [key: string]: string } = {
  // --- Governance & Law ---
  "masa": "The Masa is our sacred council of the elders. It is not a place for punishment, but a path to reconciliation. In the Masa, there are no losers, only the restored peace of the highland.",
  "illamo": "The Illamo is the heartbeat of our clans. It ensures that every family, from the highest ridge to the deepest valley, is cared for and supported by their brothers and sisters.",
  "sera": "Sera is the unwritten law that binds every Kambaata soul. It is older than memory, ensuring that we live in harmony with the land, our ancestors, and each other.",
  
  // --- History & Monarchies ---
  "hamlmal": "King Hamlmal (Hamo) was the progenitor of the Oyeta Clan. In the 16th century, he established the foundation of our monarchy, merging wisdom with absolute spiritual authority.",
  "woma": "The Woma represents the monarchical soul of Kambaata. For centuries, our kings governed from the sacred peaks, balancing royal decree with the democratic wisdom of the Masa elders.",
  "oyeta": "The Oyeta Clan is the royal lineage. To be Oyeta is to carry the responsibility of the Hambaricho legacy, ensuring the continuity of our spiritual and political identity.",
  
  // --- Geography & Location ---
  "durame": "Durame is the heart of our zone, standing proud at 2,101 meters above sea level. It is the administrative seat and a bustling center of highland trade and Kambaata hospitality.",
  "location": "We are situated in the Central Ethiopian Highlands, approximately 280km south of Addis Ababa. Bound by the volcanic 'Cereal Belt', our land is a sanctuary of enset and ancient hills.",
  "hambaricho": "Mount Hambaricho is our sacred peak, rising to 2,101 meters. Its 777 stairs are a path of endurance, leading to a summit where the spirit of Kambaata meets the sky.",
  "ajora": "The Ajora Twin Falls are nature's might on display. Two streams—Ajora and Soche—plunge 170 meters into a verdant canyon, marking the boundary of our ancestral lands.",
  
  // --- Culture & Culinary ---
  "bulla": "Bulla is the fine, nutrient-rich powder extracted from the core of the enset. It is our premium staple, served as a thick porridge (mucho) at our most honored cultural gatherings.",
  "kocho": "Kocho is our fermented treasure, a flatbread prepared from the enset with masterful patience. It is the food of endurance and the foundation of Kambaata food security.",
  "enset": "The Enset is our 'Tree of Life'. Managed with precision by the women of the highlands, it provides food, fiber, and shade, sustaining our society for generations.",
  "coffee": "The Kambaata coffee ceremony is a bond of friendship. From the first cup (abol) to the third (bereka), it is where stories are told and peace is made.",
  "gofeta": "Gofeta is the signature of the weaver. Every blue and maroon pattern in the heavy highland cotton is a thread of ancestral DNA, telling our story to the world.",
  
  // --- Events & Festivals ---
  "gifata": "Gifata is the Kambaata New Year, celebrated when the 'Y-shaped' star aligns. It is a season of reconciliation, shalla patriotic songs, and communal transition into a new era.",
  "meskel": "Meskel in the highlands is a spectacle of fire and song. We celebrate the finding of the Cross with communal bonfires (Demera) and folk songs that echo across the ridges.",
  "events": "Our calendar is defined by the rhythm of the highlands—from the grand Gifata transition and Meskel fires to the vibrant weekly market days in Durame.",
  "market": "Market days in Kambaata are not just for trade; they are social hubs where the highland masters meet to share news, textiles, and the latest harvest.",
  
  "default": "I hear your whisper. Ask me of the Woma Kings, the sacred Masa, the 777 stairs of Hambaricho, or the fine Bulla of our women, and I shall guide you."
};

const SUGGESTED_WHISPERS = [
  "Tell me about the Woma Kings",
  "What is the Masa council?",
  "Tell me about Gifata New Year",
  "Where is Durame located?",
  "What is the Tree of Life?",
  "Tell me about Ajora Falls"
];

const Oracle = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "elder", text: "Greetings, traveler. I am the voice of the highland elders. What heritage do you seek to understand?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (textOverride?: string) => {
    const messageText = textOverride || input;
    if (!messageText.trim()) return;

    const userMessage = { role: "user", text: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const lowerInput = messageText.toLowerCase();
      let responseText = ELDER_RESPONSES["default"];
      
      for (const key in ELDER_RESPONSES) {
        if (lowerInput.includes(key)) {
          responseText = ELDER_RESPONSES[key];
          break;
        }
      }

      setMessages((prev) => [...prev, { role: "elder", text: responseText }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating Trigger */}
      <motion.button
        className={styles.trigger}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
      >
        <div className={styles.pulse} />
        <Sparkles className="w-6 h-6" />
      </motion.button>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className={styles.oracleWindow}
          >
            <div className={styles.header}>
              <div className="flex items-center gap-3">
                <div className={styles.elderAvatar}>
                  <User className="w-5 h-5 text-[#D97706]" />
                </div>
                <div>
                  <h3 className="font-black text-[10px] uppercase tracking-widest text-[#145A41]">The Sera Oracle</h3>
                  <p className="text-[9px] text-[#145A41]/60 font-bold">Kambaata Heritage Authority</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#145A41]/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#145A41]" />
              </button>
            </div>

            <div className={styles.chatArea}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${styles.message} ${msg.role === "elder" ? styles.elderMsg : styles.userMsg}`}
                >
                  {msg.role === "elder" && (
                     <div className={styles.elderTag}>Whisper of the Elder</div>
                  )}
                  {msg.text}
                </motion.div>
              ))}
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={styles.typing}
                >
                  The Elder is reflecting on the oral traditions...
                </motion.div>
              )}
            </div>

            {/* Suggested Whispers Chips */}
            <div className={styles.whispersWrapper}>
              <div className={styles.whispersScroll}>
                {SUGGESTED_WHISPERS.map((whisper) => (
                  <button 
                    key={whisper}
                    onClick={() => handleSend(whisper)}
                    className={styles.whisperChip}
                  >
                    {whisper}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.inputArea}>
              <input
                type="text"
                placeholder="Seek heritage wisdom..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
              />
              <button onClick={() => handleSend()} className={styles.sendBtn}>
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            <div className={styles.oracleFooter}>
               <Info className="w-3 h-3" />
               Anchored in Kambaata 16th Century Legacies
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Oracle;
