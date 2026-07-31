"use client";

import React, { useRef, useState } from "react";
import styles from "./About.module.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { 
  ArrowRight, Play, MapPin, Users, Leaf, 
  ShieldCheck, Heart, Star, CheckCircle, Mountain, 
  TreePine, Compass, Award, Shield, UserCheck, Quote, Camera, X
} from "lucide-react";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

const AboutPage = () => {
  const { t } = useLanguage();
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.mainContent}>
        {/* ── 1. Hero Section ── */}
        <section className={styles.heroSection}>
          <img loading="eager" fetchPriority="high" src={"https://res.cloudinary.com/dzf4st3t2/image/upload/v1776589710/Gemini_Generated_Image_2purzt2purzt2pur_xaqzdx.png".replace('/upload/', '/upload/f_auto,q_auto,w_1920/')} className={styles.heroBg} alt="Kambata Locals" />
          <div className={styles.heroOverlay} />
          
          <motion.div 
            className={styles.heroContent}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className={styles.heroTag}>{t("aboutPage.hero.tag")}</span>
            <h1 className={styles.heroTitle}>{t("aboutPage.hero.title")}</h1>
            <p className={styles.heroSub}>
              {t("aboutPage.hero.sub")}
            </p>
            <div className={styles.heroActions}>
              <Link href="#kambata-story" className={styles.primaryBtn}>
                {t("aboutPage.hero.btnStory")} <ArrowRight size={16} />
              </Link>
              <button 
                className={styles.outlineBtn} 
                onClick={(e) => {
                  e.preventDefault();
                  setShowVideo(true);
                }}
              >
                {t("aboutPage.hero.btnVideo")} <Play size={16} />
              </button>
            </div>
          </motion.div>
        </section>

        {/* ── 2. Floating Stats Section ── */}
        <section className="relative z-10 -mt-10 md:-mt-20 px-4 md:px-6 max-w-[1400px] mx-auto w-full">
          <ScrollReveal>
            <div className="bg-white/90 md:bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl md:rounded-3xl p-6 md:p-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12 text-center">
                {[
                  { count: "1000+", label: t("aboutPage.stats.travelers"), icon: <Users className="w-6 h-6 md:w-7 md:h-7 text-[#0F766E]" /> },
                  { count: "50+", label: t("aboutPage.stats.destinations"), icon: <MapPin className="w-6 h-6 md:w-7 md:h-7 text-[#0F766E]" /> },
                  { count: "30+", label: t("aboutPage.stats.guides"), icon: <UserCheck className="w-6 h-6 md:w-7 md:h-7 text-[#0F766E]" /> },
                  { count: "98%", label: t("aboutPage.stats.satisfaction"), icon: <Star className="w-6 h-6 md:w-7 md:h-7 text-[#0F766E]" /> },
                ].map((stat, i) => (
                  <motion.div 
                    key={i} 
                    className="flex flex-col items-center gap-2 md:gap-3"
                  >
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-[#F8F9F5] flex items-center justify-center">
                      {stat.icon}
                    </div>
                    <div className="text-2xl md:text-4xl font-black text-[#1A331B]">{stat.count}</div>
                    <div className="text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ── 3. Our Story Section ── */}
        <ScrollReveal delay={0.1}>
        <section className={styles.section} style={{ paddingTop: "100px" }}>
          <div className={`${styles.storySection} bg-[#F8F9F5] md:bg-transparent rounded-[24px] md:rounded-none overflow-hidden md:overflow-visible`}>
            {/* Desktop Left / Mobile Top */}
            <div className={`${styles.storyImageWrapper} !rounded-none md:!rounded-3xl`}>
              <img loading="lazy" src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1776368082/photo_2026-04-16_22-30-38_jgmotv.jpg" className={`${styles.storyImage} object-top md:object-center`} alt="Kambata Village" />
            </div>
            
            {/* Desktop Right / Mobile Bottom */}
            <div className={`${styles.storyContent} p-6 pb-8 md:p-0`}>
              <span className={styles.sectionTitleSmall}>{t("aboutPage.story.tag")}</span>
              <h2 className={styles.storyTitle}>{t("aboutPage.story.title")}</h2>
              <p className={styles.storyDesc}>
                {t("aboutPage.story.p1")}
              </p>
              <p className={styles.storyDesc}>
                {t("aboutPage.story.p2")}
              </p>
              
              <div className="grid grid-cols-2 md:flex md:flex-col gap-3 md:gap-5 mt-8 md:mt-8">
                <div className="bg-white md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left shadow-[0_4px_12px_rgba(0,0,0,0.03)] md:shadow-none">
                  <div className="text-[#D4A017] md:text-[#0F766E] md:bg-[#0F766E]/10 md:p-3 md:rounded-full"><MapPin size={28} className="md:w-5 md:h-5" strokeWidth={1.5} /></div>
                  <div>
                    <h4 className="font-bold text-[13px] md:text-base text-gray-900 leading-tight">{t("aboutPage.story.locallyOwned.title")}</h4>
                    <p className="hidden md:block text-gray-600 text-sm mt-1">{t("aboutPage.story.locallyOwned.desc")}</p>
                  </div>
                </div>
                <div className="bg-white md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left shadow-[0_4px_12px_rgba(0,0,0,0.03)] md:shadow-none">
                  <div className="text-[#D4A017] md:text-[#0F766E] md:bg-[#0F766E]/10 md:p-3 md:rounded-full"><Users size={28} className="md:w-5 md:h-5" strokeWidth={1.5} /></div>
                  <div>
                    <h4 className="font-bold text-[13px] md:text-base text-gray-900 leading-tight">{t("aboutPage.story.communityFocused.title")}</h4>
                    <p className="hidden md:block text-gray-600 text-sm mt-1">{t("aboutPage.story.communityFocused.desc")}</p>
                  </div>
                </div>
                <div className="bg-white md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left shadow-[0_4px_12px_rgba(0,0,0,0.03)] md:shadow-none">
                  <div className="text-[#D4A017] md:text-[#0F766E] md:bg-[#0F766E]/10 md:p-3 md:rounded-full"><Leaf size={28} className="md:w-5 md:h-5" strokeWidth={1.5} /></div>
                  <div>
                    <h4 className="font-bold text-[13px] md:text-base text-gray-900 leading-tight">{t("aboutPage.story.sustainable.title")}</h4>
                    <p className="hidden md:block text-gray-600 text-sm mt-1">{t("aboutPage.story.sustainable.desc")}</p>
                  </div>
                </div>
                {/* 4th item only visible on mobile to complete the 2x2 grid */}
                <div className="bg-white md:hidden p-4 rounded-2xl flex flex-col items-center gap-2 text-center shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                  <div className="text-[#D4A017]"><Award size={28} strokeWidth={1.5} /></div>
                  <div>
                    <h4 className="font-bold text-[13px] text-gray-900 leading-tight">{t("aboutPage.story.authentic.title")}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* ── 4. Experience Kambata (NEW) ── */}
        <ScrollReveal>
        <section className={`${styles.section} bg-[#F8F9F5]`}>
          <div className="text-center mb-12">
            <span className={styles.sectionTitleSmall}>{t("aboutPage.experience.tag")}</span>
            <h2 className={styles.sectionTitle}>{t("aboutPage.experience.title")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: t("aboutPage.experience.items.0"), icon: <TreePine size={24} />, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037952/kambata/eadxdia83stxqodxf3vd.png" },
              { title: t("aboutPage.experience.items.1"), icon: <Users size={24} />, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601590/image_2026-04-19_10-19-03_2_geb4jw.png" },
              { title: t("aboutPage.experience.items.2"), icon: <Compass size={24} />, img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037883/kambata/bmq1irrn8nugtb0z2ztg.jpg" },
            ].map((exp, i) => (
              <motion.div 
                key={i}
                className="group relative h-[400px] rounded-3xl overflow-hidden cursor-pointer shadow-lg"
                whileHover={{ scale: 1.03, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                transition={{ duration: 0.4 }}
              >
                <img src={exp.img} alt={exp.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 text-white">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 border border-white/30">
                    {exp.icon}
                  </div>
                  <h3 className="text-2xl font-bold">{exp.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
        </ScrollReveal>

        {/* ── 5. Why Choose Us ── */}
        <ScrollReveal>
        <section className={styles.section}>
          <div className="text-center mb-8 md:mb-12">
            <span className={styles.sectionTitleSmall}>{t("aboutPage.whyChooseUs.tag")}</span>
            <h2 className={styles.sectionTitle}>{t("aboutPage.whyChooseUs.title")}</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {[
              { title: t("aboutPage.whyChooseUs.items.0.title"), icon: <Award className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />, desc: t("aboutPage.whyChooseUs.items.0.desc") },
              { title: t("aboutPage.whyChooseUs.items.1.title"), icon: <MapPin className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />, desc: t("aboutPage.whyChooseUs.items.1.desc") },
              { title: t("aboutPage.whyChooseUs.items.2.title"), icon: <Leaf className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />, desc: t("aboutPage.whyChooseUs.items.2.desc") },
              { title: t("aboutPage.whyChooseUs.items.3.title"), icon: <Shield className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />, desc: t("aboutPage.whyChooseUs.items.3.desc") },
              { title: t("aboutPage.whyChooseUs.items.4.title"), icon: <Heart className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />, desc: t("aboutPage.whyChooseUs.items.4.desc") },
              { title: t("aboutPage.whyChooseUs.items.5.title"), icon: <Users className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />, desc: t("aboutPage.whyChooseUs.items.5.desc") },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                className="bg-white p-4 md:p-8 rounded-2xl border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 flex flex-col items-center md:items-start text-center md:text-left"
                whileHover={{ y: -5 }}
              >
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E] mb-3 md:mb-6">
                  {feature.icon}
                </div>
                <h4 className="text-[13px] md:text-xl font-bold text-gray-900 mb-1 md:mb-3 leading-tight">{feature.title}</h4>
                <p className="text-gray-500 md:text-gray-600 text-[11px] md:text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
        </ScrollReveal>

        {/* ── 6. Our Values Section ── */}
        <ScrollReveal>
        <section className={`${styles.section} bg-[#F8F9F5]`}>
          <div className={styles.valuesSection}>
            <span className={styles.sectionTitleSmall}>{t("aboutPage.values.tag")}</span>
            <h2 className={styles.sectionTitle} style={{ marginBottom: "20px" }}>{t("aboutPage.values.title")}</h2>
            
            <div className={styles.valuesGrid}>
              <div className={styles.valueCard}>
                <ShieldCheck className={styles.valueIcon} size={32} strokeWidth={1.5} />
                <h4 className={styles.valueTitle}>{t("aboutPage.values.items.0.title")}</h4>
                <p className={styles.valueDesc}>{t("aboutPage.values.items.0.desc")}</p>
              </div>
              <div className={styles.valueCard}>
                <Users className={styles.valueIcon} size={32} strokeWidth={1.5} />
                <h4 className={styles.valueTitle}>{t("aboutPage.values.items.1.title")}</h4>
                <p className={styles.valueDesc}>{t("aboutPage.values.items.1.desc")}</p>
              </div>
              <div className={styles.valueCard}>
                <Leaf className={styles.valueIcon} size={32} strokeWidth={1.5} />
                <h4 className={styles.valueTitle}>{t("aboutPage.values.items.2.title")}</h4>
                <p className={styles.valueDesc}>{t("aboutPage.values.items.2.desc")}</p>
              </div>
              <div className={styles.valueCard}>
                <Star className={styles.valueIcon} size={32} strokeWidth={1.5} />
                <h4 className={styles.valueTitle}>{t("aboutPage.values.items.3.title")}</h4>
                <p className={styles.valueDesc}>{t("aboutPage.values.items.3.desc")}</p>
              </div>
              <div className={styles.valueCard}>
                <Heart className={styles.valueIcon} size={32} strokeWidth={1.5} />
                <h4 className={styles.valueTitle}>{t("aboutPage.values.items.4.title")}</h4>
                <p className={styles.valueDesc}>{t("aboutPage.values.items.4.desc")}</p>
              </div>
            </div>
          </div>
        </section>
        </ScrollReveal>


        {/* ── 8. Meet Our Team Section ── */}
        <ScrollReveal>
        <section className={`${styles.section} bg-[#F8F9F5]`}>
          <div className={styles.sectionHeader} style={{ justifyContent: "center", textAlign: "center", marginBottom: "40px" }}>
            <div>
              <span className={styles.sectionTitleSmall}>{t("aboutPage.team.tag")}</span>
              <h2 className={styles.sectionTitle}>{t("aboutPage.team.title")}</h2>
            </div>
          </div>

          <div className={styles.teamGrid}>
            {[
              { name: "Marefu A", role: t("aboutPage.team.items.0.role"), img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1777725394/kambata-travel/profiles/image-1777725393365-567164316_wpvwvm.jpg" },
              { name: "Saron T.", role: t("aboutPage.team.items.1.role"), img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782404767/unnamed_-_2025-10-21T233926.275_qibhv7.jpg" },
              { name: "Melese G.", role: t("aboutPage.team.items.2.role"), img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782404784/unnamed_48_itukah.jpg" },
              { name: "Hirut A.", role: t("aboutPage.team.items.3.role"), img: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782404899/Generated_Image_October_02_2025_-_10_35AM_gcom7u.png" },
            ].map((member, idx) => (
              <motion.div 
                key={idx} 
                className={styles.teamCard}
                whileHover={{ y: -5 }}
              >
                <img loading="lazy" src={member.img} alt={member.name} className={styles.teamImg} />
                <h4 className={styles.teamName}>{member.name}</h4>
                <span className={styles.teamRole}>{member.role}</span>
                <div className="flex gap-3 mt-3 items-center text-[#0F766E]/60">
                  <a href="#" className="hover:text-[#D4A017] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  </a>
                  <a href="#" className="hover:text-[#D4A017] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                  </a>
                  <a href="#" className="hover:text-[#D4A017] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                  </a>
                  <a href="#" className="hover:text-[#D4A017] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  </a>
                  <a href="#" className="hover:text-[#D4A017] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
        </ScrollReveal>

        {/* ── 9. The Kambata Story (Integrated) ── */}
        <section id="kambata-story" className="bg-[#F8F9F5] overflow-hidden py-16 md:py-24">
          
          {/* Story Introduction (2-column) */}
          <div className="max-w-[1400px] mx-auto px-0 md:px-10 flex flex-col xl:grid xl:grid-cols-[45%_55%] gap-0 xl:gap-16 items-center mb-10 md:mb-20">
            {/* Left: Image */}
            <motion.div 
              className="relative w-full !rounded-none md:!rounded-3xl overflow-hidden group md:shadow-xl"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="w-full h-[300px] md:h-[350px] xl:h-[550px] overflow-hidden !rounded-none md:!rounded-[24px]">
                <img 
                  loading="lazy" 
                  src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782325908/Gemini_Generated_Image_ci9y50ci9y50ci9y_uxxiua.png" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  alt="The Kambata Story" 
                />
              </div>
            </motion.div>

            {/* Right: Text Content */}
            <motion.div 
              className="w-full px-6 py-8 md:px-0 md:py-0"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            >
              <h2 className="text-[32px] md:text-[40px] xl:text-[48px] font-bold text-gray-900 leading-tight mb-2">
                {t("aboutPage.history.title")}
              </h2>
              <h3 className="text-[#D4A017] italic text-lg xl:text-xl font-playfair mb-8">
                {t("aboutPage.history.subtitle")}
              </h3>
              
              <div className="space-y-6 text-gray-600 leading-[1.8] text-[15px] xl:text-base">
                <p>
                  {t("aboutPage.history.p1")}
                </p>
                <p>
                  {t("aboutPage.history.p2")}
                </p>
                <p>
                  {t("aboutPage.history.p3")}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Embedded Timeline with Image Background */}
          <div className="mb-16 relative rounded-3xl overflow-hidden py-8 lg:py-10 px-4 lg:px-8 shadow-2xl mx-4 lg:mx-auto max-w-[1400px]">
            {/* Background Image & Overlay */}
            <img 
              loading="lazy" 
              src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782038005/kambata/dqqdx098zh4nieljug3t.jpg" 
              className="absolute inset-0 w-full h-full object-cover" 
              alt="Kambata Timeline Background" 
            />
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

            <div className="relative z-10">
              <div className="text-center mb-6">
                <h3 className="text-[24px] md:text-[30px] font-bold text-white">{t("aboutPage.history.timeline.title")}</h3>
              </div>
              
              <div className="relative max-w-6xl mx-auto px-0 xl:px-4">
                {/* Desktop Horizontal Line */}
                <div className="hidden xl:block absolute top-[20px] left-[10%] right-[10%] h-[2px] bg-[#D4A017]/30" />
                
                {/* Mobile Vertical Line (Centered for Zigzag) */}
                <div className="xl:hidden absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-[#D4A017]/30" />

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 xl:gap-5 relative z-10 py-4 xl:py-0">
                  {[
                    { title: t("aboutPage.history.timeline.items.0.title"), desc: t("aboutPage.history.timeline.items.0.desc") },
                    { title: t("aboutPage.history.timeline.items.1.title"), desc: t("aboutPage.history.timeline.items.1.desc") },
                    { title: t("aboutPage.history.timeline.items.2.title"), desc: t("aboutPage.history.timeline.items.2.desc") },
                    { title: t("aboutPage.history.timeline.items.3.title"), desc: t("aboutPage.history.timeline.items.3.desc") },
                  ].map((milestone, i) => (
                    <motion.div 
                      key={i} 
                      className="flex xl:flex-col items-center relative group cursor-default h-full w-full"
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.6, delay: i * 0.15 }}
                    >
                      {/* Node Marker - Centered vertically and horizontally on mobile */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 xl:relative xl:top-auto xl:left-auto xl:translate-x-0 xl:translate-y-0 w-8 h-8 md:w-10 md:h-10 xl:w-10 xl:h-10 rounded-full bg-[#111] border-[3px] xl:border-4 border-[#111] shadow-[0_0_0_2px_rgba(212,160,23,0.3)] group-hover:shadow-[0_0_0_2px_#D4A017] flex items-center justify-center transition-all duration-300 z-10 flex-shrink-0 shrink-0 xl:mb-4">
                        <div className="w-2.5 h-2.5 xl:w-3 xl:h-3 rounded-full bg-[#D4A017] group-hover:bg-white transition-colors duration-300" />
                      </div>
                      
                      {/* Content Card - Alternates Left/Right on mobile */}
                      <div className={`w-[calc(50%-22px)] xl:w-full bg-white/10 backdrop-blur-md p-3 md:p-5 xl:p-5 rounded-2xl shadow-sm border border-white/10 group-hover:bg-white/20 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 flex flex-col justify-center xl:flex-1 ${
                        i % 2 === 0 ? 'mr-auto xl:mr-0 text-right xl:text-center' : 'ml-auto xl:ml-0 text-left xl:text-center'
                      }`}>
                        <h4 className="font-bold text-white mb-1 md:mb-2 xl:mb-2 text-[13px] md:text-[15px] xl:text-base leading-tight">{milestone.title}</h4>
                        <p className="text-white/70 text-[11px] md:text-xs xl:text-[13px] leading-relaxed">{milestone.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Closing Quote */}
          <motion.div 
            className="max-w-[1400px] mx-auto px-5 md:px-10 text-center relative"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="max-w-4xl mx-auto bg-white/40 backdrop-blur-md border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-[#D4A017] rounded-b-full" />
              <p className="text-[20px] md:text-[28px] lg:text-[32px] font-playfair italic text-[#14532D] font-bold leading-tight md:leading-snug">
                {t("aboutPage.history.quote")}
              </p>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-[#D4A017] rounded-t-full" />
            </div>
          </motion.div>

        </section>

        {/* ── 11. CTA Section ── */}
        <ScrollReveal>
        <section className={styles.section} style={{ padding: "0" }}>
          <div className="relative rounded-3xl overflow-hidden mt-8 mb-16 mx-4 md:mx-auto max-w-[1400px] shadow-2xl">
            <img loading="lazy" src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782038005/kambata/dqqdx098zh4nieljug3t.jpg" className="absolute inset-0 w-full h-full object-cover" alt="CTA Background" />
            <div className="relative z-10 py-[60px] px-[40px] text-center max-w-3xl mx-auto">
              <span className="text-[#D4A017] font-playfair italic text-[1rem] mb-2 block">{t("aboutPage.cta.tag")}</span>
              <h2 className="text-[1.75rem] font-[800] text-white mb-[12px]">{t("aboutPage.cta.title")}</h2>
              <p className="text-[0.9rem] text-white/80 mb-[30px]">
                {t("aboutPage.cta.desc")}
              </p>
              
              <div className="flex flex-row items-center justify-center gap-[16px]">
                <Link href="/tours" className="bg-[#0F766E] hover:bg-[#14532D] text-white px-[28px] py-[12px] rounded-full font-[600] text-[0.9rem] transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0">
                  {t("aboutPage.cta.btnTours")} <ArrowRight size={16} />
                </Link>
                <Link href="/contact" className="bg-[#C89B3C] hover:bg-[#B68A2E] text-white px-[28px] py-[12px] rounded-full font-[600] text-[0.9rem] transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0">
                  {t("aboutPage.cta.btnContact")} <ArrowRight size={16} />
                </Link>
              </div>
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
              title="Kambata Story" 
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

export default AboutPage;
