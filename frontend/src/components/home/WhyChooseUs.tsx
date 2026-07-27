"use client";

import { motion } from "framer-motion";
import { Globe, Compass, Bus, Map, CheckCircle2, Users, MapPin, Award, ArrowRight } from "lucide-react";
import Image from "next/image";

const cards = [
  {
    id: 1,
    title: "Cultural Experiences",
    description: "Explore authentic Kambata traditions, local communities, food, and heritage.",
    icon: Globe,
    image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1777480767/image_2026-04-29_19-21-03_u5i9or.png"
  },
  {
    id: 2,
    title: "Guided Adventures",
    description: "Professional local guides leading unforgettable journeys.",
    icon: Compass,
    image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782068782/kambata/z1ywastrf42kyud4krbs.png"
  },
  {
    id: 3,
    title: "Private Tours",
    description: "Personalized travel experiences tailored to travelers.",
    icon: Bus,
    image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782038014/kambata/ibdkyyuqop0vx0zjvukw.jpg"
  },
  {
    id: 4,
    title: "Local Travel Experts",
    description: "Expert destination planning and local insights.",
    icon: Map,
    image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782071378/kambata/azwukolts7nkqs12np6o.jpg"
  }
];

const benefits = [
  "Verified Local Guides",
  "Safe & Secure Bookings",
  "Authentic Cultural Experiences",
  "Flexible Tour Packages",
  "Instant Support"
];

const stats = [
  { icon: Users, value: "500+", label: "Happy Travelers" },
  { icon: MapPin, value: "50+", label: "Destinations" },
  { icon: Compass, value: "30+", label: "Local Guides" },
  { icon: Award, value: "98%", label: "Satisfaction Rate" }
];

import { useLanguage } from "@/context/LanguageContext";

export default function WhyChooseUs() {
  const { t } = useLanguage();

  return (
    <section className="py-20 md:py-32 bg-[#F8F7F2] overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-20 items-center overflow-hidden">
          
          {/* Left Side: Cards Grid (55% on desktop) */}
          <div className="w-full lg:w-[55%] grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 relative">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className={`relative group rounded-[24px] overflow-hidden shadow-lg h-[320px] sm:h-[360px] cursor-pointer ${
                  index % 2 === 1 ? "sm:mt-12" : "" // Staggered layout on desktop
                }`}
              >
                {/* Background Image */}
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 27vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                
                {/* Pacific-style Icon Container (Top Left) */}
                <div className="absolute top-0 left-0 bg-[#0F766E]/90 backdrop-blur-md p-5 rounded-br-[24px] shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                  <card.icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
                
                {/* Card Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-xl md:text-2xl font-black text-white mb-3 tracking-tight">
                    {t(`home.whyChooseUs.card_${card.id}_title`) || card.title}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    {t(`home.whyChooseUs.card_${card.id}_desc`) || card.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Side: Content & CTA (45% on desktop) */}
          <div className="w-full lg:w-[45%] flex flex-col justify-center order-first lg:order-last">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[#0F766E] font-[800] uppercase tracking-[0.15em] text-[0.7rem] mb-4 block">
                {t('home.whyChooseUs.tag') || "DISCOVER KAMBATA"}
              </span>
              
              <h2 className="text-[2rem] font-[800] text-[#1a1a1a] mb-6 tracking-tight leading-[1.2]">
                {t('home.whyChooseUs.title') || "Start Your Next Adventure With Confidence"}
              </h2>
              
              <p className="text-gray-500 text-[0.85rem] leading-[1.6] mb-8">
                {t('home.whyChooseUs.desc') || "Experience breathtaking landscapes, rich cultural heritage, professional guides, and unforgettable adventures across the Kambata region. We connect travelers with authentic experiences while ensuring comfort, safety, and memorable journeys."}
              </p>
              
              <div className="flex flex-col gap-4 mb-10">
                {benefits.map((benefit, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    className="flex items-center gap-3"
                  >
                    <div className="bg-[#0F766E]/10 rounded-full p-1">
                      <CheckCircle2 className="w-5 h-5 text-[#0F766E]" />
                    </div>
                    <span className="text-gray-800 font-[700] text-[0.85rem]">{t(`home.whyChooseUs.benefit_${idx + 1}`) || benefit}</span>
                  </motion.div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-[#0F766E] hover:bg-[#0d645d] text-white px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-[0_8px_20px_rgba(15,118,110,0.3)] hover:shadow-[0_12px_25px_rgba(15,118,110,0.4)] hover:-translate-y-1 group">
                  {t('home.whyChooseUs.btnExplore') || "Explore Tours"} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-8 py-4 rounded-full font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
                  {t('home.whyChooseUs.btnLearn') || "Learn More"}
                </button>
              </div>
            </motion.div>
          </div>
          
        </div>

        {/* Animated Statistics Row */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-24 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 md:p-12"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x-0 md:divide-x divide-gray-100">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 bg-[#0F766E]/10 rounded-2xl flex items-center justify-center mb-4 text-[#0F766E]">
                  <stat.icon className="w-6 h-6" />
                </div>
                <h4 className="text-[1.5rem] font-[900] text-[#1a1a1a] mb-1">{stat.value}</h4>
                <p className="text-[0.75rem] font-[600] text-gray-500 uppercase tracking-wider">{t(`home.stats.label_${idx + 1}`) || stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
