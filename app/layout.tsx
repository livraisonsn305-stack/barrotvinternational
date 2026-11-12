import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { AuthProvider } from "@/lib/auth-context";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Barro TV International | Actualité du Sénégal et du monde",
    template: "%s | Barro TV International",
  },
  description:
    "Barro TV International, votre média d'information au Sénégal et à l'international. Retrouvez toute l'actualité politique, société, économie, sport, Afrique et monde.",
  applicationName: "Barro TV International",
  authors: [{ name: "Barro TV International" }],
  creator: "Barro TV International",
  publisher: "Barro TV International",
  keywords: [
    "Barro TV",
    "Barro TV International",
    "actualité Sénégal",
    "actualité Dakar",
    "Sénégal",
    "politique Sénégal",
    "société Sénégal",
    "économie Sénégal",
    "sport Sénégal",
    "actualité Afrique",
    "actualité internationale",
    "média Sénégal",
    "information Sénégal",
  ],
  metadataBase: new URL("https://www.barrotvinternational.com"),
  other: {
    "google-adsense-account": "ca-pub-3062288256344246",
  },
  verification: {
    google: "ZREFSSg3Ndl28f9MAoBWNkemQkur2D6xhnAyHjWtdxE",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icon.png", type: "image/png", sizes: "48x48" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  alternates: { canonical: "https://www.barrotvinternational.com" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "https://www.barrotvinternational.com",
    siteName: "Barro TV International",
    title: "Barro TV International | Actualité du Sénégal et du monde",
    description:
      "Barro TV International, votre média d'information au Sénégal et à l'international. Retrouvez toute l'actualité politique, société, économie, sport, Afrique et monde.",
    locale: "fr_FR",
    images: [{ url: "/logo.png", width: 1536, height: 1024, alt: "Barro TV International" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Barro TV International | Actualité du Sénégal et du monde",
    description:
      "Barro TV International, votre média d'information au Sénégal et à l'international. Retrouvez toute l'actualité politique, société, économie, sport, Afrique et monde.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <PushNotificationPrompt />
          {children}
        </AuthProvider>
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7561768425031786"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Barro TV International",
                url: "https://www.barrotvinternational.com",
                alternateName: "Barro TV",
              },
              {
                "@context": "https://schema.org",
                "@type": ["Organization", "NewsMediaOrganization"],
                name: "Barro TV International",
                url: "https://www.barrotvinternational.com",
                logo: {
                  "@type": "ImageObject",
                  url: "https://www.barrotvinternational.com/logo.png",
                },
                sameAs: ["https://www.barrotvinternational.com"],
              },
            ]),
          }}
        />
      </body>
    </html>
  );
}
