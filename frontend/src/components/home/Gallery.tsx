"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const IMAGES = [
  { url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037994/kambata/xbsw2ajsabbtz4tuwjvl.jpg", size: "large", span: "col-span-12 md:col-span-8", mobileHeight: "min-h-[300px] md:min-h-0" },
  { url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782038012/kambata/wiv5jowt9wkkt82rukal.png", size: "small", span: "col-span-6 md:col-span-4", mobileHeight: "min-h-[200px] md:min-h-0" },
  { url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037908/kambata/c4fjijbxuyd0gbdlqshp.png", size: "small", span: "col-span-6 md:col-span-4", mobileHeight: "min-h-[200px] md:min-h-0" },
  { url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037952/kambata/eadxdia83stxqodxf3vd.png", size: "small", span: "col-span-12 md:col-span-4", mobileHeight: "min-h-[250px] md:min-h-0" },
  { url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037883/kambata/bmq1irrn8nugtb0z2ztg.jpg", size: "wide", span: "col-span-12 md:col-span-4", mobileHeight: "min-h-[250px] md:min-h-0" },
];

const Gallery = () => {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-[10px] mb-4 block">Visual Discovery</span>
          <h2 className="text-4xl md:text-5xl text-gray-900 font-heading">Glimpses of Kambata</h2>
        </div>

        <div className="grid grid-cols-12 gap-4 h-auto md:h-[1000px]">
          {IMAGES.map((img, idx) => (
            <motion.div 
               key={idx}
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ delay: idx * 0.1 }}
               className={`relative rounded-[2.5rem] overflow-hidden group ${img.span} ${img.mobileHeight}`}
            >
               <Image
                 src={img.url}
                 alt="Gallery"
                 fill
                 sizes={img.size === 'large' ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 50vw, 33vw'}
                 className="object-cover transition-transform duration-1000 group-hover:scale-110"
               />
               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-500" />
               <div className="absolute inset-x-0 bottom-0 p-8 h-1/2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end">
                  <div>
                    <span className="text-white font-bold text-sm tracking-widest uppercase">Kambata Highlands</span>
                    <p className="text-white/70 text-[10px] mt-1 italic">Authentic Perspective • 2026</p>
                  </div>
               </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
           <button className="border border-gray-200 hover:border-primary hover:text-primary px-10 py-4 rounded-full font-bold transition-all inline-flex items-center gap-2">
             <span>Follow our Journey</span>
           </button>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
