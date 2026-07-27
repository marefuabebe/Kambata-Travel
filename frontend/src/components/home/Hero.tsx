"use client";

import { MapPin, Calendar, Users, Search, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="relative w-full h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center" 
        style={{ backgroundImage: 'url("https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037994/kambata/xbsw2ajsabbtz4tuwjvl.jpg")' }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center pt-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-3xl md:text-5xl font-heading text-white mb-4 leading-tight drop-shadow-lg font-bold">
            Discover Kambaata’s Natural <br className="hidden md:block" /> & Cultural Beauty
          </h1>
          <p className="text-sm md:text-lg text-white font-medium mb-8 md:mb-10 drop-shadow-md">
            Explore mountains, culture, and hidden gems in the majestic Kambaata Zone
          </p>
        </motion.div>

        {/* Stats Grid - Large Glass Cards */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto mb-10 md:mb-12"
        >
          {[
            { val: "20+", lab: "Destinations" },
            { val: "50+", lab: "Local Tours" },
            { val: "4.8", lab: "Average Rating" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white backdrop-blur-xl border border-white/20 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] text-white text-center shadow-xl">
              <h3 className="text-2xl md:text-3xl font-bold mb-1">{stat.val}</h3>
              <p className="text-[9px] md:text-[10px] opacity-90 uppercase tracking-[0.2em] font-bold">{stat.lab}</p>
            </div>
          ))}
        </motion.div>

        {/* Floating Search Bar - White Pill */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="max-w-5xl mx-auto w-full bg-white p-1.5 md:p-2 rounded-[2rem] md:rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-stretch md:items-center gap-1"
        >
          <div className="flex-[1.5] flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 border-b md:border-b-0 md:border-r border-gray-100 transition-colors cursor-pointer group">
            <MapPin className="w-4 h-4 text-primary" />
            <div className="text-left">
              <span className="block text-[8px] md:text-[9px] uppercase font-black text-gray-400 tracking-wider">Location</span>
              <input type="text" placeholder="Where in Kambaata?" className="bg-transparent text-gray-900 text-sm font-bold outline-none w-full placeholder:text-gray-300" />
            </div>
          </div>

          <div className="flex-1 flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 border-b md:border-b-0 md:border-r border-gray-100 transition-colors cursor-pointer group">
            <Calendar className="w-4 h-4 text-primary" />
            <div className="text-left">
              <span className="block text-[8px] md:text-[9px] uppercase font-black text-gray-400 tracking-wider">Duration</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 text-sm font-bold">Select Dates</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 transition-colors cursor-pointer group">
            <Users className="w-4 h-4 text-primary" />
            <div className="text-left">
              <span className="block text-[8px] md:text-[9px] uppercase font-black text-gray-400 tracking-wider">Guests</span>
              <span className="text-gray-900 text-sm font-bold">2</span>
            </div>
          </div>

          <button className="bg-primary hover:bg-primary/90 text-white px-8 md:px-10 py-4 rounded-[1.8rem] md:rounded-[2rem] font-black flex items-center justify-center gap-3 md:gap-4 transition-all shadow-xl">
            <Search className="w-4 h-4 md:w-5 md:h-5" />
            <span className="uppercase tracking-widest text-[10px] md:text-xs">Explore</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
