import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Kambata Travel — Telegram",
  description: "Explore Kambata, Ethiopia through the Telegram Mini App",
};

export default function TelegramLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Telegram Web App JS SDK */}
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <div
        style={{
          minHeight: "100vh",
          background: "var(--tg-theme-bg-color, #0f0f0f)",
          color: "var(--tg-theme-text-color, #ffffff)",
          fontFamily: "Inter, -apple-system, sans-serif",
        }}
      >
        {children}
      </div>
    </>
  );
}
