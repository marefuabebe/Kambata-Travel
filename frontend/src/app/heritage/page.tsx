"use client";

import React, { useState } from "react";
import styles from "./Heritage.module.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { 
  ArrowRight, Play, MapPin, CheckCircle, Mouse,
  Landmark, Users, MessageCircle, Leaf,
  Shirt, Music, Globe, Home, Coffee,
  Calendar, Quote, BookOpen, X
} from "lucide-react";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import { useLanguage } from "@/context/LanguageContext";

const HeritagePage = () => {
  const { t } = useLanguage();
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.mainContent}>
        {/* ── 1. Hero Section ── */}
        <section className={styles.heroSection}>
          <div className={styles.heroBg} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <img src={"https://res.cloudinary.com/dzf4st3t2/image/upload/v1785583893/e64d104d-f56f-4889-804b-06966f2bbbd7_ezoipc.png".replace('/upload/', '/upload/f_auto,q_auto,w_1920/')} alt="Kambata Culture" loading="eager" fetchPriority="high" decoding="async" className="w-full h-full object-cover" />
          </div>
          <div className={styles.heroOverlay} />
          
          <div className={styles.heroContent}>
            <style dangerouslySetInnerHTML={{__html: "@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');"}} />
            <span className={styles.sectionTitleSmall} style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 700, fontSize: "2.5rem", textTransform: "capitalize", letterSpacing: "normal", color: "#F4A261" }}>{t("heritagePage.hero.tag")}</span>
            <h1 className={styles.heroTitle}>{t("heritagePage.hero.title")}</h1>
            <p className={styles.heroSub}>
              {t("heritagePage.hero.sub")}
            </p>
            <div className={styles.heroActions}>
              <Link href="/explore" className={styles.primaryBtn}>
                {t("heritagePage.hero.exploreBtn")} <ArrowRight size={16} />
              </Link>
              <button 
                className={styles.outlineBtn}
                onClick={(e) => {
                  e.preventDefault();
                  setShowVideo(true);
                }}
              >
                {t("heritagePage.hero.watchBtn")} <Play size={16} />
              </button>
            </div>
          </div>
          
          <div className={styles.scrollIndicator}>
            <Mouse size={24} strokeWidth={1} />
            <span>{t("heritagePage.hero.scroll")}</span>
          </div>
        </section>

        {/* ── Floating Stats Bar ── */}
        <div className={styles.statsBarWrapper}>
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>100+</span>
              <span className={styles.statLabel}>Years of History</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>7</span>
              <span className={styles.statLabel}>Indigenous Clans</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>50+</span>
              <span className={styles.statLabel}>Cultural Festivals</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>1</span>
              <span className={styles.statLabel}>Unique Heritage</span>
            </div>
          </div>
        </div>

        {/* ── 2. Our Identity ── */}
        <ScrollReveal delay={0.1}>
        <section className={`${styles.section} ${styles.identityWrapper}`}>
          <div className={styles.identitySection}>
            <div className={styles.identityImg} style={{ position: 'relative', overflow: 'hidden' }}>
              <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037886/kambata/sbmpepkglzwxfwb5emhd.png" alt="Identity" loading="lazy" decoding="async" className="w-full h-full object-cover" style={{ transform: 'scale(2.6)', transformOrigin: 'center center' }} />
            </div>
            
            <div className={styles.identityContent}>
              <span className={styles.sectionTitleSmall}>{t("heritagePage.identity.tag")}</span>
              <h2 className={styles.sectionTitle} style={{ marginBottom: "16px" }}>{t("heritagePage.identity.title")}</h2>
              <p className={styles.identityDesc}>
                {t("heritagePage.identity.desc")}
              </p>
              
              <div className={styles.identityIcons}>
                <div className={styles.identityIconCard}>
                  <Landmark className={styles.idIcon} size={32} strokeWidth={1.5} />
                  <span className={styles.idLabel} dangerouslySetInnerHTML={{ __html: t("heritagePage.identity.icons.history").replace(' ', '<br/>') }}></span>
                </div>
                <div className={styles.identityIconCard}>
                  <Users className={styles.idIcon} size={32} strokeWidth={1.5} />
                  <span className={styles.idLabel} dangerouslySetInnerHTML={{ __html: t("heritagePage.identity.icons.traditions").replace(' ', '<br/>') }}></span>
                </div>
                <div className={styles.identityIconCard}>
                  <MessageCircle className={styles.idIcon} size={32} strokeWidth={1.5} />
                  <span className={styles.idLabel} dangerouslySetInnerHTML={{ __html: t("heritagePage.identity.icons.language").replace(' ', '<br/>') }}></span>
                </div>
                <div className={styles.identityIconCard}>
                  <Leaf className={styles.idIcon} size={32} strokeWidth={1.5} />
                  <span className={styles.idLabel} dangerouslySetInnerHTML={{ __html: t("heritagePage.identity.icons.heritage").replace(' ', '<br/>') }}></span>
                </div>
              </div>
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* ── 3. Heritage Categories ── */}
        <ScrollReveal>
        <section className={styles.section}>
          <div className="text-center mb-10">
            <span className={styles.sectionTitleSmallGreen} style={{ color: "#1a1a1a", display: "inline-block", marginBottom: "12px" }}>{t("heritagePage.categories.tag")}</span>
            <h2 className={styles.sectionTitle} style={{ marginBottom: "16px" }}>{t("heritagePage.categories.title")}</h2>
            <Link href="/gallery" className="inline-flex items-center justify-center gap-2 text-sm font-bold text-[#1A331B] hover:text-[#D4A017] transition-colors border-b-2 border-transparent hover:border-[#D4A017] pb-1">
              {t("heritagePage.categories.viewAll")} <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className={styles.categoriesGrid}>
            {[
              { icon: <Shirt size={18} />, title: t("heritagePage.categories.clothing"), img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776368082/photo_2026-04-16_22-30-38_jgmotv.jpg" },
              { icon: <Music size={18} />, title: t("heritagePage.categories.music"), img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601487/image_2026-04-19_10-15-04_jofbvm.png" },
              { icon: <Users size={18} />, title: t("heritagePage.categories.dance"), img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1781979624/Gemini_Generated_Image_pjkk9epjkk9epjkk_sr3fna.png" },
              { icon: <MessageCircle size={18} />, title: t("heritagePage.categories.threads"), img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776600765/2479dbfe-52dc-4cd5-aa49-c06eef7ad8c4_tpm9vx.jpg" },
            ].map((cat, i) => (
              <div key={i} className={styles.categoryCard}>
                <div className={styles.categoryImg} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                  <img src={cat.img} alt={cat.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </div>
                <div className={styles.categoryOverlay} />
                <div className={styles.categoryContent}>
                  <div className={styles.catIconWrapper}>{cat.icon}</div>
                  <h4 className={styles.catTitle}>{cat.title}</h4>
                  <span className={styles.catLink}>{t("heritagePage.categories.learnMore")} <ArrowRight size={10} className="inline" /></span>
                </div>
              </div>
            ))}
          </div>
        </section>
        </ScrollReveal>

        {/* ── 4. Timeline ── */}
        <ScrollReveal>
          <section className="py-20 md:py-32 bg-gray-50 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#1A331B]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#C89B3C]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="container mx-auto px-6 max-w-6xl relative z-10">
              <div className="text-center mb-16 md:mb-24">
                <span className="text-[#1A331B] font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs mb-3 block">{t("heritagePage.timeline.tag")}</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">{t("heritagePage.timeline.title")}</h2>
                <div className="w-24 h-1 bg-[#C89B3C] mx-auto rounded-full"></div>
              </div>

              <div className="relative">
                {/* Vertical Center Line */}
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-gray-300 to-transparent transform -translate-x-1/2"></div>

                <div className="space-y-16 md:space-y-24">
                  {/* Item 1 */}
                  <div className="relative flex flex-col md:flex-row items-center md:justify-between group">
                    <div className="md:w-5/12 mb-8 md:mb-0 text-center md:text-right w-full order-2 md:order-1 px-4 md:px-0">
                      <h3 className="text-2xl font-black text-[#1A331B] mb-3 mt-6 md:mt-0 flex flex-col md:flex-row items-center justify-center md:justify-end gap-3">
                        <div className="md:hidden w-12 h-12 rounded-full bg-white border-2 border-[#C89B3C] flex items-center justify-center text-[#1A331B] shadow-sm"><Landmark size={20}/></div>
                        {t("heritagePage.timeline.items.0.title")}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">{t("heritagePage.timeline.items.0.desc")}</p>
                    </div>
                    <div className="hidden md:flex absolute left-1/2 w-14 h-14 bg-white border-4 border-[#C89B3C] rounded-full items-center justify-center transform -translate-x-1/2 shadow-lg z-10 group-hover:scale-110 transition-transform duration-300">
                      <Landmark size={20} className="text-[#1A331B]" />
                    </div>
                    <div className="md:w-5/12 w-full order-1 md:order-3 px-4 md:px-0">
                      <div className="rounded-3xl overflow-hidden shadow-2xl aspect-video group-hover:shadow-3xl transition-shadow duration-300 w-full relative">
                        <img loading="lazy" src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1776594871/2b4e84d7-7330-4570-9b1a-40026b7ef58d_raoclx.jpg" alt="Kingdom Era" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      </div>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="relative flex flex-col md:flex-row-reverse items-center md:justify-between group">
                    <div className="md:w-5/12 mb-8 md:mb-0 text-center md:text-left w-full order-2 md:order-1 px-4 md:px-0">
                      <h3 className="text-2xl font-black text-[#1A331B] mb-3 mt-6 md:mt-0 flex flex-col md:flex-row items-center justify-center md:justify-start gap-3">
                        <div className="md:hidden w-12 h-12 rounded-full bg-[#1A331B] border-2 border-white flex items-center justify-center text-white shadow-sm"><Users size={20}/></div>
                        {t("heritagePage.timeline.items.1.title")}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">{t("heritagePage.timeline.items.1.desc")}</p>
                    </div>
                    <div className="hidden md:flex absolute left-1/2 w-14 h-14 bg-[#1A331B] border-4 border-white rounded-full items-center justify-center transform -translate-x-1/2 shadow-lg z-10 group-hover:scale-110 transition-transform duration-300">
                      <Users size={20} className="text-white" />
                    </div>
                    <div className="md:w-5/12 w-full order-1 md:order-3 px-4 md:px-0">
                      <div className="rounded-3xl overflow-hidden shadow-2xl aspect-video group-hover:shadow-3xl transition-shadow duration-300 w-full relative">
                        <img loading="lazy" src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1781979624/Gemini_Generated_Image_pjkk9epjkk9epjkk_sr3fna.png" alt="Traditional Governance" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      </div>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="relative flex flex-col md:flex-row items-center md:justify-between group">
                    <div className="md:w-5/12 mb-8 md:mb-0 text-center md:text-right w-full order-2 md:order-1 px-4 md:px-0">
                      <h3 className="text-2xl font-black text-[#1A331B] mb-3 mt-6 md:mt-0 flex flex-col md:flex-row items-center justify-center md:justify-end gap-3">
                        <div className="md:hidden w-12 h-12 rounded-full bg-white border-2 border-[#C89B3C] flex items-center justify-center text-[#1A331B] shadow-sm"><CheckCircle size={20}/></div>
                        {t("heritagePage.timeline.items.2.title")}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">{t("heritagePage.timeline.items.2.desc")}</p>
                    </div>
                    <div className="hidden md:flex absolute left-1/2 w-14 h-14 bg-white border-4 border-[#C89B3C] rounded-full items-center justify-center transform -translate-x-1/2 shadow-lg z-10 group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle size={20} className="text-[#1A331B]" />
                    </div>
                    <div className="md:w-5/12 w-full order-1 md:order-3 px-4 md:px-0">
                      <div className="rounded-3xl overflow-hidden shadow-2xl aspect-video group-hover:shadow-3xl transition-shadow duration-300 w-full relative">
                        <img loading="lazy" src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601487/image_2026-04-19_10-15-04_jofbvm.png" alt="Cultural Preservation" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      </div>
                    </div>
                  </div>

                  {/* Item 4 */}
                  <div className="relative flex flex-col md:flex-row-reverse items-center md:justify-between group">
                    <div className="md:w-5/12 mb-8 md:mb-0 text-center md:text-left w-full order-2 md:order-1 px-4 md:px-0">
                      <h3 className="text-2xl font-black text-[#1A331B] mb-3 mt-6 md:mt-0 flex flex-col md:flex-row items-center justify-center md:justify-start gap-3">
                        <div className="md:hidden w-12 h-12 rounded-full bg-[#1A331B] border-2 border-white flex items-center justify-center text-white shadow-sm"><Globe size={20}/></div>
                        {t("heritagePage.timeline.items.3.title")}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">{t("heritagePage.timeline.items.3.desc")}</p>
                    </div>
                    <div className="hidden md:flex absolute left-1/2 w-14 h-14 bg-[#1A331B] border-4 border-white rounded-full items-center justify-center transform -translate-x-1/2 shadow-lg z-10 group-hover:scale-110 transition-transform duration-300">
                      <Globe size={20} className="text-white" />
                    </div>
                    <div className="md:w-5/12 w-full order-1 md:order-3 px-4 md:px-0">
                      <div className="rounded-3xl overflow-hidden shadow-2xl aspect-video group-hover:shadow-3xl transition-shadow duration-300 w-full relative">
                        <img loading="lazy" src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037552/kambata/xgbjkfeo3ibguxasv38c.jpg" alt="Modern Kambata" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ── 5. Living in Harmony ── */}
        <ScrollReveal>
        <section className={styles.section}>
          <div className={styles.harmonySection}>
            <div className={styles.harmonyContent}>
              <span className={styles.sectionTitleSmallGreen} style={{ color: "#1a1a1a" }}>{t("heritagePage.harmony.tag")}</span>
              <h2 className={styles.sectionTitle} style={{ marginBottom: "16px" }} dangerouslySetInnerHTML={{ __html: t("heritagePage.harmony.title").replace(' & ', '<br/>& ') }}></h2>
              <p className={styles.harmonyDesc}>
                {t("heritagePage.harmony.desc")}
              </p>
              
              <div className={styles.harmonyList}>
                <div className={styles.harmonyListItem}>
                  <CheckCircle size={16} className={styles.harmonyCheck} /> {t("heritagePage.harmony.list.0")}
                </div>
                <div className={styles.harmonyListItem}>
                  <CheckCircle size={16} className={styles.harmonyCheck} /> {t("heritagePage.harmony.list.1")}
                </div>
                <div className={styles.harmonyListItem}>
                  <CheckCircle size={16} className={styles.harmonyCheck} /> {t("heritagePage.harmony.list.2")}
                </div>
                <div className={styles.harmonyListItem}>
                  <CheckCircle size={16} className={styles.harmonyCheck} /> {t("heritagePage.harmony.list.3")}
                </div>
              </div>
              
              <div className={styles.quoteBox}>
                <Quote size={24} className={styles.quoteIcon} fill="currentColor" />
                <div>
                  <p className={styles.quoteText}>{t("heritagePage.harmony.quote")}</p>
                  <span className={styles.quoteAuthor}>{t("heritagePage.harmony.author")}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.harmonyVideo}>
              <div className={styles.harmonyImg}>
                <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1781979180/Gemini_Generated_Image_mz1m22mz1m22mz1m_jueaj7.png" alt="Kambata Life" loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* ── 6. Cultural Gallery ── */}
        <ScrollReveal>
          <section className={`${styles.section} pt-12`}>
            <div className="text-center mb-10">
              <span className="text-[#0F766E] font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs mb-3 block">{t("heritagePage.gallery.tag")}</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-4">{t("heritagePage.gallery.title")}</h2>
              <Link href="/gallery" className="inline-flex items-center gap-2 text-sm font-bold text-[#1A331B] hover:text-[#D4A017] transition-colors border-b-2 border-transparent hover:border-[#D4A017] pb-1">
                {t("heritagePage.gallery.exploreBtn")} <ArrowRight size={16} />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:grid-rows-2 md:h-[500px]">
              <div className="col-span-2 row-span-1 md:row-span-2 aspect-video md:aspect-auto relative rounded-3xl overflow-hidden group">
                <img loading="lazy" src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1781979180/Gemini_Generated_Image_mz1m22mz1m22mz1m_jueaj7.png" alt="Gallery 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
              </div>
              <div className="aspect-square md:aspect-auto relative rounded-2xl md:rounded-3xl overflow-hidden group">
                <img loading="lazy" src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1776368170/imagekambata_etmd6j.png" alt="Gallery 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
              </div>
              <div className="aspect-square md:aspect-auto relative rounded-2xl md:rounded-3xl overflow-hidden group">
                <img loading="lazy" src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1776589710/Gemini_Generated_Image_2purzt2purzt2pur_xaqzdx.png" alt="Gallery 3" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
              </div>
              <div className="aspect-square md:aspect-auto relative rounded-2xl md:rounded-3xl overflow-hidden group">
                <img loading="lazy" src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1781983526/Gemini_Generated_Image_2awh092awh092awh_opipbz.jpg" alt="Gallery 4" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
              </div>
              <div className="aspect-square md:aspect-auto relative rounded-2xl md:rounded-3xl overflow-hidden group">
                <img loading="lazy" src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1781985033/Gemini_Generated_Image_95kpp795kpp795kp_afwdjp.jpg" alt="Gallery 5" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ── 7. Cultural Festivals ── */}
        <ScrollReveal>
          <section className={`${styles.section} pt-8 pb-16`}>
            <div className="text-center mb-10">
              <span className="text-[#0F766E] font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs mb-3 block">{t("heritagePage.festivals.tag")}</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-4">{t("heritagePage.festivals.title")}</h2>
              <Link href="/gallery" className="inline-flex items-center gap-2 text-sm font-bold text-[#1A331B] hover:text-[#D4A017] transition-colors border-b-2 border-transparent hover:border-[#D4A017] pb-1">
                {t("heritagePage.festivals.viewAll")} <ArrowRight size={16} />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {[
                { title: t("heritagePage.festivals.items.0.title"), date: t("heritagePage.festivals.items.0.date"), desc: t("heritagePage.festivals.items.0.desc"), loc: t("heritagePage.festivals.items.0.loc"), img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1781979624/Gemini_Generated_Image_pjkk9epjkk9epjkk_sr3fna.png" },
                { title: t("heritagePage.festivals.items.1.title"), date: t("heritagePage.festivals.items.1.date"), desc: t("heritagePage.festivals.items.1.desc"), loc: t("heritagePage.festivals.items.1.loc"), img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037552/kambata/xgbjkfeo3ibguxasv38c.jpg" },
                { title: t("heritagePage.festivals.items.2.title"), date: t("heritagePage.festivals.items.2.date"), desc: t("heritagePage.festivals.items.2.desc"), loc: t("heritagePage.festivals.items.2.loc"), img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037555/kambata/b3qw7fu7m2s0axp6lc5e.jpg" }
              ].map((fest, idx) => (
                <div key={idx} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col hover:-translate-y-2">
                  <div className="relative h-64 overflow-hidden">
                    <img loading="lazy" src={fest.img} alt={fest.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-bold text-[#1A331B] uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={12} className="text-[#D4A017]" /> {fest.date}
                    </div>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <h4 className="text-xl font-bold text-gray-900 mb-3">{fest.title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1">{fest.desc}</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0F766E] bg-[#0F766E]/5 py-2 px-3 rounded-lg w-fit">
                      <MapPin size={14} /> {fest.loc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>



        {/* ── 8. Preserving Our Heritage ── */}
        <ScrollReveal>
          <section className={`${styles.section}`}>
            <div className="bg-[#F8F7F2] rounded-3xl p-8 md:p-12 relative overflow-hidden">
              <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center relative z-10">
                {/* Left Content */}
                <div className="lg:w-1/2 text-center lg:text-left">
                  <span className="text-[#1A331B] font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs mb-4 block">{t("heritagePage.preserving.tag")}</span>
                  <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight leading-tight" dangerouslySetInnerHTML={{ __html: t("heritagePage.preserving.title").replace('Alive', '<span class="text-[#D4A017]">Alive</span>') }}></h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                    {t("heritagePage.preserving.desc")}
                  </p>
                  <button className="bg-[#1A331B] text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-[#D4A017] transition-colors duration-300 shadow-lg flex items-center gap-2 mx-auto lg:mx-0">
                    {t("heritagePage.preserving.btn")} <ArrowRight size={16} />
                  </button>
                </div>

                {/* Right Grid */}
                <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full">
                  {[
                    { title: t("heritagePage.preserving.items.0.title"), desc: t("heritagePage.preserving.items.0.desc"), icon: <MessageCircle size={24} /> },
                    { title: t("heritagePage.preserving.items.1.title"), desc: t("heritagePage.preserving.items.1.desc"), icon: <BookOpen size={24} /> },
                    { title: t("heritagePage.preserving.items.2.title"), desc: t("heritagePage.preserving.items.2.desc"), icon: <Music size={24} /> },
                    { title: t("heritagePage.preserving.items.3.title"), desc: t("heritagePage.preserving.items.3.desc"), icon: <Landmark size={24} /> },
                  ].map((item, idx) => (
                    <div key={idx} className="group p-6 rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                      <div className="w-12 h-12 rounded-full bg-[#F8F7F2] flex items-center justify-center text-[#1A331B] mb-5 group-hover:bg-[#1A331B] group-hover:text-white transition-colors duration-300">
                        {item.icon}
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ── 9. CTA ── */}
        <ScrollReveal>
        <section className={`${styles.section} ${styles.ctaSectionWrapper}`}>
          <div className={styles.ctaBanner} style={{ position: 'relative', overflow: 'hidden' }}>
            <img src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782038012/kambata/wiv5jowt9wkkt82rukal.png" alt="CTA" loading="lazy" decoding="async" className={styles.ctaBg} />
            <div className={styles.ctaOverlay} />
            
            <div className={styles.ctaContent}>
              <span className={styles.sectionTitleSmall} style={{ marginBottom: "12px" }}>{t("heritagePage.cta.tag")}</span>
              <h2 className="text-white">{t("heritagePage.cta.title")}</h2>
              <p>{t("heritagePage.cta.desc")}</p>
            </div>
            
            <div className={styles.ctaActions}>
              <Link href="/tours" className={styles.primaryBtn}>
                {t("heritagePage.cta.bookBtn")} <ArrowRight size={16} />
              </Link>
              <Link href="/explore" className={styles.btnSecondary}>
                {t("heritagePage.cta.exploreBtn")} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
        </ScrollReveal>

      </main>
      <Footer />

      {/* Video Modal */}
      {showVideo && (
        <div 
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setShowVideo(false)}
        >
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowVideo(false);
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
              title="Kambata Cultural Story" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeritagePage;
