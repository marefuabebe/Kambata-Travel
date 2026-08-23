"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, X, Send, Loader2, Sparkles, User, Map, Briefcase, 
  Building, Calendar, CreditCard, Shield, Paperclip, Mic, Menu, 
  ChevronDown, Check, History, Moon, Sun, Plus, ChevronRight,
  TrendingUp, Clock, Compass, Navigation, Star
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/utils/apiClient";
import { useLanguage } from "@/context/LanguageContext";


interface Message {
  role: "user" | "model" | "function";
  parts: { text: string }[];
}

export default function EnterpriseChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Thinking...");
  const [history, setHistory] = useState<Message[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { language, setLanguage, t: globalT } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = {
    online: globalT('chatbot.online'),
    discover: globalT('chatbot.discover'),
    zone: globalT('chatbot.zone'),
    subtitle: globalT('chatbot.subtitle'),
    tryAsking: globalT('chatbot.tryAsking'),
    popularDestinations: globalT('chatbot.popularDestinations'),
    viewAll: globalT('chatbot.viewAll'),
    upcomingTours: globalT('chatbot.upcomingTours'),
    availableGuides: globalT('chatbot.availableGuides'),
    travelTip: globalT('chatbot.travelTip'),
    tipText: globalT('chatbot.tipText'),
    placeholder: globalT('chatbot.placeholder'),
    seatsLeft: globalT('chatbot.seatsLeft'),
    newConversation: globalT('chatbot.newConversation'),
    today: globalT('chatbot.today'),
    yesterday: globalT('chatbot.yesterday'),
    theme: globalT('chatbot.theme'),
    concierge: globalT('chatbot.concierge'),
    authenticated: globalT('chatbot.authenticated'),
    heroBtn1: globalT('chatbot.heroBtn1'),
    heroBtn2: globalT('chatbot.heroBtn2'),
    heroBtn3: globalT('chatbot.heroBtn3'),
    heroBtn4: globalT('chatbot.heroBtn4'),
    heroBtn5: globalT('chatbot.heroBtn5'),
    heroBtn6: globalT('chatbot.heroBtn6'),
    sug1: globalT('chatbot.sug1'), sug1p: globalT('chatbot.sug1p'),
    sug2: globalT('chatbot.sug2'), sug2p: globalT('chatbot.sug2p'),
    sug3: globalT('chatbot.sug3'), sug3p: globalT('chatbot.sug3p'),
    sug4: globalT('chatbot.sug4'), sug4p: globalT('chatbot.sug4p'),
    sug5: globalT('chatbot.sug5'), sug5p: globalT('chatbot.sug5p'),
    sug6: globalT('chatbot.sug6'), sug6p: globalT('chatbot.sug6p'),
    hist1: globalT('chatbot.hist1'),
    hist2: globalT('chatbot.hist2'),
    hist3: globalT('chatbot.hist3'),
    hist4: globalT('chatbot.hist4'),
    expertGuide: globalT('chatbot.expertGuide'),
    culturalGuide: globalT('chatbot.culturalGuide'),
    highlandTrekking: globalT('chatbot.highlandTrekking'),
    waterfall: globalT('chatbot.waterfall'),
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme as "light" | "dark");
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      }
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const suggestions = [
    { icon: Map, label: t.sug1, prompt: t.sug1p },
    { icon: Briefcase, label: t.sug2, prompt: t.sug2p },
    { icon: Building, label: t.sug3, prompt: t.sug3p },
    { icon: Calendar, label: t.sug4, prompt: t.sug4p },
    { icon: CreditCard, label: t.sug5, prompt: t.sug5p },
    { icon: Shield, label: t.sug6, prompt: t.sug6p }
  ];

  const [featuredTours, setFeaturedTours] = useState([
    { title: "Lalibela Rock Churches", duration: "3 Days", price: "$450" },
    { title: "Simien Mountains Trek", duration: "5 Days", price: "$780" }
  ]);

  const [popularDestinations, setPopularDestinations] = useState([
    { title: "Woshwosha Waterfall", location: "Durame", desc: "The highest waterfall in Kambata Zone.", rating: "4.8 (128)", img: "https://images.unsplash.com/photo-1546853020-caa2b09a4a47?auto=format&fit=crop&q=80&w=400" },
    { title: "Alemgono Cultural Village", location: "Alemgono", desc: "Experience the rich culture, traditions and lifestyle.", rating: "4.7 (96)", img: "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&q=80&w=400" },
    { title: "Mudula Highlands", location: "Dembi Dollo", desc: "Breathtaking highlands with amazing landscapes.", rating: "4.6 (74)", img: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&q=80&w=400" },
    { title: "Kambata Coffee Experience", location: "Agaro", desc: "Taste and learn the art of traditional coffee.", rating: "4.9 (53)", img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=400" },
  ]);

  const [upcomingToursList, setUpcomingToursList] = useState([
    { title: "Cultural Heritage Tour", date: "May 24, 2025", seats: "8 Seats Left", img: "https://images.unsplash.com/photo-1523805009056-1d1fc4fce571?auto=format&fit=crop&q=80&w=100" },
    { title: "Waterfall Adventure", date: "May 26, 2025", seats: "6 Seats Left", img: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&q=80&w=100" },
    { title: "Village Experience", date: "May 28, 2025", seats: "5 Seats Left", img: "https://images.unsplash.com/photo-1533222481259-ce20eda1e20b?auto=format&fit=crop&q=80&w=100" },
  ]);

  const [availableGuides, setAvailableGuides] = useState([
    { name: "Alemayehu D.", role: "Cultural Guide", rating: "4.9 (42)", img: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=100" },
    { name: "Meseret T.", role: "Nature Guide", rating: "4.8 (37)", img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=100" },
    { name: "Teshome G.", role: "Adventure Guide", rating: "4.9 (29)", img: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=100" },
  ]);

  const [rawDests, setRawDests] = useState<any[]>([]);
  const [rawTours, setRawTours] = useState<any[]>([]);
  const [rawGuides, setRawGuides] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [toursRes, destsRes, guidesRes] = await Promise.all([
          apiClient.get('/tours?limit=3&sort=-ratingsAverage'),
          apiClient.get('/destinations?limit=4'),
          apiClient.get('/guides/public?limit=3')
        ]);

        if (toursRes.data?.data) setRawTours(toursRes.data.data);
        if (destsRes.data?.data) setRawDests(destsRes.data.data);
        if (guidesRes.data?.data) setRawGuides(guidesRes.data.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const langCode = language;

    if (rawTours.length > 0) {
      setUpcomingToursList(rawTours.map((tour: any) => {
        let fallbackTitle = tour.title?.en || tour.title;
        if (fallbackTitle === "The Majestic Doje'e Waterfall") fallbackTitle = t.waterfall || fallbackTitle;
        return {
          title: tour.title?.[langCode] || fallbackTitle,
          date: new Date(tour.startDates?.[0] || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          seats: (tour.maxGroupSize && !isNaN(Number(tour.maxGroupSize))) ? `${Math.max(0, Number(tour.maxGroupSize) - Number(tour.currentGroupSize || 0))} ${t.seatsLeft}` : "Available",
          img: tour.images?.[0] || "https://images.unsplash.com/photo-1523805009056-1d1fc4fce571?auto=format&fit=crop&q=80&w=100"
        };
      }));
    }

    if (rawDests.length > 0) {
      setPopularDestinations(rawDests.map((d: any) => ({
        title: d.name?.[langCode] || d.name?.en || d.name,
        location: d.location?.woreda || "Kambata",
        desc: d.description?.[langCode] || d.description?.en || d.description || "",
        rating: (d.rating?.numReviews > 0 && d.rating?.average) ? `${d.rating.average} (${d.rating.numReviews})` : "New",
        img: d.images?.[0] || d.gallery?.[0] || "https://images.unsplash.com/photo-1546853020-caa2b09a4a47?auto=format&fit=crop&q=80&w=400"
      })));
    }

    if (rawGuides.length > 0) {
      setAvailableGuides(rawGuides.map((g: any) => {
        let rawName = g.user?.name || "Expert Guide";
        if (rawName === "Expert Guide") rawName = t.expertGuide || rawName;

        let rawRole = g.specialties?.[0] || "Cultural Guide";
        if (rawRole === "Cultural Guide") rawRole = t.culturalGuide || rawRole;
        if (rawRole === "Highland Trekking") rawRole = t.highlandTrekking || rawRole;

        return {
          name: rawName,
          role: rawRole,
          rating: `${g.stats?.rating || 4.8} (${g.stats?.totalTours || 0})`,
          img: g.user?.profilePicture || "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=100"
        };
      }));
    }
  }, [rawTours, rawDests, rawGuides, language]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    
    if (isLoading) {
      const texts = ["Searching database...", "Checking live schedules...", "Finding availability..."];
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % texts.length;
        setLoadingText(texts[i]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: "user", parts: [{ text }] };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/aichat", {
        message: text,
        history: history,
        language: language
      });

      if (response.data.success) {
        const aiMessage: Message = { 
          role: "model", 
          parts: [{ text: response.data.data.text }] 
        };
        setMessages(prev => [...prev, aiMessage]);
        if (response.data.data.history) {
          setHistory(response.data.data.history);
        }
      } else {
        const errorMessage: Message = { 
          role: "model", 
          parts: [{ text: response.data.message || "An unexpected error occurred with the AI service." }] 
        };
        setMessages(prev => [...prev, errorMessage]);
      }

    } catch (error: any) {
      console.error("Chat error:", error);
      let errText = "I apologize, but I am currently unable to connect to the server. Please try again later.";
      
      const rawMsg = error.response?.data?.message || "";
      if (rawMsg.includes("429 Too Many Requests") || rawMsg.includes("Quota exceeded")) {
        errText = "I apologize, but the AI service is currently experiencing high traffic (Rate Limit Exceeded). Please try again in a few moments.";
      }
      
      const errorMessage: Message = { 
        role: "model", 
        parts: [{ text: errText }] 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const markdownComponents = {
    a: ({ ...props }) => (
      <a {...props} className="inline-block bg-[#0F766E] hover:bg-[#0d645e] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors mt-2 mb-1 no-underline shadow-[0_4px_14px_0_rgba(15,118,110,0.39)] hover:shadow-[0_6px_20px_rgba(15,118,110,0.23)] hover:-translate-y-0.5" target="_blank" rel="noopener noreferrer" />
    ),
    ul: ({ ...props }) => (
      <ul {...props} className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5 list-none pl-0" />
    ),
    li: ({ ...props }) => (
      <li {...props} className="bg-white/70 dark:bg-[#0A0F1C] backdrop-blur-xl border border-gray-200/60 dark:border-slate-700/60 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all m-0 flex flex-col gap-2 relative overflow-hidden" />
    ),
    strong: ({ ...props }) => (
      <strong {...props} className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight block mb-1" />
    ),
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            drag
            dragMomentum={false}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            whileDrag={{ scale: 1.1, cursor: "grabbing" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onDoubleClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-br from-[#0F766E] to-emerald-600 text-white shadow-[0_10px_40px_rgba(15,118,110,0.4)] flex items-center justify-center border border-white/20 group cursor-grab touch-none"
          >
            <Sparkles size={20} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse pointer-events-none" />
            <MessageSquare size={28} className="group-hover:rotate-12 transition-transform duration-300 pointer-events-none" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10000] hidden sm:block"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.4, type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed inset-0 sm:inset-auto sm:top-[5vh] sm:left-[5vw] sm:right-[5vw] sm:bottom-[5vh] z-[10001] flex rounded-none sm:rounded-2xl shadow-[0_30px_100px_-15px_rgba(0,0,0,0.6)] overflow-hidden border border-gray-200 dark:border-slate-700/80 ${theme === 'dark' ? 'dark' : ''}`}
            >
            {/* Slimmer Sidebar */}
            <div className={`w-1/5 min-w-[240px] max-w-[280px] bg-[#0F172A] text-slate-300 flex-col border-r border-slate-800 shrink-0 hidden md:flex`}>
              <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0F766E] to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-[#0F766E]/20">
                  <Map size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold tracking-wide text-[15px]">KAMBATA</h2>
                  <p className="text-[10px] tracking-[0.2em] text-[#0F766E] uppercase font-bold">{t.concierge}</p>
                </div>
              </div>
              
              <div className="px-5 mb-8">
                <button 
                  onClick={() => { setMessages([]); setHistory([]); }}
                  className="w-full bg-[#0A0F1C] hover:bg-[#0A0F1C] text-white border border-slate-700/50 rounded-xl py-2.5 flex items-center justify-center gap-2 font-semibold text-sm transition-all hover:shadow-md active:scale-95 shadow-sm"
                >
                  <Plus size={16} /> {t.newConversation}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 space-y-8 custom-scrollbar">
                <div>
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">{t.today}</h3>
                  <div className="space-y-0.5">
                    <button className="w-full text-left px-3 py-2.5 rounded-xl bg-[#0A0F1C] text-slate-200 text-sm truncate font-medium shadow-sm">{t.hist1}</button>
                    <button className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#0A0F1C] text-slate-400 text-sm truncate transition-colors">{t.hist2}</button>
                  </div>
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">{t.yesterday}</h3>
                  <div className="space-y-0.5">
                    <button className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#0A0F1C] text-slate-400 text-sm truncate transition-colors">{t.hist3}</button>
                    <button className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#0A0F1C] text-slate-400 text-sm truncate transition-colors">{t.hist4}</button>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-800/50 bg-[#0F172A]">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0F1C] hover:bg-[#0A0F1C] cursor-pointer transition-all mb-5 border border-slate-800/50 hover:shadow-md">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <User size={20} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-sm font-semibold text-white truncate">Premium User</h4>
                    <p className="text-[11px] text-[#0F766E] font-semibold tracking-wide">{t.authenticated}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                    {theme === 'dark' ? <Moon size={14}/> : <Sun size={14}/>} {t.theme}
                  </span>
                  <button 
                    onClick={toggleTheme}
                    className={`w-11 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-[#0F766E]' : 'bg-slate-600'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${theme === 'dark' ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] relative">
              
              {/* Header */}
              <div className="h-16 border-b border-gray-200/80 dark:border-slate-800/80 flex items-center justify-between px-4 sm:px-6 bg-white/70 dark:bg-[#0B1120]/70 backdrop-blur-xl shrink-0 relative z-50">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <Menu size={20} />
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative border border-gray-200 dark:border-slate-700 shadow-sm">
                    <Sparkles size={18} className="text-[#0F766E]" />
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[2.5px] border-white dark:border-[#0B1120] animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight tracking-tight">Kambata AI</h3>
                    <p className="text-[11px] text-[#0F766E] font-bold flex items-center gap-1 tracking-wide">
                      {t.online}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="relative hidden sm:block">
                    <button 
                      onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#0A0F1C] px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md"
                    >
                      {language} <ChevronDown size={14} />
                    </button>
                    <AnimatePresence>
                    {showLanguageMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-10 right-0 w-32 bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-20"
                      >
                        {["en", "am"].map(lang => (
                          <button
                            key={lang}
                            onClick={() => { setLanguage(lang as 'en'|'am'); setShowLanguageMenu(false); }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${
                              language === lang ? "text-[#0F766E] dark:text-[#2DD4BF] bg-gray-50 dark:bg-[#0A0F1C]" : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {lang === 'en' ? 'English' : 'Amharic'}
                          </button>
                        ))}
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                  <button onClick={toggleTheme} className="p-2.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors sm:hidden">
                    {theme === 'dark' ? <Moon size={20}/> : <Sun size={20}/>}
                  </button>
                  <button onClick={() => setIsOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-[#0A0F1C] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scroll-smooth custom-scrollbar">
                {messages.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col w-full max-w-6xl mx-auto space-y-8 pb-32"
                  >
                    {/* Hero Section */}
                    <div className="relative w-full h-auto py-10 pb-16 sm:py-12 sm:min-h-[320px] rounded-3xl overflow-hidden shadow-2xl flex items-center">
                      <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782475068/image_9b4c8c3c_h0jt96.png" alt="Kambata Waterfall" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-br sm:bg-gradient-to-r from-[#0B1120]/95 via-[#0B1120]/80 to-[#0B1120]/60"></div>
                      
                      <div className="relative z-10 w-full px-5 sm:px-12 flex flex-col md:flex-row justify-between items-center gap-8 sm:gap-8">
                        <div className="text-center md:text-left md:w-1/2 pt-2 sm:pt-0">
                          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-2 tracking-tight">{t.discover}</h1>
                          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#2DD4BF] mb-2 sm:mb-4 flex items-center justify-center md:justify-start gap-2 sm:gap-3">
                            {t.zone} <Sparkles size={24} className="sm:w-7 sm:h-7" />
                          </h2>
                          <p className="text-slate-300 text-sm sm:text-lg leading-relaxed max-w-md mx-auto md:mx-0">
                            {t.subtitle}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3 w-full md:w-1/2 mx-auto md:max-w-none pb-2">
                          {[
                            { icon: Map, label: t.heroBtn1 },
                            { icon: Navigation, label: t.heroBtn2 },
                            { icon: Briefcase, label: t.heroBtn3 },
                            { icon: User, label: t.heroBtn4 },
                            { icon: Calendar, label: t.heroBtn5 },
                            { icon: Compass, label: t.heroBtn6 },
                          ].map((item, i) => (
                            <button key={i} className="bg-[#0A0F1C] hover:bg-[#0A0F1C] backdrop-blur-md border border-slate-500/50 rounded-xl p-1.5 sm:p-3 flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all hover:scale-[1.03] hover:border-[#2DD4BF]/50 group text-center min-h-[3.5rem] sm:min-h-[5.5rem]">
                              <item.icon size={14} className="text-[#2DD4BF] group-hover:text-emerald-300 sm:w-[20px] sm:h-[20px]" />
                              <span className="text-[8px] sm:text-xs font-bold text-white whitespace-pre-line leading-tight">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Prompts Row */}
                    <div className="w-full">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 ml-2">{t.tryAsking}</h3>
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
                        {suggestions.slice(0, 4).map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(item.prompt)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-[#131B2C] border border-gray-200 dark:border-slate-800 hover:border-[#0F766E] dark:hover:border-[#0F766E] text-slate-700 dark:text-slate-300 text-sm font-medium transition-all hover:shadow-md"
                          >
                            <item.icon size={16} className="text-[#0F766E]" />
                            {item.prompt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Main Layout Split */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left Column: Popular Destinations */}
                      <div className="lg:col-span-8">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.popularDestinations}</h3>
                          <button className="text-sm font-bold text-[#0F766E] hover:text-[#0d645e]">{t.viewAll}</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {popularDestinations.map((dest, i) => (
                            <div key={i} className="bg-white dark:bg-[#131B2C] rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#0F766E]/50 transition-all group flex flex-col cursor-pointer">
                              <div className="h-40 w-full overflow-hidden relative">
                                <img src={dest.img} alt={dest.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute top-3 left-3 bg-[#0B1120]/80 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 text-[10px] font-bold text-white">
                                  <Map size={10} className="text-[#2DD4BF]" /> {dest.location}
                                </div>
                              </div>
                              <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-1">{dest.title}</h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{dest.desc}</p>
                                </div>
                                <div className="flex items-center justify-between mt-auto">
                                  <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                                    <Star size={12} className="inline fill-current text-yellow-500 mr-0.5" /> {dest.rating}
                                  </div>
                                  <button className="bg-[#0F766E]/10 text-[#0F766E] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#0F766E] hover:text-white transition-colors">
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Column: Widgets */}
                      <div className="lg:col-span-4 space-y-6">
                        {/* Upcoming Tours */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t.upcomingTours}</h3>
                            <button className="text-[11px] font-bold text-[#0F766E]">{t.viewAll}</button>
                          </div>
                          <div className="space-y-2">
                            {upcomingToursList.map((tour, i) => (
                              <div key={i} className="flex items-center gap-3 bg-white dark:bg-[#131B2C] p-2.5 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-[#0F766E]/30 cursor-pointer transition-colors group">
                                <img src={tour.img} alt={tour.title} className="w-10 h-10 rounded-xl object-cover" />
                                <div className="flex-1">
                                  <h4 className="text-[13px] font-bold text-gray-900 dark:text-white group-hover:text-[#0F766E] transition-colors line-clamp-1">{tour.title}</h4>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    <span>{tour.date}</span>
                                    <span>•</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{tour.seats}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Available Guides */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t.availableGuides}</h3>
                            <button className="text-[11px] font-bold text-[#0F766E]">{t.viewAll}</button>
                          </div>
                          <div className="space-y-2">
                            {availableGuides.map((guide, i) => (
                              <div key={i} className="flex items-center gap-3 bg-white dark:bg-[#131B2C] p-2.5 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-[#0F766E]/30 cursor-pointer transition-colors">
                                <img src={guide.img} alt={guide.name} className="w-10 h-10 rounded-full object-cover border-2 border-[#131B2C] shadow-sm" />
                                <div className="flex-1">
                                  <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">{guide.name}</h4>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{guide.role}</p>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                                  <Star size={12} className="inline fill-current text-yellow-500 mr-0.5" /> {guide.rating}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Travel Tip */}
                        <div className="bg-gradient-to-br from-[#1E293B] to-[#0B1120] rounded-2xl p-4 border border-slate-700 relative overflow-hidden mt-6">
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sun size={60} />
                          </div>
                          <h3 className="text-sm font-bold text-white mb-1.5 relative z-10 flex items-center gap-2">
                            <Sparkles size={14} className="text-[#2DD4BF]" /> {t.travelTip}
                          </h3>
                          <p className="text-xs text-slate-300 leading-relaxed relative z-10">
                            {t.tipText}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {messages.map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx} 
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} group max-w-5xl mx-auto`}
                  >
                    {msg.role === "model" && (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 flex items-center justify-center shrink-0 mr-4 mt-1 shadow-sm">
                        <Sparkles size={18} className="text-[#0F766E]" />
                      </div>
                    )}
                    
                    <div className={`max-w-[85%] sm:max-w-[80%] rounded-3xl px-6 py-5 text-[15px] leading-relaxed shadow-sm ${
                      msg.role === "user" 
                        ? "bg-gradient-to-br from-[#0F766E] to-emerald-600 text-white rounded-tr-sm shadow-md shadow-[#0F766E]/20 font-medium" 
                        : "bg-white/80 dark:bg-[#0A0F1C] backdrop-blur-xl border border-gray-200/80 dark:border-slate-700/80 text-gray-800 dark:text-gray-100 rounded-tl-sm shadow-xl shadow-slate-200/20 dark:shadow-none"
                    }`}>
                      {msg.role === "model" ? (
                        <div className="prose prose-slate sm:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-a:text-[#0F766E]">
                          <ReactMarkdown components={markdownComponents}>{msg.parts[0].text}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.parts[0].text
                      )}
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start max-w-5xl mx-auto"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 flex items-center justify-center shrink-0 mr-4 mt-1 shadow-sm">
                      <Sparkles size={18} className="text-[#0F766E]" />
                    </div>
                    <div className="bg-white/80 dark:bg-[#0A0F1C] backdrop-blur-xl border border-gray-200/80 dark:border-slate-700/80 rounded-3xl rounded-tl-sm px-6 py-5 shadow-xl min-w-[240px]">
                      <div className="flex items-center gap-3 mb-3">
                        <Loader2 size={16} className="animate-spin text-[#0F766E]" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{loadingText}</span>
                      </div>
                      <div className="flex gap-1.5 ml-7">
                        <div className="w-2 h-2 bg-[#0F766E]/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-[#0F766E]/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-[#0F766E]/60 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {messages.length > 0 && <div ref={messagesEndRef} className="h-32" />}
              </div>

              {/* Bottom Input Area */}
              <div className="shrink-0 w-full bg-[#F8FAFC] dark:bg-[#0B1120] pt-2 pb-6 px-4 sm:px-6 z-20">
                
                {/* Input Field */}
                <div className="relative max-w-4xl mx-auto">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                    className="relative flex items-center bg-white dark:bg-[#0A0F1C] border border-gray-200 dark:border-slate-700 rounded-2xl p-1.5 transition-all shadow-xl shadow-slate-200/50 dark:shadow-none focus-within:shadow-[0_8px_30px_rgb(15,118,110,0.15)] focus-within:border-[#0F766E] focus-within:ring-1 focus-within:ring-[#0F766E]"
                  >
                    <button type="button" className="p-3.5 text-slate-400 hover:text-[#0F766E] transition-colors shrink-0">
                      <Paperclip size={20} />
                    </button>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={t.placeholder}
                      className="flex-1 bg-transparent border-none px-2 py-4 text-[15px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-0 placeholder-slate-400/80"
                      disabled={isLoading}
                    />
                    <button type="button" className="p-3.5 text-slate-400 hover:text-[#0F766E] transition-colors shrink-0 hidden sm:block">
                      <Mic size={20} />
                    </button>
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="ml-1 w-12 h-12 rounded-xl bg-gradient-to-br from-[#0F766E] to-emerald-600 text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0d645e] transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-[#0F766E]/30"
                    >
                      <Send size={18} className="ml-1" />
                    </button>
                  </form>
                  <div className="text-center mt-4 flex justify-center items-center gap-2">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold tracking-wide">
                      Kambata AI can make mistakes. Consider verifying important information.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}} />
    </>
  );
}
