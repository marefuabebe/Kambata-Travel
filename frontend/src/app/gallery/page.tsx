"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./Gallery.module.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion, useAnimation, useInView, AnimatePresence } from "framer-motion";
import { 
  Mountain, Droplets, MapPin, Users, Heart, Share2, 
  X, ChevronLeft, ChevronRight, ExternalLink, Camera, Navigation,
  Search, Tag, SlidersHorizontal, Image as ImageIcon, ChevronDown
} from "lucide-react";
import Masonry from "react-masonry-css";
import { useLanguage } from "@/context/LanguageContext";

// --- DATA ---
const STATS = [
  { label: "Photos", value: 5000, icon: <Camera size={24} /> },
  { label: "Destinations", value: 50, icon: <MapPin size={24} /> },
  { label: "Districts", value: 8, icon: <MapPin size={24} /> },
  { label: "Traveler Uploads", value: 1200, icon: <Users size={24} /> }
];

const COLLECTIONS = [
  { title: "Ajora Falls", count: 24, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037883/kambata/bmq1irrn8nugtb0z2ztg.jpg" },
  { title: "Hambaricho Mountain", count: 18, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037952/kambata/eadxdia83stxqodxf3vd.png" },
  { title: "Traditional Culture", count: 40, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601590/image_2026-04-19_10-19-03_2_geb4jw.png" }
];

const CATEGORY_CARDS = [
  { label: "Landscapes", count: 124, icon: <Mountain size={24} />, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037952/kambata/eadxdia83stxqodxf3vd.png" },
  { label: "Waterfalls", count: 86, icon: <Droplets size={24} />, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037883/kambata/bmq1irrn8nugtb0z2ztg.jpg" },
  { label: "Culture", count: 210, icon: <Users size={24} />, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601590/image_2026-04-19_10-19-03_2_geb4jw.png" },
  { label: "Heritage", count: 154, icon: <Navigation size={24} />, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601645/image_2026-04-19_10-24-55_bapiqx.png" },
  { label: "Traveler Moments", count: 320, icon: <Camera size={24} />, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776600885/3dc209b3-9bb6-4805-a08d-39acf638e721_vo7t7s.jpg" },
];

const PHOTOS = [
  { id: 1, src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037883/kambata/bmq1irrn8nugtb0z2ztg.jpg", title: "Ajora Falls", loc: "Damboya District", category: "Waterfalls" },
  { id: 2, src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037952/kambata/eadxdia83stxqodxf3vd.png", title: "Mount Hambaricho", loc: "Tembaro", category: "Landscapes" },
  { id: 3, src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601590/image_2026-04-19_10-19-03_2_geb4jw.png", title: "Traditional Attire", loc: "Durame", category: "Culture" },
  { id: 4, src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776362718/Gemini_Generated_Image_bmo32hbmo32hbmo3_axyzig.png", title: "Sarobita Valley", loc: "Tembaro", category: "Landscapes" },
  { id: 5, src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776594871/2b4e84d7-7330-4570-9b1a-40026b7ef58d_raoclx.jpg", title: "Traditional Music", loc: "Culture", category: "Culture" },
  { id: 6, src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037934/kambata/ovq6lovr2deyvofv0eyi.png", title: "Gamosha Hot Spring", loc: "Nature", category: "Landscapes" },
  { id: 7, src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601645/image_2026-04-19_10-24-55_bapiqx.png", title: "Local Craft Market", loc: "Culture", category: "Heritage" },
  { id: 8, src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776600885/3dc209b3-9bb6-4805-a08d-39acf638e721_vo7t7s.jpg", title: "Traditional Village", loc: "Villages", category: "Heritage" },
  { id: 9, src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782050787/kambata/vczsufpguexanpqgok5y.jpg", title: "Cultural Gathering", loc: "Festivals", category: "Culture" },
  { id: 10, src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782050791/kambata/lqfsuaa6sdgtucuqhpu0.jpg", title: "Harvest Festival", loc: "Festivals", category: "Culture" },
  { id: 11, src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782053030/kambata/g146rbijvhsiwutsgf3x.jpg", title: "Doje'e Waterfall", loc: "Waterfalls", category: "Waterfalls" },
  { id: 12, src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782071679/kambata/ixuoccuvgxnckdjz1yil.jpg", title: "Masala Eve", loc: "Culture", category: "Culture" },
  { id: 13, src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1784396923/Gemini_Generated_Image_91a55z91a55z91a5_ebaznt.jpg", title: "Luxury Suite", loc: "Durame", category: "Hotels" },
  { id: 14, src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1784395777/Gemini_Generated_Image_beq4ihbeq4ihbeq4_np0nb2.jpg", title: "Hotel Exterior", loc: "Kambata Zone", category: "Hotels" },
  { id: 15, src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1784395239/Gemini_Generated_Image_a8s6gaa8s6gaa8s6_mfcekw.png", title: "Dining Area", loc: "Durame", category: "Hotels" },
  { id: 16, src: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1784377843/Gemini_Generated_Image_wwg1arwwg1arwwg1_eyqmpc.jpg", title: "Poolside View", loc: "Kambata Zone", category: "Hotels" }
];

const TRAVELERS = [
  { name: "Sarah Jenkins", loc: "USA", date: "Oct 2025", dest: "Ajora Falls", likes: 342, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037883/kambata/bmq1irrn8nugtb0z2ztg.jpg", avatar: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776600885/3dc209b3-9bb6-4805-a08d-39acf638e721_vo7t7s.jpg" },
  { name: "David Bekele", loc: "Ethiopia", date: "Dec 2025", dest: "Hambaricho", likes: 215, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037952/kambata/eadxdia83stxqodxf3vd.png", avatar: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601590/image_2026-04-19_10-19-03_2_geb4jw.png" },
  { name: "Emma Larsson", loc: "Sweden", date: "Jan 2026", dest: "Durame Market", likes: 450, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601645/image_2026-04-19_10-24-55_bapiqx.png", avatar: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782070859/kambata/vrals1tsgawrs3irypkw.jpg" },
  { name: "Michael Chen", loc: "Canada", date: "Feb 2026", dest: "Cultural Village", likes: 189, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776600885/3dc209b3-9bb6-4805-a08d-39acf638e721_vo7t7s.jpg", avatar: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776594871/2b4e84d7-7330-4570-9b1a-40026b7ef58d_raoclx.jpg" }
];

// MAP_MARKERS moved to MapWrapper.tsx

// --- COMPONENTS ---

// Animated Counter
const AnimatedCounter = ({ value, suffix = "" }: { value: number, suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 2000;
      const increment = end / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start > end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.ceil(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// Lightbox Modal
const Lightbox = ({ 
  photos, 
  currentIndex, 
  onClose, 
  onNavigate 
}: { 
  photos: typeof PHOTOS, 
  currentIndex: number, 
  onClose: () => void,
  onNavigate: (index: number) => void
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((currentIndex + 1) % photos.length);
      if (e.key === 'ArrowLeft') onNavigate((currentIndex - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos.length, onClose, onNavigate]);

  const photo = photos[currentIndex];

  return (
    <div className={styles.lightboxOverlay} onClick={onClose}>
      <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
        <button className={styles.lightboxClose} onClick={onClose}><X size={24} /></button>
        
        <button className={`${styles.lightboxNav} ${styles.lightboxPrev}`} onClick={() => onNavigate((currentIndex - 1 + photos.length) % photos.length)}>
          <ChevronLeft size={32} />
        </button>
        
        <img src={photo.src} alt={photo.title} className={styles.lightboxImg} />
        
        <button className={`${styles.lightboxNav} ${styles.lightboxNext}`} onClick={() => onNavigate((currentIndex + 1) % photos.length)}>
          <ChevronRight size={32} />
        </button>
        
        <div className={styles.lightboxActions}>
          <a href={photo.src} target="_blank" rel="noopener noreferrer" className={styles.lightboxActionBtn}>
            <ExternalLink size={16} /> Open Original
          </a>
          <button className={styles.lightboxActionBtn}>
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>
    </div>
  );
};


export default function GalleryPage() {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  const heroImages = [
    "https://res.cloudinary.com/dzf4st3t2/image/upload/v1785596018/7dd74985-37d2-4edd-93e7-c302209fb139_jee7h8.png",
    "https://res.cloudinary.com/dzf4st3t2/image/upload/v1785596076/6e6478b0-50d2-4f4f-9ce4-b155069d0d6d_hfoiww.png",
    "https://res.cloudinary.com/dzf4st3t2/image/upload/v1785596164/c5c4d2c3-4383-42b7-8d3b-ac11a933d7bd_fefscp.png"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Translate constants based on language
  const translatedStats = [
    { label: t("galleryPage.stats.photos"), value: 5000, icon: <Camera size={24} /> },
    { label: t("galleryPage.stats.destinations"), value: 50, icon: <MapPin size={24} /> },
    { label: t("galleryPage.stats.districts"), value: 8, icon: <MapPin size={24} /> },
    { label: t("galleryPage.stats.uploads"), value: 1200, icon: <Users size={24} /> }
  ];

  const translatedCategories = [
    { label: t("galleryPage.categories.landscapes"), value: "Landscapes", count: 124, icon: <Mountain size={24} />, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037952/kambata/eadxdia83stxqodxf3vd.png" },
    { label: t("galleryPage.categories.waterfalls"), value: "Waterfalls", count: 86, icon: <Droplets size={24} />, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037883/kambata/bmq1irrn8nugtb0z2ztg.jpg" },
    { label: t("galleryPage.categories.culture"), value: "Culture", count: 210, icon: <Users size={24} />, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601590/image_2026-04-19_10-19-03_2_geb4jw.png" },
    { label: t("galleryPage.categories.heritage"), value: "Heritage", count: 154, icon: <Navigation size={24} />, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601645/image_2026-04-19_10-24-55_bapiqx.png" },
    { label: t("galleryPage.categories.travelerMoments"), value: "Traveler Moments", count: 320, icon: <Camera size={24} />, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776600885/3dc209b3-9bb6-4805-a08d-39acf638e721_vo7t7s.jpg" },
  ];

  const filteredPhotos = React.useMemo(() => {
    let result = PHOTOS;

    if (activeCategory !== "All") {
      result = result.filter(p => p.category === activeCategory);
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.loc.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return result;
  }, [activeCategory, searchQuery]);

  const masonryBreakpoints = {
    default: 4,
    1100: 3,
    768: 2,
    500: 1
  };

  return (
    <div className={styles.pageWrapper}>
      <Header theme="light" />

      {/* 1. HERO SECTION */}
      <section className={styles.heroContainer} style={{ position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.img
            key={currentHeroIndex}
            src={heroImages[currentHeroIndex].replace('/upload/', '/upload/f_auto,q_auto,w_1920/')}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            alt="Hero" 
            className={styles.heroBg} 
            loading="lazy" 
            decoding="async" 
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </AnimatePresence>
        <div className={styles.heroOverlay} />
        <motion.div 
          className={styles.heroContent}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className={styles.heroTag}>{t("galleryPage.hero.tag")}</span>
          <h1 className={styles.heroTitle} dangerouslySetInnerHTML={{ __html: t("galleryPage.hero.title").replace('The', '<br/>The') }}></h1>
          <p className={styles.heroSub}>
            {t("galleryPage.hero.sub")}
          </p>
        </motion.div>
      </section>

      {/* 2. STATISTICS STRIP */}
      <section className="bg-white py-12 md:py-16 border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {translatedStats.map((stat, i) => (
              <motion.div 
                key={i} 
                className="flex flex-col items-center justify-center text-center group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-16 h-16 rounded-full bg-[#F8F9F5] flex items-center justify-center text-[#1A331B] mb-4 group-hover:bg-[#1A331B] group-hover:text-white transition-colors duration-300">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
                  <AnimatedCounter value={stat.value} suffix={"+"} />
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SEARCH BAR SECTION */}
      <section className={styles.searchSectionWrapper}>
        <motion.div 
          className={styles.premiumSearchBar}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Search size={20} className={styles.premiumSearchIcon} />
          <input 
            type="text" 
            placeholder={t("galleryPage.search.placeholder")} 
            className={styles.premiumSearchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </motion.div>
      </section>

      {/* 4. VISUAL CATEGORY CARDS */}
      <section className={styles.section} style={{ paddingTop: '24px', paddingBottom: '24px' }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("galleryPage.categories.title")}</h2>
        </div>
        <div className={styles.categoryCardsGrid}>
          {translatedCategories.map((cat, i) => (
            <motion.div 
              key={i} 
              className={`${styles.categoryVisualCard} ${activeCategory === cat.value ? styles.active : ''}`}
              onClick={() => setActiveCategory(cat.value)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <img src={cat.img} alt={cat.label} className={styles.catCardImg} loading="lazy" decoding="async" />
              <div className={styles.catCardOverlay} />
              <div className={styles.catCardContent}>
                <div className={styles.catCardIcon}>{cat.icon}</div>
                <h3 className={styles.catCardTitle}>{cat.label}</h3>
                <span className={styles.catCardCount}>{cat.count} {t("galleryPage.stats.photos")}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. FEATURED COLLECTIONS */}
      <section className={styles.section} style={{ paddingTop: '24px', paddingBottom: '24px' }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("galleryPage.collections.title")}</h2>
        </div>
        <div className={styles.collectionsWrapper}>
          {COLLECTIONS.map((col, i) => (
            <motion.div 
              key={i} 
              className={styles.collectionCard}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
            >
              <img src={col.img} alt={col.title} className={styles.collectionImg} loading="lazy" decoding="async" />
              <div className={styles.collectionOverlay} />
              <div className={styles.collectionContent}>
                <h3 className={styles.collectionTitle}>{col.title}</h3>
                <span className={styles.collectionCount}>{col.count} {t("galleryPage.stats.photos")}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 7. PREMIUM MASONRY GALLERY */}
      <section className={styles.masonrySection} id="masonry-gallery">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("galleryPage.photos.title")}</h2>
        </div>
        <Masonry
          breakpointCols={masonryBreakpoints}
          className={styles.masonryGrid}
          columnClassName={styles.masonryColumn}
        >
          {filteredPhotos.map((photo, index) => (
            <motion.div 
              key={photo.id} 
              className={styles.masonryItem}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              onClick={() => setLightboxIndex(index)}
            >
              <img src={photo.src} alt={photo.title} className={styles.masonryImg} loading="lazy" decoding="async" />
              <div className={styles.masonryOverlay}>
                <div className={styles.masonryTop}>
                  <span className={styles.masonryCategory}>{photo.category}</span>
                </div>
                <div className={styles.masonryBottom}>
                  <h4 className={styles.masonryTitle}>{photo.title}</h4>
                  <div className={styles.masonryLocRow}>
                    <span className={styles.masonryLoc}><MapPin size={14}/> {photo.loc}</span>
                    <button className={styles.masonryViewBtn}>{t("galleryPage.photos.viewPhoto")}</button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </Masonry>
      </section>

      {/* 8. TRAVELER MOMENTS */}
      <section className={styles.section} style={{ paddingTop: '24px' }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t("galleryPage.travelers.title")}</h2>
          <p className={styles.sectionSub}>{t("galleryPage.travelers.sub")}</p>
        </div>
        <div className={styles.travelerGrid}>
          {TRAVELERS.map((t, i) => (
            <motion.div 
              key={i} 
              className={styles.travelerCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className={styles.travelerImgWrapper}>
                <img src={t.img} alt="Traveler" className={styles.travelerImg} loading="lazy" decoding="async" />
              </div>
              <div className={styles.travelerInfo}>
                <div className={styles.travelerUser}>
                  <img src={t.avatar} alt={t.name} className={styles.travelerAvatar} loading="lazy" decoding="async" />
                  <div>
                    <div className={styles.travelerName}>{t.name}</div>
                    <div className={styles.travelerDate}>{t.loc} • {t.date}</div>
                  </div>
                </div>
                <div className={styles.travelerMeta}>
                  <span className={styles.travelerDest}><MapPin size={14}/> {t.dest}</span>
                  <button className={styles.travelerLike}><Heart size={14} fill="currentColor"/> {t.likes}</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 8. INSTAGRAM STRIP */}
      <div className={styles.instaStrip}>
        <motion.div 
          className={styles.instaTrack}
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          whileHover={{ animationPlayState: "paused" }} // Only works natively with CSS animations, but we can fake it or just let Framer handle basic
        >
          {/* Double array for seamless loop */}
          {[...PHOTOS, ...PHOTOS].map((p, i) => (
            <img key={i} src={p.src} alt={p.title} className={styles.instaImg} loading="lazy" decoding="async" />
          ))}
        </motion.div>
      </div>

      {/* 10. FINAL CTA */}
      <section className="py-20 md:py-32 bg-[#F8F9F5] relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-[#0F766E] font-black uppercase tracking-[0.2em] text-xs mb-4 block">{t("galleryPage.cta.tag")}</span>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">{t("galleryPage.cta.title")}</h2>
            <p className="text-gray-600 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
              {t("galleryPage.cta.desc")}
            </p>
            <button className="bg-[#1A331B] text-white px-10 py-4 rounded-full font-bold text-sm md:text-base hover:bg-[#D4A017] transition-all duration-300 shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3 mx-auto">
              <Camera size={20} /> {t("galleryPage.cta.btn")}
            </button>
          </motion.div>
        </div>
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4A017]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1A331B]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </section>

      <Footer />

      {/* LIGHTBOX PORTAL */}
      {lightboxIndex !== null && (
        <Lightbox 
          photos={filteredPhotos} 
          currentIndex={lightboxIndex} 
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
