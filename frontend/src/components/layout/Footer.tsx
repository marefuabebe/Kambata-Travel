"use client";

import { useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import apiClient from "@/utils/apiClient";
import { useLanguage } from "@/context/LanguageContext";

const FacebookIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const TwitterIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

const InstagramIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const YoutubeIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
  </svg>
);

const TiktokIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
  </svg>
);

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-dark pt-24 pb-12 text-white">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-16 border-b border-white/5">
          {/* Brand Column */}
          <div className="md:col-span-2 lg:col-span-4">
            <div className="mb-6 h-12">
              <img loading="lazy" 
                src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" 
                alt="Kambaata Travel Logo" 
                className="h-full w-auto object-contain brightness-0 invert"
              />
            </div>
            <h3 className="font-heading text-xl font-bold text-white mb-6 uppercase tracking-widest hidden">Kambaata Travel</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-8">
              {t("footer.description")}
            </p>
            <div className="flex gap-4">
              <a href="#" className="group w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-[#1877F2] hover:text-white transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-lg hover:shadow-[#1877F2]/50"><FacebookIcon size={18} /></a>
              <a href="#" className="group w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-[#1DA1F2] hover:text-white transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-lg hover:shadow-[#1DA1F2]/50"><TwitterIcon size={18} /></a>
              <a href="#" className="group w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-[#E1306C] hover:text-white transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-lg hover:shadow-[#E1306C]/50"><InstagramIcon size={18} /></a>
              <a href="#" className="group w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-[#FF0000] hover:text-white transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-lg hover:shadow-[#FF0000]/50"><YoutubeIcon size={18} /></a>
              <a href="#" className="group w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-[#000000] hover:text-white transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-lg hover:shadow-[#000000]/50 border border-transparent hover:border-white/20"><TiktokIcon size={18} /></a>
            </div>
          </div>

          {/* Useful Links */}
          <div className="lg:col-span-2">
            <h4 className="font-bold mb-6 text-sm uppercase tracking-wider">{t("footer.usefulLinks")}</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><Link href="/about" className="hover:text-primary transition-colors">{t("footer.about")}</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">{t("footer.contact")}</Link></li>
              <li><Link href="/explore" className="hover:text-primary transition-colors">{t("footer.explorer")}</Link></li>
              <li><Link href="/tours" className="hover:text-primary transition-colors">{t("footer.tours")}</Link></li>
              <li><Link href="/heritage" className="hover:text-primary transition-colors">{t("footer.heritage") !== "footer.heritage" ? t("footer.heritage") : "Heritage"}</Link></li>
              <li><Link href="/gallery" className="hover:text-primary transition-colors">{t("footer.gallery")}</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="lg:col-span-3">
            <h4 className="font-bold mb-6 text-sm uppercase tracking-wider">{t("footer.contactUs")}</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li>{t("footer.address")}</li>
              <li>{t("footer.country")}</li>
              <li>info@kambatatravel.com</li>
              <li>+251 900 000 000</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-2 lg:col-span-3">
            <h4 className="text-xl font-bold mb-6">{t("footer.joinJournal")}</h4>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              {t("footer.journalDesc")}
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-xs text-center md:text-left">
            {t("footer.rights")} <br className="md:hidden" />
            <span className="hidden md:inline mx-2">•</span> 
            {t("footer.crafted")}
          </p>
          <div className="flex gap-8">
            <Link href="/privacy" className="text-gray-500 hover:text-white transition-colors">{t("footer.privacy")}</Link>
            <Link href="/terms" className="text-gray-500 hover:text-white transition-colors">{t("footer.terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

const NewsletterForm = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await apiClient.post("/newsletter", { email });
      if (res.data.success) {
        setStatus("success");
        setMessage(res.data.message);
        setEmail("");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.message || t("footer.error"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex flex-col gap-3">
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("footer.enterEmail")} 
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary transition-colors md:pr-32"
          disabled={status === "loading" || status === "success"}
        />
        <button 
          type="submit"
          className="md:absolute md:right-2 md:top-1.5 bg-primary hover:bg-primary-light text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          disabled={status === "loading" || status === "success"}
        >
          {status === "loading" ? t("footer.joining") : t("footer.joinNow")}
        </button>
      </div>
      {message && (
        <p className={`mt-3 text-[10px] font-bold uppercase tracking-wider ${status === 'success' ? 'text-primary' : 'text-red-400'}`}>
          {message}
        </p>
      )}
    </form>
  );
};

export default Footer;
