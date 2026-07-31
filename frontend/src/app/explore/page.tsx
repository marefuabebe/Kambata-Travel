"use client";

import React, { useState, useEffect } from "react";
import styles from "./Explore.module.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { 
  Search, Star, MapPin, ArrowRight, Play, X,
  Mountain, Waves, Map, Users, Heart, 
  Camera, Coffee, Tent, Shield, CheckCircle, Clock, Calendar,
  ChevronLeft, ChevronRight, Mouse
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import ScrollReveal from "@/components/ScrollReveal";

import { useLanguage } from "@/context/LanguageContext";

const categories = [
  { icon: <Mountain size={28} strokeWidth={1.5} />, name: "Mountains" },
  { icon: <Waves size={28} strokeWidth={1.5} />, name: "Waterfalls" },
  { icon: <Tent size={28} strokeWidth={1.5} />, name: "Villages" },
  { icon: <Users size={28} strokeWidth={1.5} />, name: "Culture" },
  { icon: <Camera size={28} strokeWidth={1.5} />, name: "Photography" },
  { icon: <Heart size={28} strokeWidth={1.5} />, name: "Nature" },
  { icon: <CheckCircle size={28} strokeWidth={1.5} />, name: "Hiking" },
];

const ExplorePage = () => {
  const { language, t } = useLanguage();
  const router = useRouter();
  const [popularTours, setPopularTours] = useState<any[]>([]);

  // Search State
  const [destination, setDestination] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [district, setDistrict] = useState("All Districts");
  const [experience, setExperience] = useState("All Experiences");
  const [duration, setDuration] = useState("Any Duration");

  // Modal State
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVideoModalOpen) {
        setIsVideoModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVideoModalOpen]);

  const handleClearFilters = () => {
    setDestination("");
    setCategory("All Categories");
    setDistrict("All Districts");
    setExperience("All Experiences");
    setDuration("Any Duration");
  };

  const handleSearch = () => {
    if (!destination && 
        category === "All Categories" && 
        district === "All Districts" && 
        experience === "All Experiences" && 
        duration === "Any Duration") {
      alert("Please select at least one filter before searching.");
      return;
    }

    const params = new URLSearchParams();
    if (destination) params.append("keyword", destination);
    if (category !== "All Categories") params.append("category", category);
    if (district !== "All Districts") params.append("district", district);
    if (experience !== "All Experiences") params.append("experience", experience);
    if (duration !== "Any Duration") params.append("duration", duration);
    
    router.push(`/tours?${params.toString()}`);
  };

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/tours?status=published&limit=6`);
        if (res.data.data) {
          setPopularTours(res.data.data.slice(0, 6));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTours();
  }, []);

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.mainContent}>
        {/* â”€â”€ 1. Hero Section â”€â”€ */}
        <section className={styles.heroSection}>
          <div className={styles.heroBg} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <img src={"https://res.cloudinary.com/dzf4st3t2/image/upload/v1782159938/Gemini_Generated_Image_nn8ogfnn8ogfnn8o_tvhxy5.png".replace('/upload/', '/upload/f_auto,q_auto,w_1920/')} alt="Hero Background" loading="eager" fetchPriority="high" decoding="async" className="w-full h-full object-cover" />
          </div>
          <div className={styles.heroOverlay} />
          
          <div className={styles.heroContent}>
            <span className={styles.heroTag}>{t('explore.hero.tag') || "DISCOVER KAMBATA"}</span>
            <h1 className={styles.heroTitle}>{t('explore.hero.title') || "Explore Hidden Wonders of Kambata"}</h1>
            <p className={styles.heroSub}>
              {t('explore.hero.sub') || "Experience breathtaking mountains, waterfalls, rich culture, and unforgettable local adventures."}
            </p>
            <div className={styles.heroActions}>
              <Link href="/tours" className={styles.primaryBtn}>
                {t('explore.hero.btnPrimary') || "Explore Destinations"} <ArrowRight size={16} />
              </Link>
              <button 
                type="button"
                className={styles.secondaryBtn} 
                onClick={(e) => {
                  e.preventDefault();
                  setIsVideoModalOpen(true);
                }}
              >
                {t('explore.hero.btnSecondary') || "Watch Story"} <Play size={16} />
              </button>
            </div>
          </div>

          <div className={styles.heroNavLeft}><ChevronLeft size={24} /></div>
          <div className={styles.heroNavRight}><ChevronRight size={24} /></div>
          
          <div className={styles.scrollIndicator}>
            <Mouse size={24} strokeWidth={1} />
            <span>{t('explore.hero.scroll') || "Scroll Down"}</span>
          </div>
        </section>

        {/* â”€â”€ 2. Smart Search â”€â”€ */}
        <ScrollReveal delay={0.1}>
        <div className={styles.searchContainer}>
          <div className={styles.searchBar}>
            <div className={styles.searchGroup}>
              <Search className={styles.searchIcon} size={20} />
              <div className={styles.searchGroupText}>
                <span className={styles.searchLabel}>{t('explore.search.labelDest') || "Search destination"}</span>
                <input 
                  type="text" 
                  placeholder={t('explore.search.placeholderDest') || "Where do you want to go?"}
                  className={styles.searchValue}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.searchGroup}>
              <div className={styles.searchGroupText}>
                <span className={styles.searchLabel}>{t('explore.search.labelCat') || "Category"}</span>
                <select className={styles.searchValue} value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="All Categories">{t('explore.search.catAll') || "All Categories"}</option>
                  <option value="Adventure">{t('explore.search.catAdv') || "Adventure"}</option>
                  <option value="Culture">{t('explore.search.catCul') || "Culture"}</option>
                  <option value="Nature">{t('explore.search.catNat') || "Nature"}</option>
                  <option value="Relax">{t('explore.search.catRel') || "Relax"}</option>
                  <option value="Heritage">{t('explore.search.catHer') || "Heritage"}</option>
                  <option value="Hiking">{t('explore.search.catHik') || "Hiking"}</option>
                </select>
              </div>
            </div>
            <div className={styles.searchGroup}>
              <div className={styles.searchGroupText}>
                <span className={styles.searchLabel}>{t('explore.search.labelDist') || "District"}</span>
                <select className={styles.searchValue} value={district} onChange={(e) => setDistrict(e.target.value)}>
                  <option value="All Districts">{t('explore.search.distAll') || "All Districts"}</option>
                  <option value="Dara">Dara</option>
                  <option value="Tembaro">Tembaro</option>
                  <option value="Damboya">Damboya</option>
                  <option value="Kachabira">Kachabira</option>
                  <option value="Kediida Gamela">Kediida Gamela</option>
                </select>
              </div>
            </div>
            <div className={styles.searchGroup}>
              <div className={styles.searchGroupText}>
                <span className={styles.searchLabel}>{t('explore.search.labelExp') || "Experience"}</span>
                <select className={styles.searchValue} value={experience} onChange={(e) => setExperience(e.target.value)}>
                  <option value="All Experiences">{t('explore.search.expAll') || "All Experiences"}</option>
                  <option value="Guided">{t('explore.search.expGui') || "Guided"}</option>
                  <option value="Self-Guided">{t('explore.search.expSelf') || "Self-Guided"}</option>
                  <option value="Private">{t('explore.search.expPri') || "Private"}</option>
                </select>
              </div>
            </div>
            <div className={styles.searchGroup}>
              <div className={styles.searchGroupText}>
                <span className={styles.searchLabel}>{t('explore.search.labelDur') || "Duration"}</span>
                <select className={styles.searchValue} value={duration} onChange={(e) => setDuration(e.target.value)}>
                  <option value="Any Duration">{t('explore.search.durAny') || "Any Duration"}</option>
                  <option value="1 Day">{t('explore.search.dur1') || "1 Day"}</option>
                  <option value="2 Days">{t('explore.search.dur2') || "2 Days"}</option>
                  <option value="3-5 Days">{t('explore.search.dur3') || "3-5 Days"}</option>
                  <option value="1 Week+">{t('explore.search.dur4') || "1 Week+"}</option>
                </select>
              </div>
            </div>
            <div className={styles.searchActions}>
              <button type="button" className={styles.searchBtn} onClick={(e) => { e.preventDefault(); handleSearch(); }}>
                {t('explore.search.btnExplore') || "Explore"} <ArrowRight size={16} />
              </button>
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); handleClearFilters(); }}
                className={styles.clearBtn}
              >
                {t('explore.search.btnClear') || "Clear Filters"}
              </button>
            </div>
          </div>
        </div>
        </ScrollReveal>

        {/* â”€â”€ 3. Popular Destinations â”€â”€ */}
        <ScrollReveal>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionTitleSmall}>{t('explore.popular.tag') || "TOP PLACES TO VISIT"}</span>
              <h2 className={styles.sectionTitle}>{t('explore.popular.title') || "Popular Destinations"}</h2>
            </div>
            <Link href="/tours" className={styles.viewAllBtn}>
              {t('explore.popular.viewAll') || "View All Destinations"} <ArrowRight size={14} />
            </Link>
          </div>

          <div className={styles.destinationsRow}>
            {/* Fallback to static if API fails, but use API if possible.
                The image shows 6 cards in a row. */}
            {(popularTours.length > 0 ? popularTours : [
              { _id: 1, title: {en: "Ajora Falls", am: "áŠ áŒ†áˆ« ááá‰´"}, location: {region: {en: "Damboya District", am: "á‹³áˆá‰¦á‹« á‹ˆáˆ¨á‹³"}}, category: "Waterfall", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037881/kambata/gxxovihnkuiueo63dosk.png" },
              { _id: 2, title: {en: "Mount Hambaricho", am: "áˆ€áˆá‰ áˆªá‰¾ á‰°áˆ«áˆ«"}, location: {region: {en: "Damboya District", am: "á‹³áˆá‰¦á‹« á‹ˆáˆ¨á‹³"}}, category: "Mountain", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037952/kambata/eadxdia83stxqodxf3vd.png" },
              { _id: 3, title: {en: "Damboya Highlands", am: "á‹³áˆá‰¦á‹« á‹°áŒ‹áˆ› á‰¦á‰³á‹Žá‰½"}, location: {region: {en: "Damboya District", am: "á‹³áˆá‰¦á‹« á‹ˆáˆ¨á‹³"}}, category: "Highland", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782038012/kambata/wiv5jowt9wkkt82rukal.png" },
              { _id: 4, title: {en: "Sarobira Valley", am: "áˆ³áˆ®á‰¢áˆ« áˆ¸áˆˆá‰†"}, location: {region: {en: "Kacha Bira District", am: "á‰ƒáŒ« á‰¢áˆ« á‹ˆáˆ¨á‹³"}}, category: "Valley", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776362718/Gemini_Generated_Image_bmo32hbmo32hbmo3_axyzig.png" },
              { _id: 5, title: {en: "Kambata Village", am: "áŠ¨áˆá‰£á‰³ áˆ˜áŠ•á‹°áˆ­"}, location: {region: {en: "Tembaro District", am: "áŒ áˆá‰£áˆ® á‹ˆáˆ¨á‹³"}}, category: "Culture", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782038014/kambata/ibdkyyuqop0vx0zjvukw.jpg" },
              { _id: 6, title: {en: "Wanchi Crater Lake", am: "á‹ˆáŠ•áŒª áˆ€á‹­á‰…"}, location: {region: {en: "Tembaro District", am: "áŒ áˆá‰£áˆ® á‹ˆáˆ¨á‹³"}}, category: "Lake", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782038005/kambata/dqqdx098zh4nieljug3t.jpg" },
            ]).map((tour, idx) => {
              
              // Helper translations for DB strings
              const titleMap: Record<string, string> = {
                "Ajora Falls": "áŠ áŒ†áˆ« ááá‰´", "Mount Hambaricho": "áˆ€áˆá‰ áˆªá‰¾ á‰°áˆ«áˆ«", "Damboya Highlands": "á‹³áˆá‰¦á‹« á‹°áŒ‹áˆ› á‰¦á‰³á‹Žá‰½", "Sarobira Valley": "áˆ³áˆ®á‰¢áˆ« áˆ¸áˆˆá‰†", "Kambata Village": "áŠ¨áˆá‰£á‰³ áˆ˜áŠ•á‹°áˆ­", "Wanchi Crater Lake": "á‹ˆáŠ•áŒª áˆ€á‹­á‰…",
                "Gamosha Hot Spring Retreat": "á‹¨áŒ‹áˆžáˆ» áˆ™á‰… á‹áˆƒ áˆ˜á‹áŠ“áŠ›",
                "The Majestic Doje'e Waterfall": "á‰³áˆ‹á‰ á‹¨á‹¶áŒ„ ááá‰´",
                "Durame Town": "á‹±áˆ«áˆœ áŠ¨á‰°áˆ›",
                "Mount Hambarcho": "áˆ€áˆá‰ áˆªá‰¾ á‰°áˆ«áˆ«",
                "Sarobira Highlands": "áˆ³áˆ®á‰¢áˆ« á‹°áŒ‹áˆ› á‰¦á‰³á‹Žá‰½"
              };
              const locMap: Record<string, string> = {
                "Damboya District": "á‹³áˆá‰¦á‹« á‹ˆáˆ¨á‹³", "Kacha Bira District": "á‰ƒáŒ« á‰¢áˆ« á‹ˆáˆ¨á‹³", "Tembaro District": "áŒ áˆá‰£áˆ® á‹ˆáˆ¨á‹³", "Kambata Zone": "áŠ¨áˆá‰£á‰³ á‹žáŠ•"
              };
              const catMap: Record<string, string> = {
                "Waterfall": "ááá‰´", "Mountain": "á‰°áˆ«áˆ«", "Highland": "á‹°áŒ‹áˆ› á‰¦á‰³", "Valley": "áˆ¸áˆˆá‰†", "Culture": "á‰£áˆ…áˆ", "Lake": "áˆ€á‹­á‰…", "Adventure": "áŒ€á‰¥á‹±",
                "Retreat": "áˆ˜á‹áŠ“áŠ›", "Town": "áŠ¨á‰°áˆ›"
              };

              const getTitle = () => {
                if (language === 'am') return tour.title?.am || titleMap[tour.title?.en || tour.title] || tour.title?.en || tour.title;
                return tour.title?.en || tour.title;
              };
              
              const getLoc = () => {
                let loc = tour.location?.region?.en || tour.location?.region || "Kambata Zone";
                if (language === 'am') return tour.location?.region?.am || locMap[loc] || locMap[loc.trim()] || "áŠ¨áˆá‰£á‰³ á‹žáŠ•";
                return loc;
              };

              const getCat = () => {
                let cat = tour.category?.en || tour.category || "Adventure";
                if (language === 'am') return tour.category?.am || catMap[cat] || catMap[cat.trim()] || "áŒ€á‰¥á‹±";
                return cat;
              };

              return (
              <Link href={`/explorer-dashboard/explore-tours/${tour._id}`} key={tour._id || idx}>
                <div className={styles.tourCard}>
                  <div className={styles.tourImageWrapper} style={{ position: 'relative', overflow: 'hidden' }}>
                    <img src={tour.images?.[0] || tour.image || "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782038014/kambata/ibdkyyuqop0vx0zjvukw.jpg"} alt={getTitle()} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    <div className={styles.tourCardBadge}>{getCat()}</div>
                    <div className={styles.tourCardHeart}><Heart size={14} strokeWidth={2} /></div>
                    <div className={styles.tourHoverOverlay}>
                      <h4 className={styles.tourHoverTitle}>{getTitle()}</h4>
                      <p className={styles.tourHoverDesc}>
                        {tour.shortDescription?.[language] || tour.shortDescription?.en || tour.description?.[language] || tour.description?.en || t('explore.popular.desc') || "Explore the breathtaking beauty and rich culture of this amazing destination in Kambata."}
                      </p>
                    </div>
                  </div>
                  <div className={styles.tourCardContent}>
                    <h3 className={styles.tourCardTitle}>{getTitle()}</h3>
                    <div className={styles.tourCardLocation}>
                      <MapPin size={12} /> {getLoc()}
                    </div>
                    <div className={styles.tourCardFooter}>
                      <div className={styles.tourCardRating}>
                        <Star size={12} className="fill-yellow-500 text-yellow-500" /> 4.8 <span className={styles.tourCardRatingCount}>(124)</span>
                      </div>
                      <Heart size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </Link>
            )})}
          </div>
        </section>
        </ScrollReveal>

        {/* â”€â”€ 4. Explore By Category â”€â”€ */}
        <ScrollReveal>
          <section className={`${styles.section} bg-white`}>
            <div>
            <div className="text-center mb-12 md:mb-16">
              <span className="text-[#1A331B] font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs mb-3 block">{t('explore.categories.tag') || "DISCOVER YOUR PASSION"}</span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">{t('explore.categories.title') || "Explore By Category"}</h2>
            </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {[
                  { name: "Nature", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037994/kambata/xbsw2ajsabbtz4tuwjvl.jpg", icon: <Mountain size={24} /> },
                  { name: "Waterfalls", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782053030/kambata/g146rbijvhsiwutsgf3x.jpg", icon: <Waves size={24} /> },
                  { name: "Hiking", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782068782/kambata/z1ywastrf42kyud4krbs.png", icon: <CheckCircle size={24} /> },
                  { name: "Culture", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601590/image_2026-04-19_10-19-03_2_geb4jw.png", icon: <Users size={24} /> },
                  { name: "Heritage", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776594871/2b4e84d7-7330-4570-9b1a-40026b7ef58d_raoclx.jpg", icon: <Map size={24} /> },
                  { name: "Photography", image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601645/image_2026-04-19_10-24-55_bapiqx.png", icon: <Camera size={24} /> },
                ].map((cat, idx) => (
                  <Link href={`/tours?category=${cat.name}`} key={idx} className="group relative rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[4/3] lg:aspect-[16/9] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                    <img loading="lazy" src={cat.image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" alt={cat.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A331B]/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 p-6 flex flex-col justify-end items-center text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-4 border border-white/30 group-hover:bg-[#1A331B] group-hover:border-[#1A331B] transition-colors duration-500">
                        {cat.icon}
                      </div>
                      <h3 className="text-white font-black text-lg tracking-wide">{t(`explore.categories.${cat.name}`) || cat.name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* â”€â”€ 5. Featured Destination â”€â”€ */}
        <ScrollReveal>
        <section className={styles.section}>
          <div className={styles.featuredContainer}>
            <div className={styles.featuredMainImg} style={{ position: 'relative', overflow: 'hidden' }}>
              <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1776359618/kambata-travel/tours/ajora_falls_tour_xunjkr.jpg" alt="Ajora Falls" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>
            <div className={styles.featuredContent}>
              <span className={styles.sectionTitleSmall}>{t('explore.featured.tag') || "FEATURED DESTINATION"}</span>
              <h2 className={styles.featuredTitle}>{t('explore.featured.title') || "Ajora Falls"}</h2>
              <div className={styles.featuredLocation}>
                <MapPin size={16} /> {t('explore.featured.loc') || "Damboya District, Kambata Zone"}
              </div>
              <p className={styles.featuredDesc}>
                {t('explore.featured.desc') || "The highest waterfall in Kambata and one of the most stunning waterfalls in Ethiopia. A breathtaking view surrounded by lush vegetation and natural beauty."}
              </p>
              
              <div className={styles.featuredMetaRow}>
                <div className={styles.featuredMetaItem}>
                  <div className={styles.featuredMetaIcon}><Calendar size={18} /></div>
                  <span className={styles.featuredMetaLabel}>{t('explore.featured.bestTime') || "Best Time"}</span>
                  <span className={styles.featuredMetaValue}>{t('explore.featured.bestTimeVal') || "Oct - May"}</span>
                </div>
                <div className={styles.featuredMetaItem}>
                  <div className={styles.featuredMetaIcon}><Clock size={18} /></div>
                  <span className={styles.featuredMetaLabel}>{t('explore.featured.duration') || "Duration"}</span>
                  <span className={styles.featuredMetaValue}>{t('explore.featured.durationVal') || "1 Day"}</span>
                </div>
                <div className={styles.featuredMetaItem}>
                  <div className={styles.featuredMetaIcon}><Mountain size={18} /></div>
                  <span className={styles.featuredMetaLabel}>{t('explore.featured.difficulty') || "Difficulty"}</span>
                  <span className={styles.featuredMetaValue}>{t('explore.featured.difficultyVal') || "Easy"}</span>
                </div>
                <div className={styles.featuredMetaItem}>
                  <div className={styles.featuredMetaIcon}><Users size={18} /></div>
                  <span className={styles.featuredMetaLabel}>{t('explore.featured.guide') || "Guide"}</span>
                  <span className={styles.featuredMetaValue}>{t('explore.featured.guideVal') || "Available"}</span>
                </div>
              </div>

              <div>
                <button className={styles.primaryBtn}>{t('explore.featured.btn') || "Explore This Destination"} <ArrowRight size={16} /></button>
              </div>
            </div>
            <div className={styles.featuredSideImgs}>
              <div className={styles.featuredSideImgWrapper} style={{ position: 'relative', overflow: 'hidden' }}><img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037881/kambata/gxxovihnkuiueo63dosk.png" alt="Ajora 1" loading="lazy" decoding="async" className="w-full h-full object-cover" /></div>
              <div className={styles.featuredSideImgWrapper} style={{ position: 'relative', overflow: 'hidden' }}><img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037883/kambata/bmq1irrn8nugtb0z2ztg.jpg" alt="Ajora 2" loading="lazy" decoding="async" className="w-full h-full object-cover" /></div>
              <div className={styles.featuredSideImgWrapper} style={{ position: 'relative', overflow: 'hidden' }}>
                <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037881/kambata/gxxovihnkuiueo63dosk.png" alt="Ajora 3" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                <div className={styles.featuredImgOverlay}>1/3</div>
              </div>
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* â”€â”€ 6. Cultural Heritage â”€â”€ */}
        <ScrollReveal>
        <section className={styles.section}>
          <div className={styles.cultureContainer}>
            <div className={styles.cultureImage} style={{ position: 'relative', overflow: 'hidden' }}>
              <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782070859/kambata/vrals1tsgawrs3irypkw.jpg" alt="Kambata Culture" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>
            <div className={styles.cultureContent}>
              <span className={styles.sectionTitleSmall} style={{ color: "#D4A017" }}>{t('explore.heritage.tag') || "OUR HERITAGE"}</span>
              <h2 className={styles.cultureTitle}>{t('explore.heritage.title') || "Traditional Kambata Culture"}</h2>
              <p className={styles.cultureDesc}>
                {t('explore.heritage.desc') || "Experience the warmth of Kambata people, their traditions, music, dance, local cuisine, and unique way of life that has been preserved for generations."}
              </p>
              
              <div className={styles.cultureIconsRow}>
                <div className={styles.cultureIconItem}>
                  <div className={styles.cultureIconWrapper}><Tent size={32} strokeWidth={1.5} /></div>
                  <span className={styles.cultureIconLabel} dangerouslySetInnerHTML={{ __html: t('explore.heritage.clothing') || "Traditional<br/>Clothing" }} />
                </div>
                <div className={styles.cultureIconItem}>
                  <div className={styles.cultureIconWrapper}><Users size={32} strokeWidth={1.5} /></div>
                  <span className={styles.cultureIconLabel} dangerouslySetInnerHTML={{ __html: t('explore.heritage.dance') || "Cultural<br/>Dances" }} />
                </div>
                <div className={styles.cultureIconItem}>
                  <div className={styles.cultureIconWrapper}><Coffee size={32} strokeWidth={1.5} /></div>
                  <span className={styles.cultureIconLabel} dangerouslySetInnerHTML={{ __html: t('explore.heritage.cuisine') || "Local<br/>Cuisine" }} />
                </div>
                <div className={styles.cultureIconItem}>
                  <div className={styles.cultureIconWrapper}><Heart size={32} strokeWidth={1.5} /></div>
                  <span className={styles.cultureIconLabel} dangerouslySetInnerHTML={{ __html: t('explore.heritage.tourism') || "Community<br/>Tourism" }} />
                </div>
              </div>

              <div>
                <button className={styles.primaryBtn}>{t('explore.heritage.btn') || "Learn More"} <ArrowRight size={16} /></button>
              </div>
            </div>
          </div>
        </section>
        </ScrollReveal>


        {/* â”€â”€ 8. Travel Stories â”€â”€ */}
        <ScrollReveal>
        <section className={styles.section}>
          <div>
            <div className={styles.sectionHeader} style={{ marginBottom: "16px" }}>
              <div>
                <span className={styles.sectionTitleSmall} style={{ color: "#1a1a1a" }}>{t('explore.stories.tag') || "TRAVEL STORIES"}</span>
                <h2 className={styles.sectionTitle} style={{ fontSize: "1.5rem" }}>{t('explore.stories.title') || "Latest Stories"}</h2>
              </div>
              <Link href="/gallery" className={styles.viewAllBtn}>{t('explore.stories.viewAll') || "View All"}</Link>
            </div>
            <div className={styles.storiesGrid}>
              {[
                { date: t('explore.stories.s1Date') || "May 12, 2026", title: t('explore.stories.s1Title') || "Camping adventure at Bilate Benarraa", img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782071378/kambata/azwukolts7nkqs12np6o.jpg" },
                { date: t('explore.stories.s2Date') || "May 28, 2026", title: t('explore.stories.s2Title') || "Cultural Experience in Kambata Villages", img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782070859/kambata/vrals1tsgawrs3irypkw.jpg" },
                { date: t('explore.stories.s3Date') || "Jun 20, 2026", title: t('explore.stories.s3Title') || "A Journey to Ajora Falls", img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037952/kambata/eadxdia83stxqodxf3vd.png" },
              ].map((s, i) => (
                <div key={i} className={styles.storyCard}>
                  <img src={s.img} alt={s.title} loading="lazy" decoding="async" />
                  <div className={styles.storyContent}>
                    <span className={styles.storyDate}>{s.date}</span>
                    <h4 className={styles.storyTitle}>{s.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        </ScrollReveal>
        {/* â”€â”€ 9. Why Choose Us â”€â”€ */}
        <ScrollReveal>
        <WhyChooseUs />
        </ScrollReveal>

        {/* â”€â”€ 11. Newsletter â”€â”€ */}
        <ScrollReveal>
        <section className={styles.section}>
          <div className={styles.newsletterSection} style={{ position: 'relative', overflow: 'hidden' }}>
            <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037952/kambata/eadxdia83stxqodxf3vd.png" alt="Newsletter" loading="lazy" decoding="async" className={styles.newsletterBg} />
            <div className={styles.newsletterOverlay} />
            
            <div className={styles.newsletterLeft}>
              <span className={styles.newsletterTag}>{t('explore.newsletter.tag') || "STAY INSPIRED"}</span>
              <h2 className={styles.newsletterTitle}>{t('explore.newsletter.title') || "Get Inspired For Your Next Adventure"}</h2>
              <p className={styles.newsletterDesc}>{t('explore.newsletter.desc') || "Subscribe to our newsletter and get the latest updates on new destinations, travel tips, and exclusive offers."}</p>
            </div>
            
            <div className={styles.newsletterRight}>
              <input type="email" placeholder={t('explore.newsletter.placeholder') || "Enter your email address..."} className={styles.newsletterInput} />
              <button className={styles.newsletterBtn}>{t('explore.newsletter.btn') || "Subscribe"} <ArrowRight size={16} /></button>
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* â”€â”€ Video Modal â”€â”€ */}
        {isVideoModalOpen && (
          <div 
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setIsVideoModalOpen(false)}
          >
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsVideoModalOpen(false);
              }}
              className="absolute z-[99999] p-3 md:p-2 bg-black/40 md:bg-white/10 hover:bg-black/60 md:hover:bg-white/25 text-white rounded-full transition-colors flex items-center justify-center cursor-pointer pointer-events-auto backdrop-blur-md"
              style={{ 
                top: 'max(16px, env(safe-area-inset-top, 16px))', 
                right: 'max(16px, env(safe-area-inset-right, 16px))' 
              }}
              title="Close video"
            >
              <X className="w-6 h-6 md:w-7 md:h-7" />
            </button>
            
            <div 
              className="relative w-full bg-black rounded-xl overflow-hidden shadow-2xl"
              style={{
                maxWidth: 'min(95vw, 1200px)',
                maxHeight: '90vh',
                aspectRatio: '16/9'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <iframe 
                className="absolute inset-0 w-full h-full z-[1]"
                src="https://www.youtube.com/embed/k57bzEZasz0?autoplay=1&controls=1&fs=1&rel=0&modestbranding=0" 
                title="Kambata Story" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default ExplorePage;

