"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Amina Yusuf",
    role: "Nature Lover",
    initial: "A",
    quote: "The lush green hills and the gentle horses made my trek unforgettable. It felt like stepping into a peaceful, untouched paradise.",
    description: "Exploring the highland trails on horseback allowed me to truly connect with the incredible nature of Kambata. The guides were amazing, and the scenery was absolutely breathtaking.",
    image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1777480767/image_2026-04-29_19-21-03_u5i9or.png"
  },
  {
    id: 2,
    name: "Samuel Tadesse",
    role: "Cultural Photographer",
    initial: "S",
    quote: "The colors, the vibrant culture, and the majestic landscapes. Every corner of Kambata tells a vivid story.",
    description: "From the traditional ceremonies to the breathtaking highland views, this platform helped me find authentic experiences that I couldn't have discovered on my own.",
    image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1777480065/image_2026-04-29_19-23-16_zyn0zg.png"
  },
  {
    id: 3,
    name: "Elena & Friends",
    role: "Group Trekkers",
    initial: "E",
    quote: "Conquering the 777 stairs together was the absolute highlight of our journey.",
    description: "The guided group trek to the summit of Mount Hambaricho was perfectly organized. Reaching the peak and sharing that moment with fellow travelers made it an unforgettable adventure.",
    image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1777480948/image_2026-04-29_19-40-59_jk0jya.png"
  }
];

const Testimonial = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 10000); // 10 seconds

    return () => clearInterval(timer);
  }, []);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const current = testimonials[currentIndex];

  return (
    <section className="py-20 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-0 bg-white rounded-[4rem] overflow-hidden shadow-2xl shadow-gray-200/50">
          
          {/* Left Side: The Traveler (50%) */}
          <div className="lg:w-1/2 relative h-[500px] lg:h-[700px] overflow-hidden bg-gray-100">
            <AnimatePresence mode="wait">
              <motion.img 
                key={current.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                src={current.image} 
                className="w-full h-full object-cover absolute inset-0" 
                alt={current.name}
              />
            </AnimatePresence>
            
            {/* Soft Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
            
            {/* Floating Badge */}
            <AnimatePresence mode="wait">
              <motion.div 
                 key={`badge-${current.id}`}
                 initial={{ opacity: 0, x: -30 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -30 }}
                 transition={{ duration: 0.5, delay: 0.2 }}
                 className="absolute top-12 left-8 md:left-12 bg-white backdrop-blur-xl p-4 md:p-6 rounded-3xl shadow-xl flex items-center gap-4 max-w-[80%]"
              >
                 <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold shrink-0">
                   {current.initial}
                 </div>
                 <div>
                    <h4 className="font-bold text-gray-900 leading-none">{current.name}</h4>
                    <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest mt-1 truncate">{current.role}</p>
                 </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Side: The Quote (50%) */}
          <div className="lg:w-1/2 p-8 md:p-12 lg:p-20 text-left relative flex flex-col justify-center h-full min-h-[500px]">
            <Quote className="w-12 h-12 md:w-16 md:h-16 text-primary/10 absolute top-8 left-8 md:top-10 md:left-10 lg:static mb-6 md:mb-8" />
            
            <AnimatePresence mode="wait">
              <motion.div
                 key={`content-${current.id}`}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 transition={{ duration: 0.5 }}
              >
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-heading text-gray-900 leading-tight mb-6 md:mb-8">
                  "{current.quote}"
                </h3>
                
                <p className="text-gray-500 text-base md:text-lg leading-relaxed mb-10 md:mb-12">
                  {current.description}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                   <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-accent" />
                      ))}
                      <span className="ml-2 md:ml-4 text-xs md:text-sm font-bold text-gray-900 italic">Highly Recommended</span>
                   </div>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Carousel Indicators */}
            <div className="flex items-center gap-3 mt-12 pt-8 border-t border-gray-100">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDotClick(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex ? "w-8 bg-primary" : "w-2 bg-gray-200 hover:bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
