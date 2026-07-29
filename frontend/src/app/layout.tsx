import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans, DM_Serif_Display } from "next/font/google";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import EnterpriseChatbot from "@/components/chat/EnterpriseChatbot";
import SplashScreen from "@/components/layout/SplashScreen";
import ServiceWorkerRegistry from "@/components/ServiceWorkerRegistry";
import { Toaster } from "react-hot-toast";
import Analytics from "@/components/Analytics";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0F766E",
};

export const metadata: Metadata = {
  title: "Kambaata Travel | Discover Ethiopia",
  description: "Explore the natural and cultural beauty of Kambaata Zone.",
  manifest: "/manifest.json",
  icons: {
    icon: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg",
    apple: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kambaata Travel",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${plusJakartaSans.variable} ${dmSerif.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <AuthProvider>
            <LanguageProvider>
              <SplashScreen />
              <ServiceWorkerRegistry />
              {children}
              <Analytics />
              <EnterpriseChatbot />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#1F2937",
                    color: "#F9FAFB",
                    fontFamily: "var(--font-sans)",
                    fontSize: "14px",
                    fontWeight: "500",
                    borderRadius: "12px",
                    padding: "14px 18px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                  },
                  success: {
                    iconTheme: { primary: "#22c55e", secondary: "#fff" },
                  },
                  error: {
                    iconTheme: { primary: "#ef4444", secondary: "#fff" },
                  },
                }}
              />
            </LanguageProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}

