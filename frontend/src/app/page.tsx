"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Destinations from "@/components/home/Destinations";
import Hotels from "@/components/home/Hotels";
import styles from "./Home.module.css";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, MapPin, Calendar, Users, ArrowRight, Play, Star,
  Shield, Heart, CheckCircle2, Clock, Map, Tent, Camera,
  Mountain, Waves, Globe, Compass, Award, HelpCircle, ChevronRight, Plus, Minus
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import ScrollReveal from "@/components/ScrollReveal";
import { useLanguage } from "@/context/LanguageContext";

const heroImages = [
  "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776362718/Gemini_Generated_Image_bmo32hbmo32hbmo3_axyzig.png"
];

const fallbackDestinations = [
  { _id: 1, name: { en: "Ajora Falls", am: "áŠ áŒ†áˆ« ááá‰´" }, location: { en: "Damboya District", am: "á‹³áˆá‰¦á‹« á‹ˆáˆ¨á‹³" }, rating: 4.8, reviews: 126, image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037883/kambata/bmq1irrn8nugtb0z2ztg.jpg" },
  { _id: 2, name: { en: "Mount Hambericho", am: "áˆ€áˆá‰ áˆªá‰¾ á‰°áˆ«áˆ«" }, location: { en: "Damboya District", am: "á‹³áˆá‰¦á‹« á‹ˆáˆ¨á‹³" }, rating: 4.9, reviews: 96, image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782068782/kambata/z1ywastrf42kyud4krbs.png" },
  { _id: 3, name: { en: "Damboya Highlands", am: "á‹³áˆá‰¦á‹« á‹°áŒ‹áˆ› áŠ áŠ«á‰£á‰¢á‹Žá‰½" }, location: { en: "Damboya District", am: "á‹³áˆá‰¦á‹« á‹ˆáˆ¨á‹³" }, rating: 4.7, reviews: 74, image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782038012/kambata/wiv5jowt9wkkt82rukal.png" },
  { _id: 4, name: { en: "Sarobira Valley", am: "áˆ³áˆ®á‰¢áˆ« áˆ¸áˆˆá‰†" }, location: { en: "Tembaro District", am: "áŒ áˆá‰£áˆ® á‹ˆáˆ¨á‹³" }, rating: 4.6, reviews: 68, image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776359619/kambata-travel/tours/kambata_hero_bg_a6e9ce.jpg" },
  { _id: 5, name: { en: "Kambata Cultural Village", am: "áŠ¨áˆá‰£á‰³ á‹¨á‰£áˆ…áˆ áˆ˜áŠ•á‹°áˆ­" }, location: { en: "Tembaro District", am: "áŒ áˆá‰£áˆ® á‹ˆáˆ¨á‹³" }, rating: 4.6, reviews: 55, image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782038014/kambata/ibdkyyuqop0vx0zjvukw.jpg" },
];

const fallbackTours = [
  { _id: 1, title: { en: "Ajora Falls Day Trip", am: "á‹¨áŠ áŒ†áˆ« ááá‰´ á‹¨á‰€áŠ• áŒ‰á‹ž" }, badge: "Popular", duration: "1 Day", difficulty: "Easy", price: 250, image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037883/kambata/bmq1irrn8nugtb0z2ztg.jpg" },
  { _id: 2, title: { en: "Kambata Cultural Experience", am: "áŠ¨áˆá‰£á‰³ á‹¨á‰£áˆ…áˆ áˆáˆá‹µ" }, badge: "", duration: "2 Days", difficulty: "Easy", price: 180, image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782070859/kambata/vrals1tsgawrs3irypkw.jpg" },
  { _id: 3, title: { en: "The Majestic Doje'e Waterfall", am: "á‰³áˆ‹á‰ á‹¨á‹¶áŒ„ ááá‰´" }, badge: "Best Seller", duration: "2 Days", difficulty: "Moderate", price: 300, image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782053030/kambata/g146rbijvhsiwutsgf3x.jpg" },
  { _id: 4, title: { en: "Mount Hambericho Hiking Tour", am: "á‹¨áˆ€áˆá‰ áˆªá‰¾ á‰°áˆ«áˆ« á‹¨áŠ¥áŒáˆ­ áŒ‰á‹ž" }, badge: "", duration: "1 Day", difficulty: "Moderate", price: 400, image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782068782/kambata/z1ywastrf42kyud4krbs.png" },
];

// Simple CountUp Hook
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing out function
      const easeOut = 1 - Math.pow(1 - percentage, 3);
      setCount(Math.floor(end * easeOut));

      if (percentage < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}


function useCountdown(targetDateString: string) {
  const [timeLeft, setTimeLeft] = useState({
    days: "00", hours: "00", minutes: "00", seconds: "00"
  });

  useEffect(() => {
    const targetDate = new Date(targetDateString);
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24)).toString().padStart(2, "0");
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, "0");
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, "0");
        const seconds = Math.floor((difference % (1000 * 60)) / 1000).toString().padStart(2, "0");

        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDateString]);

  return timeLeft;
}

export default function Home() {
  const { language, t } = useLanguage();

  const faqs = [
    { question: t('home.faq.q1') || "How do I book a tour?", answer: t('home.faq.a1') || "You can book a tour directly through our website by browsing the Tours page, selecting your preferred package, and following the easy checkout process." },
    { question: t('home.faq.q2') || "Do you support offline booking?", answer: t('home.faq.a2') || "Yes! If you prefer to book in person or pay via bank transfer, you can visit our Kambata Zone office in Durame town or call our support line." },
    { question: t('home.faq.q3') || "Can I cancel my booking?", answer: t('home.faq.a3') || "Absolutely. We offer a full refund if you cancel at least 48 hours before your scheduled tour date. Please check our cancellation policy for more details." },
    { question: t('home.faq.q4') || "Is transportation included?", answer: t('home.faq.a4') || "Most of our guided tours include local transportation from Durame town to the destination. However, this varies by package, so please check the specific tour details." },
    { question: t('home.faq.q5') || "Are guides local?", answer: t('home.faq.a5') || "Yes, all our guides are certified locals from the Kambata region. They offer deep cultural insights and know the history and hidden gems of the area intimately." },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [destinations, setDestinations] = useState<any[]>(fallbackDestinations);
  const [tours, setTours] = useState<any[]>(fallbackTours);
  const router = useRouter();

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchDuration, setSearchDuration] = useState("");
  const [searchTravelers, setSearchTravelers] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("query", searchQuery);
    if (searchCategory && searchCategory !== "Select category") params.append("category", searchCategory);
    if (searchDuration && searchDuration !== "Any duration") params.append("duration", searchDuration);
    if (searchTravelers && searchTravelers !== "1 Traveler") params.append("travelers", searchTravelers);
    
    router.push(`/tours?${params.toString()}`);
  };
  
  // Stats
  const stat1 = useCountUp(50);
  const stat2 = useCountUp(1000);
  const stat3 = useCountUp(25);
  const timeLeft = useCountdown("2026-09-27T00:00:00");
  const stat4 = useCountUp(98);

  useEffect(() => {
    // Hero Slideshow Timer removed completely
  }, []);

  useEffect(() => {
    // Fetch data, fallback if empty
    const fetchData = async () => {
      try {
        const destRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/destinations`);
        if (destRes.data?.data?.length > 0) {
          // Process to match structure if needed, or just use fallback for now to guarantee layout
          // For now, let's keep the fallback for perfect visual fidelity, but here is the logic:
          // setDestinations(destRes.data.data.slice(0, 5));
        }
        
        const tourRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/tours?status=published&limit=4`);
        if (tourRes.data?.data?.length > 0) {
          // setTours(tourRes.data.data);
        }
      } catch (e) {
        console.error("Failed to fetch dynamic data", e);
      }
    };
    fetchData();
  }, []);

  return (
    <div className={styles.pageWrapper}>
      <Header theme="light" />

      <main className={styles.mainContent}>
        {/* â”€â”€ 1. Hero Section â”€â”€ */}
        <section className={styles.heroSection}>
          <div className={styles.heroInner}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className={styles.heroBg}
                style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
              >
                <img
                  src={heroImages[currentImageIndex]}
                  alt="Hero Background"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </AnimatePresence>
            <div className={styles.heroOverlay} />

            <div className={styles.heroContent}>

            <span className={styles.heroTag}>{t('home.welcomeTag') !== 'home.welcomeTag' ? t('home.welcomeTag') : "WELCOME TO KAMBATA"}</span>
            <h1 className={styles.heroTitle}>
              <span dangerouslySetInnerHTML={{ __html: t('home.heroTitle1') !== 'home.heroTitle1' ? t('home.heroTitle1') : "Explore the Untouched" }} />
              <br />
              <span dangerouslySetInnerHTML={{ __html: t('home.heroTitle2') !== 'home.heroTitle2' ? t('home.heroTitle2') : "Beauty of Kambata Zone" }} />
            </h1>
            <p className={styles.heroSub}>
              {t('home.heroSub') !== 'home.heroSub' ? t('home.heroSub') : "From breathtaking landscapes and rich culture to warm communities and unforgettable adventures. Kambata welcomes you."}
            </p>
            <div className={styles.heroActions}>
              <Link href="/tours" className={styles.primaryBtn}>
                {t('home.startAdventure') !== 'home.startAdventure' ? t('home.startAdventure') : "Start Your Adventure"} <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Right side Trust List overlay */}
          <div className={styles.heroTrustList}>
            <div className={styles.heroTrustItem}>
              <Globe className={styles.heroTrustIcon} size={24} />
              <div className={styles.heroTrustText}>
                <h4>{t('home.features.localExp') !== 'home.features.localExp' ? t('home.features.localExp') : "Local Experiences"}</h4>
                <p>{t('home.features.localExpDesc') !== 'home.features.localExpDesc' ? t('home.features.localExpDesc') : "Authentic & community-based"}</p>
              </div>
            </div>
            <div className={styles.heroTrustItem}>
              <Compass className={styles.heroTrustIcon} size={24} />
              <div className={styles.heroTrustText}>
                <h4>{t('home.features.expertGuides') !== 'home.features.expertGuides' ? t('home.features.expertGuides') : "Expert Local Guides"}</h4>
                <p>{t('home.features.expertGuidesDesc') !== 'home.features.expertGuidesDesc' ? t('home.features.expertGuidesDesc') : "Friendly, professional & local"}</p>
              </div>
            </div>
            <div className={styles.heroTrustItem}>
              <Shield className={styles.heroTrustIcon} size={24} />
              <div className={styles.heroTrustText}>
                <h4>{t('home.features.safeComfort') !== 'home.features.safeComfort' ? t('home.features.safeComfort') : "Safe & Comfortable"}</h4>
                <p>{t('home.features.safeComfortDesc') !== 'home.features.safeComfortDesc' ? t('home.features.safeComfortDesc') : "Your safety is our priority"}</p>
              </div>
            </div>
            <div className={styles.heroTrustItem}>
              <Heart className={styles.heroTrustIcon} size={24} />
              <div className={styles.heroTrustText}>
                <h4>{t('home.features.sustainable') !== 'home.features.sustainable' ? t('home.features.sustainable') : "Sustainable Tourism"}</h4>
                <p>{t('home.features.sustainableDesc') !== 'home.features.sustainableDesc' ? t('home.features.sustainableDesc') : "Protecting nature & culture"}</p>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* â”€â”€ 2. Floating Search Bar â”€â”€ */}
        <div className={styles.searchContainer}>
          <div className={styles.searchBar}>
            <div className={styles.searchGroup}>
              <MapPin className={styles.searchIcon} size={20} />
              <div className={styles.searchGroupText}>
                <span className={styles.searchLabel}>{t('home.search.whereTo') !== 'home.search.whereTo' ? t('home.search.whereTo') : "Where to?"}</span>
                <input 
                  type="text" 
                  placeholder={t('home.search.whereToPlaceholder') !== 'home.search.whereToPlaceholder' ? t('home.search.whereToPlaceholder') : "Search destinations..."}
                  className={styles.searchValue} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <div className={styles.searchGroup}>
              <Search className={styles.searchIcon} size={20} />
              <div className={styles.searchGroupText}>
                <span className={styles.searchLabel}>{t('home.search.category') !== 'home.search.category' ? t('home.search.category') : "What are you looking for?"}</span>
                <select className={styles.searchValue} value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)}>
                  <option>{t('home.search.categoryPlaceholder') !== 'home.search.categoryPlaceholder' ? t('home.search.categoryPlaceholder') : "Select category"}</option>
                  <option>{t('home.search.categories.nature') !== 'home.search.categories.nature' ? t('home.search.categories.nature') : "Nature"}</option>
                  <option>{t('home.search.categories.waterfalls') !== 'home.search.categories.waterfalls' ? t('home.search.categories.waterfalls') : "Waterfalls"}</option>
                  <option>{t('home.search.categories.hiking') !== 'home.search.categories.hiking' ? t('home.search.categories.hiking') : "Hiking"}</option>
                  <option>{t('home.search.categories.culture') !== 'home.search.categories.culture' ? t('home.search.categories.culture') : "Culture"}</option>
                  <option>{t('home.search.categories.heritage') !== 'home.search.categories.heritage' ? t('home.search.categories.heritage') : "Heritage"}</option>
                  <option>{t('home.search.categories.festivals') !== 'home.search.categories.festivals' ? t('home.search.categories.festivals') : "Festivals"}</option>
                </select>
              </div>
            </div>
            <div className={styles.searchGroup}>
              <Clock className={styles.searchIcon} size={20} />
              <div className={styles.searchGroupText}>
                <span className={styles.searchLabel}>{t('home.search.duration') !== 'home.search.duration' ? t('home.search.duration') : "Duration"}</span>
                <select className={styles.searchValue} value={searchDuration} onChange={(e) => setSearchDuration(e.target.value)}>
                  <option>{t('home.search.durationPlaceholder') !== 'home.search.durationPlaceholder' ? t('home.search.durationPlaceholder') : "Any duration"}</option>
                  <option>1 Day</option>
                  <option>2 Days</option>
                  <option>3+ Days</option>
                </select>
              </div>
            </div>
            <div className={styles.searchGroup}>
              <Users className={styles.searchIcon} size={20} />
              <div className={styles.searchGroupText}>
                <span className={styles.searchLabel}>{t('home.search.travelers') !== 'home.search.travelers' ? t('home.search.travelers') : "Travelers"}</span>
                <select className={styles.searchValue} value={searchTravelers} onChange={(e) => setSearchTravelers(e.target.value)}>
                  <option>{t('home.search.travelersPlaceholder') !== 'home.search.travelersPlaceholder' ? t('home.search.travelersPlaceholder') : "1 Traveler"}</option>
                  <option>2 Travelers</option>
                  <option>3-5 Travelers</option>
                  <option>6+ Travelers</option>
                </select>
              </div>
            </div>
            <button className={styles.searchBtn} onClick={handleSearch}>
              {t('home.search.button') !== 'home.search.button' ? t('home.search.button') : "Search Now"} <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* â”€â”€ 3. Explore By Category â”€â”€ */}
        <ScrollReveal>
          <section className="py-16 md:py-24 bg-white">
            <div className="container mx-auto px-6 max-w-7xl">
              <div className="text-center mb-12 md:mb-16">
                <span className="text-[#1A331B] font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs mb-3 block">{t('home.categoryTag') !== 'home.categoryTag' ? t('home.categoryTag') : "DISCOVER YOUR PASSION"}</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight font-display">{t('home.categoryTitle') !== 'home.categoryTitle' ? t('home.categoryTitle') : "Explore By Category"}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {[
                  { originalName: "Nature", name: t('home.search.categories.nature') !== 'home.search.categories.nature' ? t('home.search.categories.nature') : "Nature", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037994/kambata/xbsw2ajsabbtz4tuwjvl.jpg", icon: <Mountain size={24} /> },
                  { originalName: "Waterfalls", name: t('home.search.categories.waterfalls') !== 'home.search.categories.waterfalls' ? t('home.search.categories.waterfalls') : "Waterfalls", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782053030/kambata/g146rbijvhsiwutsgf3x.jpg", icon: <Waves size={24} /> },
                  { originalName: "Hiking", name: t('home.search.categories.hiking') !== 'home.search.categories.hiking' ? t('home.search.categories.hiking') : "Hiking", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782068782/kambata/z1ywastrf42kyud4krbs.png", icon: <CheckCircle2 size={24} /> },
                  { originalName: "Culture", name: t('home.search.categories.culture') !== 'home.search.categories.culture' ? t('home.search.categories.culture') : "Culture", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601590/image_2026-04-19_10-19-03_2_geb4jw.png", icon: <Award size={24} /> },
                  { originalName: "Heritage", name: t('home.search.categories.heritage') !== 'home.search.categories.heritage' ? t('home.search.categories.heritage') : "Heritage", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776594871/2b4e84d7-7330-4570-9b1a-40026b7ef58d_raoclx.jpg", icon: <Map size={24} /> },
                  { originalName: "Festivals", name: t('home.search.categories.festivals') !== 'home.search.categories.festivals' ? t('home.search.categories.festivals') : "Festivals", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601645/image_2026-04-19_10-24-55_bapiqx.png", icon: <Camera size={24} /> },
                ].map((cat, idx) => (
                  <Link href={`/tours?category=${cat.originalName}`} key={idx} className="group relative rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[4/3] lg:aspect-[16/9] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                    <img loading="lazy" src={cat.image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" alt={cat.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A331B]/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 p-6 flex flex-col justify-end items-center text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-4 border border-white/30 group-hover:bg-[#1A331B] group-hover:border-[#1A331B] transition-colors duration-500">
                        {cat.icon}
                      </div>
                      <h3 className="text-white font-black text-lg tracking-wide">{cat.name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* â”€â”€ 4. Top Destinations â”€â”€ */}
        <ScrollReveal>
          <Destinations />
        </ScrollReveal>

        {/* â”€â”€ 5. Experience Banner â”€â”€ */}
        <ScrollReveal>
          <section className={styles.section} style={{ paddingTop: 0 }}>
            <div className={styles.experienceBanner}>
              <div className={styles.expContent}>
                <span className={styles.expTag}>{t('home.expTag') !== 'home.expTag' ? t('home.expTag') : "EXPERIENCE THE REAL KAMBATA"}</span>
                <h2 className={styles.expTitle}>{t('home.expCulture') !== 'home.expCulture' ? t('home.expCulture') : "Culture."} {t('home.expNature') !== 'home.expNature' ? t('home.expNature') : "Nature."} {t('home.expPeople') !== 'home.expPeople' ? t('home.expPeople') : "People."}<br />{t('home.expAllInOne') !== 'home.expAllInOne' ? t('home.expAllInOne') : "All in One Place."}</h2>
                <p className={styles.expDesc}>
                  {t('home.expDesc') !== 'home.expDesc' ? t('home.expDesc') : "Discover vibrant traditions, breathtaking landscapes, rich history, and the warmth of the Kambata people."}
                </p>
                
                <div className={styles.expFeatures}>
                  <div className={styles.expFeatureItem}>
                    <Mountain className={styles.expFeatureIcon} size={32} strokeWidth={1.5} />
                    <h4 dangerouslySetInnerHTML={{ __html: t('home.expFeat1') !== 'home.expFeat1' ? t('home.expFeat1').replace(' ', '<br />') : "Authentic<br />Local Experiences" }} />
                  </div>
                  <div className={styles.expFeatureItem}>
                    <Users className={styles.expFeatureIcon} size={32} strokeWidth={1.5} />
                    <h4 dangerouslySetInnerHTML={{ __html: t('home.expFeat2') !== 'home.expFeat2' ? t('home.expFeat2').replace(' ', '<br />') : "Community<br />Centered" }} />
                  </div>
                  <div className={styles.expFeatureItem}>
                    <Heart className={styles.expFeatureIcon} size={32} strokeWidth={1.5} />
                    <h4 dangerouslySetInnerHTML={{ __html: t('home.expFeat3') !== 'home.expFeat3' ? t('home.expFeat3').replace(' ', '<br />') : "Sustainable<br />Tourism" }} />
                  </div>
                  <div className={styles.expFeatureItem}>
                    <Shield className={styles.expFeatureIcon} size={32} strokeWidth={1.5} />
                    <h4 dangerouslySetInnerHTML={{ __html: t('home.expFeat4') !== 'home.expFeat4' ? t('home.expFeat4').replace(' ', '<br />') : "Support Local<br />Communities" }} />
                  </div>
                </div>
              </div>
              <div className={styles.expImageWrapper} style={{ position: 'relative', overflow: 'hidden' }}>
                <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1776368170/imagekambata_etmd6j.png" alt="Kambata Culture" loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* â”€â”€ 6. Masala Countdown â”€â”€ */}
        <ScrollReveal>
          <section style={{ width: "100%", background: "#1a1a1a", padding: "30px 20px", margin: "40px 0" }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h2 style={{ color: "white", fontSize: "1.5rem", fontWeight: "700", letterSpacing: "4px", fontFamily: "var(--font-display), serif" }}>
                {t('home.eventsComingSoon') !== 'home.eventsComingSoon' ? t('home.eventsComingSoon') : "COMING SOON ...."}
              </h2>
              <p style={{ color: "#D4A017", marginTop: "8px", fontSize: "1rem", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "600" }}>
                {t('home.masalaFestival') !== 'home.masalaFestival' ? t('home.masalaFestival') : "Masala Festival"}
              </p>
            </div>
            
            <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
              {[
                { label: t('home.days') !== 'home.days' ? t('home.days') : "DAYS", value: timeLeft.days },
                { label: t('home.hours') !== 'home.hours' ? t('home.hours') : "HOURS", value: timeLeft.hours },
                { label: t('home.minutes') !== 'home.minutes' ? t('home.minutes') : "MINUTES", value: timeLeft.minutes },
                { label: t('home.seconds') !== 'home.seconds' ? t('home.seconds') : "SECONDS", value: timeLeft.seconds }
              ].map((item, idx) => (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <div style={{ 
                    background: "linear-gradient(180deg, #333333 50%, #222222 50%)", 
                    borderRadius: "12px", 
                    width: "90px", 
                    height: "90px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1)",
                    position: "relative",
                    border: "1px solid #444"
                  }}>
                    <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "2px", background: "rgba(0,0,0,0.6)", zIndex: 1 }} />
                    <span style={{ color: "#f0f0f0", fontSize: "2.8rem", fontWeight: "800", zIndex: 2, fontFamily: "monospace", letterSpacing: "2px" }}>
                      {item.value}
                    </span>
                  </div>
                  <span style={{ color: "#D4A017", fontSize: "0.75rem", fontWeight: "600", letterSpacing: "1px" }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* â”€â”€ 7. Featured Tours â”€â”€ */}
        <ScrollReveal>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionTitleSmall}>{t('home.toursTag') !== 'home.toursTag' ? t('home.toursTag') : "FEATURED TOURS"}</span>
              </div>
              <Link href="/tours" className={styles.viewAllBtn}>
                {t('home.viewAllTours') !== 'home.viewAllTours' ? t('home.viewAllTours') : "View All Tours"} <ArrowRight size={16} />
              </Link>
            </div>

            <div className={styles.toursGrid}>
              {tours.map((tour) => (
                <div key={tour._id} className={styles.tourCard}>
                  <div className={styles.tourImageWrapper} style={{ position: 'relative', overflow: 'hidden' }}>
                    <img src={tour.image} alt={tour.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    {tour.badge && <div className={styles.tourBadge}>{tour.badge}</div>}
                    <div className={styles.tourHeart}><Heart size={16} /></div>
                  </div>
                  <div className={styles.tourContent}>
                    <h3 className={styles.tourTitle}>{tour.title?.[language] || tour.title?.en || tour.title}</h3>
                    <div className={styles.tourMeta}>
                      <div className={styles.tourMetaItem}><Clock size={14} /> {tour.duration}</div>
                      <div className={styles.tourMetaItem}>â€¢</div>
                      <div className={styles.tourMetaItem}>{tour.difficulty}</div>
                    </div>
                    <div className={styles.tourFooter}>
                      <div className={styles.tourPrice}>
                        <span className={styles.tourPriceValue}>${tour.price}</span>
                        <span className={styles.tourPriceLabel}>{t('home.tours.perPerson') || "per person"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        {/* â”€â”€ 7.5 Hotels Section â”€â”€ */}
        <Hotels />

        {/* â”€â”€ 8. Stats Section â”€â”€ */}
        <ScrollReveal>
          <section className={styles.section} style={{ paddingTop: 0, paddingBottom: "40px" }}>
            <span className={styles.sectionTitleSmall} style={{ color: "#1a1a1a" }}>{t('home.whyTravelers') !== 'home.whyTravelers' ? t('home.whyTravelers') : "WHY TRAVELERS LOVE KAMBATA"}</span>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <MapPin className={styles.statIcon} size={40} strokeWidth={1.5} />
                <div>
                  <div className={styles.statValue}>{stat1}+</div>
                  <div className={styles.statLabel} dangerouslySetInnerHTML={{ __html: t('home.stats.destinations') || "Destinations<br />To Explore" }} />
                </div>
              </div>
              <div className={styles.statCard}>
                <Users className={styles.statIcon} size={40} strokeWidth={1.5} />
                <div>
                  <div className={styles.statValue}>{stat2.toLocaleString()}+</div>
                  <div className={styles.statLabel} dangerouslySetInnerHTML={{ __html: t('home.stats.travelers') || "Happy<br />Travelers" }} />
                </div>
              </div>
              <div className={styles.statCard}>
                <Globe className={styles.statIcon} size={40} strokeWidth={1.5} />
                <div>
                  <div className={styles.statValue}>{stat3}+</div>
                  <div className={styles.statLabel} dangerouslySetInnerHTML={{ __html: t('home.stats.guides') || "Local Guides<br />& Experts" }} />
                </div>
              </div>
              <div className={styles.statCard}>
                <Award className={styles.statIcon} size={40} strokeWidth={1.5} />
                <div>
                  <div className={styles.statValue}>{stat4}%</div>
                  <div className={styles.statLabel} dangerouslySetInnerHTML={{ __html: t('home.stats.satisfaction') || "Satisfaction<br />Rate" }} />
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* â”€â”€ 8.5. FAQ Section â”€â”€ */}
        <ScrollReveal>
          <section className={styles.section} style={{ paddingTop: 0, paddingBottom: 0 }}>
            <div className={styles.faqSection}>
              <div className={styles.faqHeader}>
                <h2 className={styles.faqTitle}>{t('home.faqTitle') !== 'home.faqTitle' ? t('home.faqTitle') : "Frequently Asked Questions"}</h2>
                <span className={styles.faqContactLink}>{t('home.stillQuestions') !== 'home.stillQuestions' ? t('home.stillQuestions') : "Still have questions?"} <Link href="/contact" style={{color: '#C89B3C', fontWeight: 600}}>{t('home.contactUs') !== 'home.contactUs' ? t('home.contactUs') : "Contact us"} <ArrowRight size={14} style={{display: "inline", verticalAlign: "middle"}} /></Link></span>
              </div>
              <div className={styles.faqGrid}>
                {faqs.map((faq, index) => (
                  <div 
                    key={index} 
                    className={styles.faqItem} 
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    style={{ flexDirection: 'column', alignItems: 'flex-start' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <div className={styles.faqItemLeft}>
                        <HelpCircle size={18} className={styles.faqIcon} />
                        <span className={styles.faqQuestion}>{faq.question}</span>
                      </div>
                      {openFaq === index ? <Minus size={18} color="#C89B3C" /> : <Plus size={18} color="#94a3b8" />}
                    </div>
                    <AnimatePresence>
                      {openFaq === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: "hidden" }}
                        >
                          <p style={{ paddingTop: 12, fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* â”€â”€ 9. CTA Banner â”€â”€ */}
        <ScrollReveal>
          <section className={styles.section} style={{ paddingTop: 40 }}>
            <div className={styles.ctaBanner} style={{ position: 'relative', overflow: 'hidden' }}>
              <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782038014/kambata/ibdkyyuqop0vx0zjvukw.jpg" alt="Explore Kambata" loading="lazy" decoding="async" className={`w-full h-full object-cover ${styles.ctaBg}`} />
              <div className={styles.ctaOverlay} />
              <div className={styles.ctaContent}>
                <span className={styles.ctaTag}>{t('home.ctaTag') !== 'home.ctaTag' ? t('home.ctaTag') : "READY FOR YOUR NEXT ADVENTURE?"}</span>
                <h2 className={styles.ctaTitle}>{t('home.ctaTitle') !== 'home.ctaTitle' ? t('home.ctaTitle') : "Let's Explore Kambata Together!"}</h2>
                <p className={styles.ctaDesc}>
                  {t('home.ctaWhether') !== 'home.ctaWhether' ? t('home.ctaWhether') : "Whether you're looking for adventure"}, {t('home.ctaRelaxation') !== 'home.ctaRelaxation' ? t('home.ctaRelaxation') : "relaxation"}, {t('home.ctaCulture') !== 'home.ctaCulture' ? t('home.ctaCulture') : "culture"}, {t('home.ctaOrNature') !== 'home.ctaOrNature' ? t('home.ctaOrNature') : "or nature"} {t('home.ctaHasSomething') !== 'home.ctaHasSomething' ? t('home.ctaHasSomething') : "â€” Kambata has something unforgettable for you."}
                </p>
                <div className="flex flex-row items-center justify-center gap-[16px] flex-wrap">
                <Link href="/tours" className={styles.primaryBtn}>
                  {t('home.bookTour') !== 'home.bookTour' ? t('home.bookTour') : "Book a Tour"} <ArrowRight size={16} />
                </Link>
                <Link href="/contact" className={styles.btnSecondary}>
                  {t('home.contactUs') !== 'home.contactUs' ? t('home.contactUs') : "Contact Us"} <ArrowRight size={16} />
                </Link>
              </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

      </main>
      <Footer />
    </div>
  );
}

