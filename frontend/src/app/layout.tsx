import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans, DM_Serif_Display, Allura, Great_Vibes } from "next/font/google";
import dynamic from "next/dynamic";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const allura = Allura({
  variable: "--font-allura",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import SplashScreen from "@/components/layout/SplashScreen";
import { Toaster } from "react-hot-toast";
import Analytics from "@/components/Analytics";
import JsonLd from "@/components/seo/JsonLd";
import "./globals.css";

// Lazy-load heavy components that aren't needed on initial render
const EnterpriseChatbot = dynamic(() => import("@/components/chat/EnterpriseChatbot"), {
  loading: () => null,
});

export const viewport: Viewport = {
  themeColor: "#0F766E",
};

const defaultTitle = "Kambaata Travel | Discover Ethiopia's Hidden Gem";
const defaultDescription = "Experience the rich culture, breathtaking landscapes, and warm hospitality of Kambaata Zone. Book authentic tours with verified local guides.";

export const metadata: Metadata = {
  metadataBase: new URL('https://kambata-travel.vercel.app'),
  title: {
    template: "%s | Kambaata Travel",
    default: defaultTitle,
  },
  description: defaultDescription,
  keywords: ["Kambaata travel", "Ethiopia tours", "Local guides Ethiopia", "Kambaata Zone", "Ethiopia heritage", "cultural tours Ethiopia"],
  authors: [{ name: "Kambaata Travel" }],
  creator: "Kambaata Travel",
  publisher: "Kambaata Travel",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      'en-US': '/en',
      'am-ET': '/am',
    },
  },
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    url: "https://kambata-travel.vercel.app",
    siteName: "Kambaata Travel",
    images: [
      {
        url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.png", // using an assumed valid PNG or SVG version
        width: 1200,
        height: 630,
        alt: "Kambaata Travel - Discover Ethiopia",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg", type: "image/svg+xml" }
    ],
    apple: [
      { url: "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" }
    ],
  },
  manifest: "/manifest.json",
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
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Kambaata Travel",
    "url": "https://kambata-travel.vercel.app",
    "logo": "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg",
    "description": "Experience the rich culture, breathtaking landscapes, and warm hospitality of Kambaata Zone. Book authentic tours with verified local guides."
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Kambaata Travel",
    "url": "https://kambata-travel.vercel.app"
  };

  return (
    <html
      lang="en"
      className={`${outfit.variable} ${plusJakartaSans.variable} ${dmSerif.variable} ${allura.variable} ${greatVibes.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <JsonLd data={orgSchema} />
        <JsonLd data={webSiteSchema} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(function(err) {
                  console.error('ServiceWorker registration failed: ', err);
                });
              }
              
              // Prevent splash screen flash on subsequent visits
              if (sessionStorage.getItem("hasSeenSplash")) {
                document.documentElement.classList.add("hide-splash");
              }
              
              // Prevent Dark Mode FOUC
              try {
                var saved = localStorage.getItem("explorer-dark-mode");
                if (saved === "1" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
                  document.documentElement.classList.add("dark");
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <ThemeProvider>
            <AuthProvider>
              <LanguageProvider>
                <SplashScreen />
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
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}

