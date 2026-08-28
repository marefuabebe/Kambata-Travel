"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, MapPin, Star, Building } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useLanguage } from "@/context/LanguageContext";
import styles from "@/app/Home.module.css";
import ScrollReveal from "@/components/ScrollReveal";
import { motion } from "framer-motion";

const Hotels = () => {
  const { t, language } = useLanguage();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotels = async () => {
      const FALLBACK_HOTELS = [
        {
          _id: "h1",
          name: "Durame Grand Hotel",
          location: "Durame",
          rating: { average: 4.8 },
          images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1776362718/Gemini_Generated_Image_bmo32hbmo32hbmo3_axyzig.png"],
          description: "A luxurious stay with breathtaking views of Kambata's vibrant landscapes."
        },
        {
          _id: "h2",
          name: "Shinshcho Resort",
          location: "Shinshcho",
          rating: { average: 4.6 },
          images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037994/kambata/xbsw2ajsabbtz4tuwjvl.jpg"],
          description: "Experience absolute tranquility and modern comforts in Shinshcho."
        },
        {
          _id: "h3",
          name: "Kambata Valley Lodge",
          location: "Durame",
          rating: { average: 4.7 },
          images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1782068782/kambata/z1ywastrf42kyud4krbs.png"],
          description: "Eco-friendly lodge offering an authentic cultural immersion."
        },
        {
          _id: "h4",
          name: "Hadero Boutique Hotel",
          location: "Other",
          rating: { average: 4.5 },
          images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1776594871/2b4e84d7-7330-4570-9b1a-40026b7ef58d_raoclx.jpg"],
          description: "A cozy retreat perfect for relaxing after a day of hiking and exploration."
        }
      ];

      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/hotels`);
        if (res.data?.success && res.data.data?.length > 0) {
          const fetchedHotels = res.data.data;
          // Ensure we always have at least 4 for the grid by appending fallbacks if necessary
          let updatedHotels = [...fetchedHotels];
          while (updatedHotels.length < 4) {
            updatedHotels.push(FALLBACK_HOTELS[updatedHotels.length % FALLBACK_HOTELS.length]);
          }
          // Filter out Aberash and Mintesnot Hotels for the landing page
          const filteredHotels = updatedHotels.filter(h => 
            !h.name.toLowerCase().includes('aberash') && 
            !h.name.toLowerCase().includes('mintesnot') &&
            !h.name.toLowerCase().includes('wojo')
          );
          setHotels(filteredHotels);
        } else {
          setHotels(FALLBACK_HOTELS);
        }
      } catch (err) {
        console.error("Error fetching hotels, using fallback:", err);
        setHotels(FALLBACK_HOTELS);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Translation helpers
  const getTranslatedLocation = (loc: string) => {
    if (language === 'am') {
      const locMap: Record<string, string> = {
        "Durame": "ዱራሜ",
        "Shinshcho": "ሽንሽቾ",
        "Other": "ሌላ"
      };
      return locMap[loc] || loc;
    }
    return loc;
  };

  const getTranslatedHotelName = (name: string) => {
    if (language === 'am') {
      const nameMap: Record<string, string> = {
        "Durame Grand Hotel": "የዱራሜ ግራንድ ሆቴል",
        "Shinshcho Resort": "የሽንሽቾ ሪዞርት",
        "Kambata Valley Lodge": "የከምባታ ሸለቆ ሎጅ",
        "Hadero Boutique Hotel": "ሀዴሮ ቡቲክ ሆቴል"
      };
      return nameMap[name] || name;
    }
    return name;
  };

  const getTranslatedHotelDesc = (desc: string) => {
    if (language === 'am') {
      const descMap: Record<string, string> = {
        "A luxurious stay with breathtaking views of Kambata's vibrant landscapes.": "አስደናቂ የከምባታ መልክዓ ምድሮችን የሚመለከት የቅንጦት ቆይታ።",
        "Experience absolute tranquility and modern comforts in Shinshcho.": "በሽንሽቾ ውስጥ ፍጹም መረጋጋትን እና ዘመናዊ ምቾትን ይለማመዱ።",
        "Eco-friendly lodge offering an authentic cultural immersion.": "እውነተኛ የባህል ተሞክሮ የሚያቀርብ ተፈጥሮን የሚንከባከብ ሎጅ።",
        "A cozy retreat perfect for relaxing after a day of hiking and exploration.": "ከእግር ጉዞ እና ማሰስ በኋላ ለመዝናናት ፍጹም የሆነ ምቹ ማረፊያ።"
      };
      return descMap[desc] || desc;
    }
    return desc;
  };

  return (
    <ScrollReveal>
      <section className={styles.section} style={{ paddingTop: "20px" }}>
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center"
          >
            <span className="text-[#0F766E] font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs mb-3 block">
              {t('home.hotelsTag') || (language === 'am' ? "የደጋው ምቹ ማረፊያዎች" : "HIGHLAND RETREATS & STAYS")}
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
              {t('home.hotelsTitle') || (language === 'am' ? "የእኛ ሆቴሎች" : "Our Hotels")}
            </h2>
            <p className="text-gray-500 font-medium text-sm sm:text-base leading-relaxed">
              {t('home.hotelsDesc') || (language === 'am' ? "በከምባታ ግርማ ሞገስ ባላቸው ተራሮችና ውብ ተፈጥሮ መካከል እውነተኛ የኢትዮጵያ አቀባበልና ምቾትን ይለማመዱ። ለዕረፍትዎ የተመረጡ ውብና ምቹ ማረፊያዎች።" : "Unwind in comfort surrounded by Kambata's majestic highland peaks. From eco-resorts overlooking mist-shrouded valleys to boutique city stays, discover handpicked accommodations for a restful journey.")}
            </p>
          </motion.div>
        </div>

        <div className={styles.toursGrid}>
          {hotels.map((hotel, idx) => {
            const minPrice = hotel.roomTypes && hotel.roomTypes.length > 0
              ? Math.min(...hotel.roomTypes.map((rt: any) => rt.pricePerNight))
              : 0;

            return (
              <motion.div 
                key={hotel._id || idx} 
                className={`${styles.tourCard} group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-400`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
              >
                <div className={styles.tourImageWrapper}>
                  <img
                    src={hotel.images?.[0] || "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776362718/Gemini_Generated_Image_bmo32hbmo32hbmo3_axyzig.png"}
                    alt={hotel.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1 text-gray-900 text-[10px] font-bold shadow-sm">
                    <Star size={12} className="fill-[#D4A017] text-[#D4A017]" />
                    {hotel.rating?.average || 4.5}
                  </div>
                </div>
                <div className={styles.tourContent}>
                  <h3 className={styles.tourTitle}>{getTranslatedHotelName(hotel.name)}</h3>
                  <div className={styles.tourMeta} style={{ marginBottom: '16px' }}>
                    <div className={styles.tourMetaItem}><MapPin size={14} /> {getTranslatedLocation(hotel.location)}</div>
                    <div className={styles.tourMetaItem}>•</div>
                    <div className={styles.tourMetaItem}><Building size={14} /> {t('home.hotel') || (language === 'am' ? "ሆቴል" : "Hotel")}</div>
                  </div>
                  <div className={styles.tourFooter} style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #eee' }}>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                      {getTranslatedHotelDesc(hotel.description) || (language === 'am' ? "ምቹ ቆይታ እና ምርጥ አገልግሎት የሚሰጥ ውብ ሆቴል።" : "A beautiful hotel offering comfortable stays and excellent service.")}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </ScrollReveal>
  );
};

export default Hotels;

