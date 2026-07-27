"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "am";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("en");
  const [translations, setTranslations] = useState<any>(null);

  // Load language from localStorage and fetch translations on mount
  useEffect(() => {
    const loadTranslations = async () => {
      const savedLang = localStorage.getItem("kambata_lang") as Language;
      const langToLoad = (savedLang && (savedLang === "en" || savedLang === "am")) ? savedLang : "en";
      
      try {
        const module = await import(`@/locales/${langToLoad}.json`);
        setTranslations(module.default);
        setLanguageState(langToLoad);
      } catch (error) {
        console.error("Failed to load translations:", error);
        // Fallback to English if loading fails
        const fallbackModule = await import(`@/locales/en.json`);
        setTranslations(fallbackModule.default);
        setLanguageState("en");
      }
    };

    loadTranslations();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      const module = await import(`@/locales/${lang}.json`);
      setTranslations(module.default);
      setLanguageState(lang);
      localStorage.setItem("kambata_lang", lang);
    } catch (error) {
      console.error("Failed to switch language:", error);
    }
  };

  const t = (key: string): string => {
    if (!translations) return key;
    
    const keys = key.split(".");
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation is missing
        return key;
      }
    }

    return typeof value === "string" ? value : key;
  };

  // Show loading state while translations are being fetched
  if (!translations) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
