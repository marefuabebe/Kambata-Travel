"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Read from localStorage or system preference on mount
    const saved = localStorage.getItem("explorer-dark-mode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (saved === "1") {
      setTheme("dark");
    } else if (saved === "0") {
      setTheme("light");
    } else if (prefersDark) {
      setTheme("dark");
    }

    // Listen to global event for legacy sync
    const handleToggleEvent = () => {
      setTheme((prev) => {
        const newTheme = prev === "light" ? "dark" : "light";
        if (newTheme === "dark") {
          document.documentElement.classList.add("dark");
          localStorage.setItem("explorer-dark-mode", "1");
        } else {
          document.documentElement.classList.remove("dark");
          localStorage.setItem("explorer-dark-mode", "0");
        }
        return newTheme;
      });
    };
    
    window.addEventListener("toggle-theme", handleToggleEvent);
    return () => window.removeEventListener("toggle-theme", handleToggleEvent);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
        localStorage.setItem("explorer-dark-mode", "1");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("explorer-dark-mode", "0");
      }
      return newTheme;
    });
  };

  // Prevent hydration mismatch by returning null until mounted, or just return children. 
  // We'll return children but the toggle will wait for mount.
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return { theme: "light", toggleTheme: () => {} }; // Safe fallback for SSR
  }
  return context;
}
