"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle } from "lucide-react";

const FAQS = [
  {
    question: "When is the best time to visit Kambata?",
    answer: "The best time to visit is during the dry season from October to March. This period offers clear skies, pleasant temperatures, and the best visibility for the panoramic views from Mount Hambarcho."
  },
  {
    question: "Is it safe for solo travelers?",
    answer: "Absolutely! Kambata is known for its warm hospitality and safety. However, we highly recommend our certified local guides to help you navigate the high-altitude trails and cultural nuances."
  },
  {
    question: "What should I pack for the 777 Stairs?",
    answer: "Pack comfortable hiking shoes with good grip, a light jacket (it gets chilly at the peak), sun protection, and a camera. Our guides also provide water and local snacks."
  },
  {
    question: "Are there medical facilities in Durame?",
    answer: "Yes, Durame Town has a modern hospital and several pharmacies. For remote tours, our guides are trained in basic first aid and carry emergency communication equipment."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-gray-50/50 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          
          {/* Left: Content */}
          <div className="lg:w-1/3">
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-[10px] mb-4 block">Traveler Support</span>
            <h2 className="text-4xl md:text-5xl text-gray-900 font-heading mb-8">Frequently Asked <br /> Questions</h2>
            <p className="text-gray-500 leading-relaxed mb-10">
              Everything you need to know before stepping into the highlands. Can't find an answer? 
              <span className="text-primary font-bold cursor-pointer hover:underline ml-1">Contact our local team.</span>
            </p>
            <div className="p-8 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center gap-6">
               <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <HelpCircle className="w-6 h-6" />
               </div>
               <div>
                  <h4 className="font-bold text-gray-900">Need more help?</h4>
                  <p className="text-xs text-gray-500 mt-1">Chat available 24/7</p>
               </div>
            </div>
          </div>

          {/* Right: Accordion */}
          <div className="lg:w-2/3 w-full space-y-4">
            {FAQS.map((faq, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-white rounded-3xl border transition-all duration-300 ${openIndex === idx ? 'border-primary shadow-xl shadow-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <button 
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left"
                >
                  <span className={`font-bold transition-colors ${openIndex === idx ? 'text-primary' : 'text-gray-900'}`}>{faq.question}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${openIndex === idx ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {openIndex === idx ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>
                <AnimatePresence>
                  {openIndex === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-8 text-gray-500 leading-relaxed text-sm">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
