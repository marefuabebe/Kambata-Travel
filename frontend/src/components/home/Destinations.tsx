"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import Image from "next/image";
import apiClient from "@/utils/apiClient";
import { useLanguage } from "@/context/LanguageContext";

const Destinations = () => {
  const { t, language } = useLanguage();
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDests = async () => {
      const dojeeDest = {
        _id: "dojee123",
        name: { en: "The Majestic Doje'e Waterfall", am: "ታላቁ የዶጄ ፏፏቴ" },
        description: { 
          en: "Experience the breathtaking beauty of The Majestic Doje'e Waterfall, a hidden gem nestled deep within the lush landscapes of Kambata.",
          am: "በከምባታ ለምለም መልክዓ ምድሮች ውስጥ ተደብቆ የሚገኘውን አስደናቂውን የዶጄ ፏፏቴ ውበት ይለማመዱ።"
        },
        location: { woreda: { en: "Hadero", am: "ሀደሮ" } },
        images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1782053030/kambata/g146rbijvhsiwutsgf3x.jpg"],
        likes: 520
      };
      
      const GALLERY_FALLBACKS = [
        { _id: "ajora123", name: { en: "Ajora Falls", am: "አጆራ ፏፏቴ" }, description: { en: "Discover the spectacular twin waterfalls of Ajora.", am: "የአጆራ አስደናቂ መንታ ፏፏቴዎችን ያግኙ።" }, images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037881/kambata/gxxovihnkuiueo63dosk.png"], likes: 245 },
        dojeeDest,
        { _id: "hambericho123", name: { en: "Mount Hambericho", am: "ሀምበሪቾ ተራራ" }, description: { en: "Hike the 777 steps to the peak for panoramic views.", am: "ለአካባቢው አጠቃላይ እይታ 777 ደረጃዎችን ይውጡ።" }, images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1782068782/kambata/z1ywastrf42kyud4krbs.png"], likes: 189 },
        { _id: "f1", name: { en: "Traditional Attire", am: "የባህል አልባሳት" }, location: { woreda: { en: "Culture", am: "ባህል" } }, images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601590/image_2026-04-19_10-19-03_2_geb4jw.png"], likes: 312 },
        { _id: "f2", name: { en: "Sarobita Valley", am: "ሳሮቢታ ሸለቆ" }, location: { woreda: { en: "Tembaro", am: "ጠምባሮ" } }, images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1776362718/Gemini_Generated_Image_bmo32hbmo32hbmo3_axyzig.png"], likes: 156 },
        { _id: "f3", name: { en: "Traditional Music", am: "የባህል ሙዚቃ" }, location: { woreda: { en: "Culture", am: "ባህል" } }, images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1776594871/2b4e84d7-7330-4570-9b1a-40026b7ef58d_raoclx.jpg"], likes: 98 },
        { _id: "f4", name: { en: "Gamosha Hot Spring", am: "ጋሞሻ ፍል ውሃ" }, location: { woreda: { en: "Nature", am: "ተፈጥሮ" } }, images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037934/kambata/ovq6lovr2deyvofv0eyi.png"], likes: 177 },
        { _id: "f5", name: { en: "Local Craft Market", am: "የአካባቢ የእደ ጥበብ ገበያ" }, location: { woreda: { en: "Culture", am: "ባህል" } }, images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1776601645/image_2026-04-19_10-24-55_bapiqx.png"], likes: 142 },
      ];

      try {
        const res = await apiClient.get("/destinations");
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          const fetchedDests = res.data.data;
          const dojeeIndex = fetchedDests.findIndex((d: any) => d.name?.en?.includes("Doje'e") || (typeof d.name === 'string' && d.name.includes("Doje'e")));
          
          let updatedDests = [...fetchedDests];
          if (dojeeIndex !== -1) {
            const [dbDojee] = updatedDests.splice(dojeeIndex, 1);
            // Override the incorrect DB description
            dbDojee.description = dojeeDest.description;
            if (!dbDojee.name?.am) {
              dbDojee.name = dojeeDest.name;
            }
            updatedDests.splice(1, 0, dbDojee);
          } else {
            updatedDests.splice(1, 0, dojeeDest);
          }
          
          while (updatedDests.length < 8) {
            updatedDests.push(GALLERY_FALLBACKS[updatedDests.length % GALLERY_FALLBACKS.length]);
          }
          setDestinations(updatedDests.slice(0, 8));
        } else {
          setDestinations(GALLERY_FALLBACKS);
        }
      } catch (err) {
        console.error("Error fetching destinations, using fallback:", err);
        setDestinations(GALLERY_FALLBACKS);
      } finally {
        setLoading(false);
      }
    };
    fetchDests();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const leftDest = destinations[0] || {};
  const rightTopDests = destinations.slice(1, 3);
  const rightBottomDests = destinations.slice(3, 6);

  // Translation maps for common backend string returns
  const titleTranslations: Record<string, string> = {
    "Ajora Falls": "አጆራ ፏፏቴ",
    "The Majestic Doje'e Waterfall": "ታላቁ የዶጄ ፏፏቴ",
    "Mount Hambericho": "ሀምበሪቾ ተራራ",
    "Traditional Attire": "የባህል አልባሳት",
    "Sarobita Valley": "ሳሮቢታ ሸለቆ",
    "Traditional Music": "የባህል ሙዚቃ",
    "Gamosha Hot Spring": "ጋሞሻ ፍል ውሃ",
    "Local Craft Market": "የአካባቢ የእደ ጥበብ ገበያ",
    "Durame Town": "ዱራሜ ከተማ",
    "Mount Hambarcho": "ሀምበሪቾ ተራራ"
  };

  const locTranslations: Record<string, string> = {
    "HADERO CITY": "ሀደሮ ከተማ",
    "AJORA FALLS": "አጆራ ፏፏቴ",
    "DURAME": "ዱራሜ",
    "HADARO": "ሀደሮ",
    "CULTURE": "ባህል",
    "NATURE": "ተፈጥሮ",
    "TEMBARO": "ጠምባሮ",
    "Hadero": "ሀደሮ"
  };

  const getTranslatedTitle = (dest: any) => {
    if (language === 'am') {
      if (dest.name?.am) return dest.name.am;
      const enTitle = dest.name?.en || dest.name || "";
      return titleTranslations[enTitle] || enTitle;
    }
    return dest.name?.en || dest.name;
  };

  const getTranslatedLocation = (dest: any) => {
    let loc = dest.location?.woreda?.en || dest.location?.woreda || dest.location?.en || dest.location;
    if (typeof loc === 'object') loc = loc.en || loc.woreda || "Kambata";
    if (language === 'am') {
      if (dest.location?.woreda?.am) return dest.location.woreda.am;
      if (dest.location?.am) return dest.location.am;
      if (typeof loc === 'string') {
        return locTranslations[loc.toUpperCase()] || locTranslations[loc] || "ከምባታ";
      }
      return "ከምባታ";
    }
    return loc || "Kambata";
  };

  const renderCard = (dest: any, isLarge = false) => (
    <div key={dest._id} className="relative group rounded-3xl overflow-hidden w-full h-full min-h-[250px] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer">
      <Image
        src={(dest.images?.[0] || "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037994/kambata/xbsw2ajsabbtz4tuwjvl.jpg").replace('/upload/', '/upload/f_auto,q_auto,w_800/')}
        alt={dest.name?.en || dest.name || "Destination"}
        fill
        unoptimized={true}
        className="object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col justify-end z-10 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <h4 className={`text-white font-bold leading-tight mb-2 ${isLarge ? 'text-3xl md:text-4xl' : 'text-xl line-clamp-1'}`}>
          {getTranslatedTitle(dest)}
        </h4>
        <span className="text-gray-200 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2">
          <MapPin size={12} className="text-primary-light" /> {getTranslatedLocation(dest)}
        </span>
        {dest.description && (
           <p className={`text-gray-300 text-sm leading-relaxed ${isLarge ? 'line-clamp-3' : 'line-clamp-2 md:line-clamp-2'}`}>
             {dest.description?.[language] || dest.description?.en || dest.description}
           </p>
        )}
      </div>
    </div>
  );

  return (
    <section className="pt-8 md:pt-10 pb-4 md:pb-6 bg-[#FDFCF0] dark:bg-slate-900 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-4 text-center md:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl"
          >
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-[10px] mb-4 block font-display">
              {language === 'am' ? 'ዋና ዋና መዳረሻዎች' : 'TOP DESTINATIONS'}
            </span>
            <h2 className="text-4xl md:text-6xl text-gray-900 dark:text-white leading-tight font-display font-bold">
              {language === 'am' ? 'ታዋቂ መዳረሻዎች' : 'Popular Destinations'} <br className="hidden md:block" /> {language === 'am' ? 'በከምባታ' : 'in Kambata'}
            </h2>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="max-w-sm text-gray-500 text-sm md:text-base leading-relaxed font-sans font-light"
          >
            {language === 'am' 
              ? 'የከምባታን ውበት በተዋሃዱ መንገዶቻቸው፣ አረንጓዴ ተራሮች ከህያው ቅርስ ጋር በሚገናኙበት ቦታ ይለማመዱ።' 
              : "Experience Kambata's beauty through their integrated paths, where verdant peaks meet living heritage."}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 h-[350px] sm:h-[450px] lg:h-auto">
            {renderCard(leftDest, true)}
          </div>
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6 h-auto lg:h-[300px]">
              {rightTopDests.map((dest) => renderCard(dest, false))}
            </div>
            {rightBottomDests.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 h-auto lg:h-[260px]">
                {rightBottomDests.map((dest) => renderCard(dest, false))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Destinations;
