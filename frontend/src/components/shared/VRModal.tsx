"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye } from "lucide-react";

interface VRModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

const VRModal: React.FC<VRModalProps> = ({ isOpen, onClose, imageUrl, title }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Construct Pannellum iframe URL
  const iframeUrl = `https://cdn.pannellum.org/2.5/pannellum.htm#panorama=${encodeURIComponent(
    imageUrl
  )}&autoLoad=true`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl aspect-[16/9] sm:aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header / Title Bar */}
            <div className="absolute top-0 left-0 w-full z-10 p-4 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-start pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <Eye className="w-4 h-4 text-white" />
                <span className="text-white font-medium text-sm">
                  {title ? `360° View: ${title}` : "360° Virtual Preview"}
                </span>
              </div>
              
              <button
                onClick={onClose}
                className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all hover:rotate-90 duration-300"
                aria-label="Close VR View"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pannellum Iframe */}
            <div className="flex-1 w-full h-full bg-black flex items-center justify-center">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                src={iframeUrl}
                className="w-full h-full object-cover"
                style={{ border: "none" }}
              />
            </div>
            
            {/* Mobile Interaction Hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none md:hidden">
              <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white/90 text-xs text-center">
                Move your phone or drag to look around
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VRModal;
