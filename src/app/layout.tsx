import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Import Google Fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Import Custom Header Font
const fontHeader = localFont({
  src: [
    {
      path: "./fonts/Sato-Medium.ttf",
      // weight: "700", // Uncomment/adjust if your font has weight variants
      style: "normal",
    },
  ],
  variable: "--font-header",
  display: "swap",
});

// Import Custom Body Font
const fontBody = localFont({
  src: [
    {
      path: "./fonts/RedHatDisplayMedium.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
});

// const inter = Inter({
//   variable: "--font-inter",
//   subsets: ["latin"],
//   display: "swap",
// });

// const jetbrainsMono = JetBrains_Mono({
//   variable: "--font-jetbrains-mono",
//   subsets: ["latin"],
//   display: "swap",
// });

export const metadata: Metadata = {
  title: "NexusMessage | Plateforme de Gestion de Campagnes SMS Avancée",
  description: "Plateforme professionnelle de marketing SMS avec gestion avancée de campagnes, segmentation de contacts, personnalisation de messages et analyses en temps réel. Boostez votre ROI marketing avec l&apos;automatisation SMS intelligente.",
  keywords: [
    "marketing SMS",
    "SMS en masse",
    "gestion de campagnes", 
    "automatisation de messages",
    "analyses SMS",
    "gestion de contacts",
    "plateforme marketing",
    "messagerie d&apos;entreprise",
    "API SMS",
    "personnalisation de messages"
  ],
  authors: [{ name: "Équipe NexusMessage" }],
  creator: "NexusMessage",
  publisher: "NexusMessage",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://nexusmessage.fr",
    title: "NexusMessage | Gestion Avancée de Campagnes SMS",
    description: "Transformez votre communication d&apos;entreprise avec notre plateforme professionnelle de marketing SMS. Analyses avancées, automatisation et outils de personnalisation.",
    siteName: "NexusMessage",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "NexusMessage - Plateforme de Campagnes SMS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NexusMessage | Gestion Avancée de Campagnes SMS",
    description: "Plateforme professionnelle de marketing SMS avec gestion avancée de campagnes et analyses en temps réel.",
    images: ["/twitter-image.jpg"],
    creator: "@nexusmessage",
  },
  verification: {
    google: "google-site-verification-code",
    yandex: "yandex-verification-code",
    yahoo: "yahoo-site-verification-code",
  },
  category: "Logiciel d&apos;Entreprise",
  classification: "Technologie Marketing",
  other: {
    "application-name": "NexusMessage",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "theme-color": "#3B82F6",
    "color-scheme": "light dark",
  },
};

export default function NexusMessageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="canonical" href="https://nexusmessage.fr" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fontHeader.variable} ${fontBody.variable} antialiased`}
      >
        <div id="root" className="min-h-screen">
          {children}
        </div>
        {/* <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "NexusMessage",
              "description": "Plateforme professionnelle de marketing SMS avec gestion avancée de campagnes",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Navigateur Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "150"
              }
            })
          }}
        /> */}
      </body>
    </html>
  );
}