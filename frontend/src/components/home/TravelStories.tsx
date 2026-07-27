"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

const STORIES = [
  {
    id: 1,
    title: "Dawn on the 777 Stairs",
    excerpt: "The first light of day reveals a horizon that feels infinite from the peak of Hambarcho.",
    author: "Amara Dhafoo",
    date: "March 12, 2026",
    category: "Adventure",
    image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037952/kambata/eadxdia83stxqodxf3vd.png",
    featured: true
  },
  {
    id: 2,
    title: "Hearts of Durame",
    excerpt: "Discovering the rhythmic heartbeat of traditional Kambata weaving.",
    author: "Elias K.",
    date: "Feb 28, 2026",
    category: "Culture",
    image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037908/kambata/c4fjijbxuyd0gbdlqshp.png",
    featured: false
  },
  {
    id: 3,
    title: "Secrets of Ajora Falls",
    excerpt: "Beyond the mist lies a land of ancient legends and hidden lagoons.",
    author: "Sara M.",
    date: "Jan 15, 2026",
    category: "Nature",
    image: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037883/kambata/bmq1irrn8nugtb0z2ztg.jpg",
    featured: false
  }
];

const TravelStories = () => {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">The Kambata Journal</span>
          <h2 className="text-4xl md:text-5xl text-gray-900 font-heading">Travel Stories</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Main Featured Story */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:col-span-7 group cursor-pointer"
          >
            <div className="relative h-[600px] rounded-[3rem] overflow-hidden shadow-2xl">
              <Image
                src={STORIES[0].image}
                alt={STORIES[0].title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 58vw"
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              
              <div className="absolute bottom-12 left-12 right-12 text-white">
                <div className="flex items-center gap-4 mb-6">
                   <span className="bg-primary/90 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{STORIES[0].category}</span>
                   <span className="text-xs opacity-60 font-light">{STORIES[0].date}</span>
                </div>
                <h3 className="text-4xl font-bold mb-4 leading-tight">{STORIES[0].title}</h3>
                <p className="text-lg opacity-80 mb-8 max-w-lg line-clamp-2">{STORIES[0].excerpt}</p>
                <div className="flex items-center gap-4 group/btn">
                   <span className="font-bold border-b border-white/30 pb-1 group-hover/btn:border-primary transition-colors">Read Story</span>
                   <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Secondary Stories column */}
          <div className="md:col-span-5 flex flex-col gap-8">
            {STORIES.slice(1).map((story, idx) => (
              <motion.div 
                key={story.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="group cursor-pointer flex-1"
              >
                <div className="relative h-full min-h-[280px] rounded-[3rem] overflow-hidden shadow-xl border border-gray-100">
                  <Image
                    src={story.image}
                    alt={story.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 42vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors" />
                  
                  <div className="absolute inset-0 p-10 flex flex-col justify-end text-white">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">{story.category}</span>
                     <h4 className="text-2xl font-bold mb-2">{story.title}</h4>
                     <p className="text-sm opacity-0 group-hover:opacity-80 transition-opacity duration-500 line-clamp-2 mb-4">{story.excerpt}</p>
                     <div className="flex items-center gap-2 opacity-60 text-[10px]">
                        <span>By {story.author}</span>
                        <span>•</span>
                        <span>{story.date}</span>
                     </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TravelStories;
