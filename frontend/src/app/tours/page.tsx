"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, Clock, MapPin, Heart, Users, ChevronDown, SlidersHorizontal, ShieldCheck, Tag, Headphones, Target, ArrowRight, Eye } from "lucide-react";
import apiClient from "@/utils/apiClient";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import { useLanguage } from "@/context/LanguageContext";
import Hotels from "@/components/home/Hotels";
import homeStyles from "@/app/Home.module.css";
// ── Countdown Timer Component ──
const CountdownTimer = ({ t }: { t: any }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 95,
    hours: 22,
    minutes: 24,
    seconds: 57
  });

  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 95);
    targetDate.setHours(targetDate.getHours() + 22);
    targetDate.setMinutes(targetDate.getMinutes() + 24);
    targetDate.setSeconds(targetDate.getSeconds() + 57);

    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const FlipBox = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative bg-[#2a2a2a] rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-[#1a1a1a] w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center overflow-hidden">
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[#1a1a1a] z-20 shadow-inner translate-y-[-50%]" />
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent z-0" />
        
        <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-white relative z-10" style={{ fontFamily: "monospace" }}>
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-[#F4A261] text-[10px] md:text-xs font-bold mt-4 tracking-[0.2em] uppercase">{label}</span>
    </div>
  );

  return (
    <section className="bg-[#181818] py-24 flex flex-col items-center justify-center text-center">
      <h2 className="text-white text-2xl md:text-3xl font-bold tracking-[0.2em] mb-3">{t("toursPage.comingSoon")}</h2>
      <h3 className="text-[#F4A261] text-sm md:text-base font-bold tracking-[0.15em] mb-12">{t("toursPage.masalaFestival")}</h3>
      
      <div className="flex items-center gap-3 md:gap-5">
        <FlipBox value={timeLeft.days} label={t("toursPage.days")} />
        <FlipBox value={timeLeft.hours} label={t("toursPage.hours")} />
        <FlipBox value={timeLeft.minutes} label={t("toursPage.minutes")} />
        <FlipBox value={timeLeft.seconds} label={t("toursPage.seconds")} />
      </div>
    </section>
  );
};

const categories = ["All Categories", "Adventure", "Culture", "Nature", "Relax", "Heritage", "Hiking"];
const districts = ["All Districts", "Dara", "Tembaro", "Damboya", "Kachabira", "Kediida Gamela"];
const travelers = ["Any Travelers", "1-2", "3-5", "6-10", "10+"];
const sortOptions = ["Popular", "Newest", "Price: Low to High", "Price: High to Low"];

const ToursPageContent = () => {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();
  const [tours, setTours] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "All Categories");
  const [activeDistrict, setActiveDistrict] = useState(searchParams.get("district") || "All Districts");
  const [activeExperience, setActiveExperience] = useState(searchParams.get("experience") || "All Experiences");
  const [activeDuration, setActiveDuration] = useState(searchParams.get("duration") || "Any Duration");
  const [activeTravelers, setActiveTravelers] = useState("Any Travelers");
  const [sort, setSort] = useState("Popular");
  
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    fetchTours();
  }, [activeCategory, activeDistrict, activeExperience, activeDuration, sort, page]); // re-fetch when these change

  const fetchTours = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12, lang: "en" };
      if (activeCategory !== "All Categories") params.category = activeCategory;
      if (activeDistrict !== "All Districts") params.district = activeDistrict;
      if (activeExperience !== "All Experiences") params.experience = activeExperience;
      if (activeDuration !== "Any Duration") params.duration = activeDuration;
      if (keyword) params.keyword = keyword;
      
      if (sort === "Popular") params.sort = "popularity";
      else if (sort === "Newest") params.sort = "-createdAt";
      else if (sort === "Price: Low to High") params.sort = "price";
      else if (sort === "Price: High to Low") params.sort = "-price";
      
      const [resTours, resPackages] = await Promise.all([
        apiClient.get("/tours", { params }),
        apiClient.get("/packages", { params })
      ]);
      if (resTours.data.success) {
        setTours(resTours.data.data);
        setPagination(resTours.data.pagination || { total: resTours.data.data.length, pages: 1 });
      }
      if (resPackages.data.success) {
        setPackages(resPackages.data.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTours();
  };

  const formatDuration = (dur: any) => {
    if (!dur) return "—";
    if (typeof dur === "string") return dur;
    return `${dur.value} ${dur.unit}`;
  };

  const getTourDescription = (tour: any) => {
    const destName = String(tour.hotel?.location?.city || tour.destination?.name?.[language] || tour.destination?.name?.en || tour.destination?.name || "").toLowerCase();
    const title = String(tour.name?.[language] || tour.name?.en || tour.title?.[language] || tour.title?.en || tour.title || "").toLowerCase();
    
    // Check if there is a real description in the DB that is actually a descriptive sentence
    // and not just a copy of the title.
    const dbDesc = tour.description?.[language] || tour.description?.en || tour.description || tour.shortDescription?.[language] || tour.shortDescription?.en || tour.shortDescription;
    if (dbDesc && dbDesc.length > title.length + 10) {
        return dbDesc;
    }
    
    // Fallbacks if no valid DB description is found
    if (destName.includes("sarobira") || title.includes("sarobira")) {
      return language === 'am' ? "በለምለሙ የሳሮቢራ ደጋማ ቦታዎች ላይ የማይረሳ የእግር ጉዞ ያድርጉ። ጥንታዊውን የእርከን እርሻን ያግኙ፣ እና በሚያማምሩ አረንጓዴ ኮረብታዎች ላይ ተፈጥሮን ያጣጥሙ።" : "Embark on an unforgettable trek through the lush Sarobira Highlands. Discover ancient terraced farming, immerse yourself in untouched nature, and capture spectacular panoramic photos of the rolling emerald hills.";
    }
    if (destName.includes("durame") || title.includes("durame")) {
      return language === 'am' ? "በዱራሜ ከተማ ውስጥ የከምባታን ባህል ይወቁ። በቅዳሜ ገበያ ይገበያዩ፣ የኢትዮጵያን የቡና ስነ-ስርዓት ያጣጥሙ እና የአካባቢውን ማህበረሰብ ሞቅ ያለ አቀባበል ይለማመዱ።" : "Dive into the vibrant heart of Kambata in Durame Town. Wander through bustling local markets, savor authentic Ethiopian coffee ceremonies, and experience the warm, welcoming culture of the local community.";
    }
    if (destName.includes("hambarcho") || title.includes("hambarcho")) {
      return language === 'am' ? "በታዋቂው የሀምበሪቾ ተራራ ላይ ይውጡ። ይህ አስደሳች የእግር ጉዞ የታላቁን ስምጥ ሸለቆ እይታን እና እውነተኛ ስኬትን ያጎናጽፍዎታል።" : "Conquer the legendary Mount Hambarcho, Kambata's most iconic peak. This thrilling ascent rewards you with breathtaking 360-degree views of the Great Rift Valley and a sense of true accomplishment.";
    }
    if (destName.includes("ajora") || title.includes("ajora") || destName.includes("dara") || title.includes("waterfall")) {
      return language === 'am' ? "በጥልቅ ሸለቆ ውስጥ የሚወርደውን የአጆራ መንታ ፏፏቴዎችን አስደናቂ ኃይል ይመልከቱ። ለመዝናናት፣ ተፈጥሮን ለማድነቅ እና ፎቶ ለማንሳት ምቹ ቦታ።" : "Witness the awe-inspiring power of the twin Ajora Falls as they plunge dramatically into a deep gorge. A magnificent natural wonder perfect for sightseeing, relaxation, and connecting with nature.";
    }
    if (title.includes("gamosha") || title.includes("hot spring")) {
      return language === 'am' ? "በጋሞሻ ፍል ውሃ ውስጥ ዘና ይበሉ። በተፈጥሮ የተከበበ ይህ ቦታ ከከምባታ ተራራ የእግር ጉዞ በኋላ ለጤና እና ለመዝናናት ተስማሚ ነው።" : "Relax and rejuvenate in the healing, natural thermal waters of Gamosha Hot Spring. Surrounded by peaceful nature, it is the perfect spot for wellness and relaxation after a long trek in the Kambata highlands.";
    }
    if (tour.category === "Heritage" || tour.category === "Culture") {
      return language === 'am' ? "የከምባታን ታሪካዊ ቅርሶች፣ ጥንታዊ የዕደ-ጥበብ ስራዎች እና ሐውልቶች በማሰስ የባህል ጉዞ ያድርጉ።" : "Step back in time to explore ancient heritage sites, traditional crafts, and historical monuments that define the rich legacy of Kambata.";
    }
    if (tour.category === "Adventure" || tour.category === "Nature") {
      return language === 'am' ? "በኢትዮጵያ ደጋማ ቦታዎች እና ሸለቆዎች ውስጥ የማይረሳ የውጪ ጀብዱ ይጠብቅዎታል።" : "An unforgettable outdoor adventure awaits you through the hidden natural wonders, valleys, and untamed beauty of the Ethiopian highlands.";
    }
    
    return t("toursPage.exploreBeauty");
  };

  const getTranslatedTitle = (tour: any) => {
    const name = tour.name || tour.title;
    const titleMap: Record<string, string> = {
      "Gamosha Hot Spring Retreat": "የጋሞሻ ሙቅ ውሃ መዝናኛ",
      "The Gamasha Hot Springs": "የጋሞሻ ሙቅ ውሃ መዝናኛ",
      "The Majestic Doje'e Waterfall": "ታላቁ የዶጄ ፏፏቴ",
      "Durame Town": "ዱራሜ ከተማ",
      "Mount Hambarcho": "ሀምበሪቾ ተራራ",
      "Sarobira Highlands": "ሳሮቢራ ደጋማ ቦታዎች",
      "Ajora Falls": "አጆራ ፏፏቴ",
      "Mount Hambaricho": "ሀምበሪቾ ተራራ",
      "Damboya Highlands": "ዳምቦያ ደጋማ ቦታዎች",
      "Sarobira Valley": "ሳሮቢራ ሸለቆ",
      "Kambata Village": "ከምባታ መንደር",
      "Wanchi Crater Lake": "ወንጪ ሀይቅ",
      "Durame Saturday Market": "የዱራሜ ቅዳሜ ገበያ"
    };
    if (language === 'am') return name?.am || titleMap[name?.en || name] || name?.en || name;
    return name?.en || name;
  };

  const getTranslatedCategory = (tour: any) => {
    let cat = tour.category?.en || tour.category || tour.tour?.category?.en || tour.tour?.category || "Package";
    if (language === 'am') return tour.category?.am || tour.tour?.category?.am || t(`toursPage.categories.${cat}`) || cat;
    return cat;
  };

  const getTranslatedLocation = (tour: any) => {
    const loc = tour.hotel?.location?.city || tour.destination?.name?.en || tour.destination?.name || "Kambata District";
    const locMap: Record<string, string> = {
      "Mount Hambarcho": "ሀምበሪቾ ተራራ",
      "Ajora Falls": "አጆራ ፏፏቴ",
      "Durame Town": "ዱራሜ ከተማ",
      "Sarobira Highlands": "ሳሮቢራ ደጋማ ቦታዎች",
      "Kambata Village": "ከምባታ መንደር",
      "Wanchi Crater Lake": "ወንጪ ሀይቅ",
      "Durame Saturday Market": "የዱራሜ ቅዳሜ ገበያ",
      "The Gamasha Hot Springs": "የጋሞሻ ሙቅ ውሃ",
      "Gamosha Hot Spring Retreat": "የጋሞሻ ሙቅ ውሃ",
      "The Majestic Doje'e Waterfall": "ታላቁ የዶጄ ፏፏቴ",
      "Kambata District": "ከምባታ ወረዳ"
    };
    if (language === 'am') return tour.destination?.name?.am || locMap[loc] || loc;
    return loc;
  };

  const renderCard = (tour: any, idx: number, isPackage = false) => (
    <motion.div
      key={tour._id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: idx * 0.05, duration: 0.4 }}
      className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col group hover:-translate-y-1 hover:shadow-[0_12px_30px_rgb(0,0,0,0.08)] transition-all duration-300"
    >
      {/* Card Image area */}
      <div className="relative w-full aspect-[16/9] overflow-hidden shrink-0">
        <img 
          src={tour.images?.[0] || tour.tour?.images?.[0] || tour.hotel?.images?.[0] || "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037994/kambata/xbsw2ajsabbtz4tuwjvl.jpg"} 
          alt={getTranslatedTitle(tour) || "Tour image"} 
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <div className="bg-white px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-black text-gray-800">
              {(!tour.rating?.average || Number.isNaN(Number(tour.rating?.average))) ? "5.0" : Number(tour.rating.average).toFixed(1)}
            </span>
          </div>
          <div className="bg-[#112A22]/90 backdrop-blur-md px-2.5 py-1 rounded-md text-white shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider">{getTranslatedCategory(tour)}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex flex-col flex-1 relative">
        {/* District & Heart */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1 text-gray-400">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider font-bold">
              {getTranslatedLocation(tour)}
            </span>
          </div>
          <button className="text-gray-300 hover:text-red-500 transition-colors bg-white rounded-full p-1 -mr-1 -mt-1">
            <Heart className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-lg font-black text-gray-900 mb-2 line-clamp-1 group-hover:text-[#112A22] transition-colors">
          {getTranslatedTitle(tour)}
        </h3>
        
        <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-4 flex-1">
          {getTourDescription(tour)}
        </p>

        <div className="flex items-end justify-between pt-4 border-t border-gray-50 mb-5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">{formatDuration(tour.duration)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">1-10</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-[#112A22] leading-none">${(tour.basePrice || tour.price || 0).toFixed(0)}</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{language === 'am' ? "በሰው" : "per person"}</p>
          </div>
        </div>

        <div className="flex gap-2.5">
          <Link href={`/explorer-dashboard/explore-tours/${tour._id}`} className="flex-1">
            <button className="w-full bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs shadow-sm hover:shadow-md">
              <Eye className="w-4 h-4" /> {language === 'am' ? "ዝርዝሮች" : "Details"}
            </button>
          </Link>
          <Link href={`/checkout/${tour._id}`} className="flex-[1.5]">
            <button className="w-full bg-[#112A22] hover:bg-[#0a1a15] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all group/btn text-xs shadow-sm hover:shadow-md">
              {language === 'am' ? "አሁን ይያዙ" : "Book Now"} <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col font-sans">
      <Header theme="dark" />

      <main className="flex-1">
        {/* ── Hero Banner ── */}
        <section className="relative h-[85vh] min-h-[600px] flex flex-col justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782038014/kambata/ibdkyyuqop0vx0zjvukw.jpg" 
              alt="Kambata Tours" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>
          
           <div className="container mx-auto px-6 relative z-10 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl flex flex-col items-center mx-auto"
            >
              <style dangerouslySetInnerHTML={{__html: "@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');"}} />
              <span className="text-3xl text-[#F4A261] block mb-3" style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 700 }}>{t("toursPage.discoverKambata")}</span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight font-display">
                {t("toursPage.kambataZoneDest") !== "toursPage.kambataZoneDest" ? t("toursPage.kambataZoneDest") : "Kambata Zone Destinations"}
              </h1>
              <div className="w-24 mb-6 opacity-80">
                {/* Decorative leaf element */}
                <svg viewBox="0 0 100 20" className="w-full fill-white">
                  <path d="M50 10c-5-5-15-5-20 0s-5 15 0 20 15 5 20 0 5-15 0-20zm0 0c5-5 15-5 20 0s5 15 0 20-15 5-20 0-5-15 0-20z"/>
                </svg>
              </div>
              <p className="text-gray-200 text-lg md:text-xl max-w-xl">
                {t("toursPage.exploreBeauty")}
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── Interactive Search & Quick Filter Bar ── */}
        <div className={homeStyles.searchContainer}>
          <div className={`${homeStyles.searchBar} shadow-2xl`}>
            <div className={homeStyles.searchGroup}>
              <MapPin className={homeStyles.searchIcon} size={20} />
              <div className={homeStyles.searchGroupText}>
                <span className={homeStyles.searchLabel}>Destination</span>
                <select 
                  className={homeStyles.searchValue}
                  value={activeDistrict}
                  onChange={(e) => setActiveDistrict(e.target.value)}
                >
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className={homeStyles.searchGroup}>
              <Search className={homeStyles.searchIcon} size={20} />
              <div className={homeStyles.searchGroupText}>
                <span className={homeStyles.searchLabel}>Category</span>
                <select 
                  className={homeStyles.searchValue}
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className={homeStyles.searchGroup}>
              <Clock className={homeStyles.searchIcon} size={20} />
              <div className={homeStyles.searchGroupText}>
                <span className={homeStyles.searchLabel}>Duration</span>
                <select 
                  className={homeStyles.searchValue}
                  value={activeDuration}
                  onChange={(e) => setActiveDuration(e.target.value)}
                >
                  <option value="Any Duration">Any Duration</option>
                  <option value="1-3 Days">1-3 Days</option>
                  <option value="4-7 Days">4-7 Days</option>
                  <option value="8+ Days">8+ Days</option>
                </select>
              </div>
            </div>

            <button className={homeStyles.searchBtn} onClick={handleSearch}>
              Search <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* ── Featured / Editor's Picks ── */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 max-w-[1400px]">
            <ScrollReveal>
              <div className="flex flex-col md:flex-row justify-between items-center md:items-end text-center md:text-left mb-12">
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-[#F4A261] font-bold text-sm tracking-widest uppercase mb-2 block">{t("toursPage.editorsPicks")}</span>
                  <h2 className="text-3xl md:text-4xl font-black text-[#112A22]">{t("toursPage.trendingKambata")}</h2>
                </div>
                <p className="text-gray-500 max-w-md text-sm md:text-base mt-4 md:mt-0">
                  {t("toursPage.discoverMostBreathtaking")}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[600px]">
                {/* Large Featured Card */}
                <div className="lg:col-span-7 relative rounded-3xl overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.12)] h-[400px] lg:h-full cursor-pointer">
                  <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037883/kambata/bmq1irrn8nugtb0z2ztg.jpg" alt="Ajora Falls" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#112A22]/90 via-[#112A22]/20 to-transparent pointer-events-none" />
                  <div className="absolute top-6 left-6">
                    <span className="bg-[#F4A261] text-[#112A22] text-xs font-bold px-4 py-2 rounded-full shadow-md uppercase tracking-wider">{t("toursPage.featured.badge1")}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-8">
                    <h3 className="text-3xl font-black text-white mb-2 group-hover:text-[#F4A261] transition-colors">{t("toursPage.featured.title1")}</h3>
                    <p className="text-gray-200 line-clamp-2 max-w-lg mb-6">{t("toursPage.featured.desc1")}</p>
                    <div className="flex items-center gap-6 text-white text-sm font-medium">
                      <span className="flex items-center gap-2"><MapPin size={18} className="text-[#F4A261]" /> {t("toursPage.featured.dist1")}</span>
                      <span className="flex items-center gap-2"><Target size={18} className="text-[#F4A261]" /> {t("toursPage.featured.dur1")}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column Stack */}
                <div className="lg:col-span-5 flex flex-col gap-6 h-[600px] lg:h-full">
                  {/* Top Small Card */}
                  <div className="flex-1 relative rounded-3xl overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.12)] cursor-pointer">
                    <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782068782/kambata/z1ywastrf42kyud4krbs.png" alt="Mount Hambaricho" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#112A22]/90 via-black/20 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-full p-6">
                      <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-[#F4A261] transition-colors">{t("toursPage.featured.title2")}</h3>
                      <p className="text-gray-300 text-sm line-clamp-1 mb-4">{t("toursPage.featured.desc2")}</p>
                      <div className="flex items-center gap-4 text-white text-xs font-medium">
                        <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#F4A261]" /> {t("toursPage.featured.dist2")}</span>
                        <span className="flex items-center gap-1.5"><Target size={14} className="text-[#F4A261]" /> {t("toursPage.featured.dur2")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Small Card */}
                  <div className="flex-1 relative rounded-3xl overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.12)] cursor-pointer">
                    <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1781979624/Gemini_Generated_Image_pjkk9epjkk9epjkk_sr3fna.png" alt="Cultural Heritage" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#112A22]/90 via-black/20 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-full p-6">
                      <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-[#F4A261] transition-colors">{t("toursPage.featured.title3")}</h3>
                      <p className="text-gray-300 text-sm line-clamp-1 mb-4">{t("toursPage.featured.desc3")}</p>
                      <div className="flex items-center gap-4 text-white text-xs font-medium">
                        <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#F4A261]" /> {t("toursPage.featured.dist3")}</span>
                        <span className="flex items-center gap-1.5"><Users size={14} className="text-[#F4A261]" /> {t("toursPage.featured.dur3")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <div className="container mx-auto px-6 max-w-[1400px]">
          
          {/* ── Floating Filter Bar ── */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl p-4 lg:p-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-0 relative z-20 mb-12"
          >
            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center bg-transparent px-2 lg:px-4 py-2 flex-1 border-b lg:border-b-0 lg:border-r border-gray-100 pb-4 lg:pb-2">
              <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
              <input 
                type="text" 
                placeholder={t("toursPage.filters.searchPlaceholder")}
                className="bg-transparent border-none outline-none w-full text-base lg:text-sm font-medium text-gray-700 placeholder-gray-400"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </form>

            {/* Dropdowns */}
            <div className="flex items-center gap-2 lg:gap-3 overflow-x-auto pb-4 lg:pb-0 hide-scrollbar w-full lg:w-auto px-2 lg:px-0 border-b lg:border-b-0 border-gray-100">
              <div className="relative group min-w-[140px] lg:min-w-[160px] lg:border-r border-gray-100 lg:pr-3">
                <div className="flex items-center gap-2 cursor-pointer py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors bg-gray-50 lg:bg-transparent">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600 truncate flex-1">{t(`toursPage.districts.${activeDistrict}`) || activeDistrict}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="relative group min-w-[140px] lg:min-w-[160px] lg:border-r border-gray-100 lg:pr-3">
                <div className="flex items-center gap-2 cursor-pointer py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors bg-gray-50 lg:bg-transparent">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <select 
                    className="bg-transparent border-none outline-none text-sm font-medium text-gray-600 cursor-pointer appearance-none w-full"
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                  >
                    {categories.map(c => <option key={c} value={c}>{t(`toursPage.categories.${c}`) || c}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 pointer-events-none" />
                </div>
              </div>

              <div className="relative group min-w-[140px] lg:min-w-[160px] lg:border-r border-gray-100 lg:pr-3">
                <div className="flex items-center gap-2 cursor-pointer py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors bg-gray-50 lg:bg-transparent">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600 truncate flex-1">{t(`toursPage.travelers.${activeTravelers}`) || activeTravelers}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="relative group min-w-[160px] lg:min-w-[180px]">
                <div className="flex items-center gap-2 cursor-pointer py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors bg-gray-50 lg:bg-transparent">
                  <span className="text-sm text-gray-400 whitespace-nowrap">{t("toursPage.filters.sortBy")}</span>
                  <select 
                    className="bg-transparent border-none outline-none text-sm font-bold text-gray-800 cursor-pointer appearance-none w-full"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    {sortOptions.map(s => <option key={s} value={s}>{t(`toursPage.sort.${s}`) || s}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Filter Action Button */}
            <button onClick={handleSearch} className="bg-[#112A22] hover:bg-[#0a1a15] text-white px-6 py-3 lg:py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md w-full lg:w-auto lg:ml-3 shrink-0">
              <SlidersHorizontal className="w-5 h-5 lg:w-4 lg:h-4" /> <span className="text-base lg:text-sm">{t("toursPage.filters.applyFilters")}</span>
            </button>
          </motion.div>

          {/* ── Main Grid ── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6,7,8].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm h-[420px] flex flex-col">
                  <div className="aspect-[16/9] bg-gray-100 animate-pulse w-full"></div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="h-3 w-1/3 bg-gray-100 animate-pulse rounded-full mb-3"></div>
                    <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded-full mb-3"></div>
                    <div className="h-4 w-full bg-gray-100 animate-pulse rounded-full mb-2"></div>
                    <div className="h-4 w-2/3 bg-gray-100 animate-pulse rounded-full mb-6"></div>
                    <div className="mt-auto flex justify-between items-end mb-4">
                      <div className="h-4 w-16 bg-gray-100 animate-pulse rounded-full"></div>
                      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded-full"></div>
                    </div>
                    <div className="h-12 w-full bg-gray-200 animate-pulse rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : tours.length === 0 && packages.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t("toursPage.filters.noDestinations")}</h3>
              <p className="text-gray-500 max-w-md">{t("toursPage.filters.tryAdjusting")}</p>
              <button 
                onClick={() => { setActiveCategory("All Categories"); setKeyword(""); setPage(1); }}
                className="mt-6 text-[#112A22] font-bold underline"
              >
                {t("toursPage.filters.clearAll")}
              </button>
            </div>
          ) : (
            <>
              {tours.length > 0 && (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-[#112A22]">{language === 'am' ? 'ጉብኝቶች' : 'Tours'}</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {tours.map((tour, idx) => renderCard(tour, idx, false))}
                    
                    {/* Coming Soon: Masala Festival */}
                    {tours.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        className={`bg-[#F6F9F6] border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col justify-center items-center text-center ${tours.length % 3 === 1 ? 'lg:col-span-2 sm:col-span-1' : ''} min-h-[400px] hover:bg-gray-50 transition-colors`}
                      >
                        <div style={{ perspective: "1000px" }} className="w-32 h-32 mb-6 flex items-center justify-center">
                          <motion.div
                            animate={{ rotateX: [0, 360], rotateY: [0, 360] }}
                            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                            className="w-16 h-16 relative"
                            style={{ transformStyle: "preserve-3d" }}
                          >
                            {/* Front */}
                            <div className="absolute inset-0 border border-[#F4A261]/30 bg-white flex items-center justify-center shadow-[0_0_20px_rgba(244,162,97,0.3)]" style={{ transform: "translateZ(32px)" }}>
                              <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" alt="Logo" className="w-14 h-14 object-contain p-1" />
                            </div>
                            {/* Back */}
                            <div className="absolute inset-0 border border-[#F4A261]/30 bg-white flex items-center justify-center shadow-[0_0_20px_rgba(244,162,97,0.3)]" style={{ transform: "translateZ(-32px) rotateY(180deg)" }}>
                              <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" alt="Logo" className="w-14 h-14 object-contain p-1" />
                            </div>
                            {/* Right */}
                            <div className="absolute inset-0 border border-[#F4A261]/30 bg-white flex items-center justify-center" style={{ transform: "translateX(32px) rotateY(90deg)" }}>
                              <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" alt="Logo" className="w-12 h-12 object-contain p-1" />
                            </div>
                            {/* Left */}
                            <div className="absolute inset-0 border border-[#F4A261]/30 bg-white flex items-center justify-center" style={{ transform: "translateX(-32px) rotateY(-90deg)" }}>
                              <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" alt="Logo" className="w-12 h-12 object-contain p-1" />
                            </div>
                            {/* Top */}
                            <div className="absolute inset-0 border border-[#F4A261]/30 bg-white flex items-center justify-center" style={{ transform: "translateY(-32px) rotateX(90deg)" }}></div>
                            {/* Bottom */}
                            <div className="absolute inset-0 border border-[#F4A261]/30 bg-white flex items-center justify-center" style={{ transform: "translateY(32px) rotateX(-90deg)" }}></div>
                          </motion.div>
                        </div>

                        <div className="flex items-center gap-2 mb-4 justify-center flex-wrap">
                          <span className="px-3 py-1 bg-red-500/10 text-red-600 rounded-full text-xs font-bold uppercase tracking-wider border border-red-500/20">Early Access</span>
                          <span className="px-3 py-1 bg-[#112A22]/10 text-[#112A22] rounded-full text-xs font-bold uppercase tracking-wider border border-[#112A22]/20">Sep 2026</span>
                        </div>

                        <h4 className="text-[#F4A261] font-bold text-sm tracking-[0.2em] uppercase mb-2">
                          {language === 'am' ? 'በቅርብ ቀን ....' : 'COMING SOON ....'}
                        </h4>
                        <h3 className="text-3xl md:text-4xl font-black text-[#112A22] mb-4 uppercase">
                          {language === 'am' ? 'መሳላ ፌስቲቫል' : 'MASALA FESTIVAL'}
                        </h3>
                        <p className="text-gray-500 max-w-sm mb-6">
                          {language === 'am' ? 'ለአስደናቂው የመሳላ ፌስቲቫል ልዩ ጥቅሎችን እያዘጋጀን ነው! የባህል ዳንስ፣ ምግብ፣ እና ልዩ ትርኢቶችን ያካተተ አስደናቂ ፕሮግራም በቅርቡ ይጠብቁን።' : 'We are crafting an unforgettable experience for the spectacular Masala Festival. Featuring vibrant cultural dances, authentic cuisine, and exclusive VIP access. Stay tuned!'}
                        </p>
                        
                        <div className="flex items-center gap-6 border-t border-gray-200 pt-6 w-full justify-center opacity-80">
                          <div className="text-center">
                            <span className="block text-xl font-black text-[#112A22]">3</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Days</span>
                          </div>
                          <div className="h-6 w-px bg-gray-300"></div>
                          <div className="text-center">
                            <span className="block text-xl font-black text-[#112A22]">10+</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Events</span>
                          </div>
                          <div className="h-6 w-px bg-gray-300"></div>
                          <div className="text-center">
                            <span className="block text-xl font-black text-[#F4A261]">VIP</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Access</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              )}

              {packages.length > 0 && (
                <>
                  <div className="mb-6 flex items-center justify-between mt-12 pt-8 border-t border-gray-100">
                    <h2 className="text-2xl font-black text-[#112A22]">{language === 'am' ? 'የጉዞ ፓኬጆች' : 'Travel Packages'}</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((pkg, idx) => renderCard(pkg, idx, true))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    page === p 
                      ? "bg-[#112A22] text-white shadow-md" 
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                  }`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Hotels Section ── */}
        <div className="container mx-auto px-6 max-w-[1400px] mt-12">
          <Hotels />
        </div>

        {/* ── Trust Badges (Bottom footer block of the main container) ── */}
        <ScrollReveal>
        <div className="container mx-auto px-6 max-w-[1400px] mt-20 mb-16">
          <div className="bg-[#F6F9F6] rounded-[24px] p-4 sm:p-6 lg:p-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-4 lg:divide-x lg:divide-gray-200/50">
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-4 px-2 lg:px-6 pt-6 sm:pt-0 pb-2 sm:pb-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full border-2 border-[#112A22] flex items-center justify-center text-[#112A22] shrink-0 bg-white">
                  <Target className="w-5 h-5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-bold text-sm">{language === 'am' ? "የአካባቢ እውቀት" : "Local Expertise"}</h4>
                  <p className="text-gray-500 text-xs mt-1">{language === 'am' ? "100% የከምባታ የአካባቢ አስጎብኚዎች" : "100% Kambata Local Guides"}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-4 px-2 lg:px-6 pt-6 sm:pt-0 pb-2 sm:pb-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full border-2 border-[#112A22] flex items-center justify-center text-[#112A22] shrink-0 bg-white">
                  <ShieldCheck className="w-5 h-5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-bold text-sm">{language === 'am' ? "ደህንነቱ የተጠበቀ" : "Safe & Secure"}</h4>
                  <p className="text-gray-500 text-xs mt-1">{language === 'am' ? "የእርስዎ ደህንነት ቅድሚያ የምንሰጠው ነው" : "Your safety is our priority"}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-4 px-2 lg:px-6 pt-6 sm:pt-0 pb-2 sm:pb-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full border-2 border-[#112A22] flex items-center justify-center text-[#112A22] shrink-0 bg-white">
                  <Tag className="w-5 h-5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-bold text-sm">{language === 'am' ? "ምርጥ ዋጋ ዋስትና" : "Best Price Guarantee"}</h4>
                  <p className="text-gray-500 text-xs mt-1">{language === 'am' ? "ምንም የተደበቁ ክፍያዎች የሉም" : "No hidden fees"}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-4 px-2 lg:px-6 pt-6 sm:pt-0 pb-2 sm:pb-0">
                <div className="w-12 h-12 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full border-2 border-[#112A22] flex items-center justify-center text-[#112A22] shrink-0 bg-white">
                  <Headphones className="w-5 h-5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-bold text-sm">{language === 'am' ? "የ24/7 ድጋፍ" : "24/7 Support"}</h4>
                  <p className="text-gray-500 text-xs mt-1">{language === 'am' ? "እኛ ለመርዳት እዚህ ነን" : "We're here to help"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </ScrollReveal>

        {/* ── Coming Soon Section ── */}
        <ScrollReveal>
          <CountdownTimer t={t} />
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
};

const ToursPage = () => (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
    <ToursPageContent />
  </Suspense>
);

export default ToursPage;
