import type { Metadata, Viewport } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

const SITE_URL = "https://doczip.pages.dev";
const SITE_NAME = "DocCompress";
const OG_IMAGE = "/og.png";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DocCompress — Free Offline Document Compressor | PDF, DOCX, PPTX, XLSX",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Free online document compression tool. Compress PDF, DOCX, PPTX, XLSX, JPG, PNG files directly in your browser. 100% offline — files never leave your device. Reduce file size by 50%+ with smart compression.",
  keywords: [
    // English
    "document compressor", "PDF compressor", "compress PDF online", "DOCX compressor",
    "PPTX compression", "XLSX reduce size", "image compressor", "file compression tool",
    "offline compressor", "free document compression", "reduce PDF size", "compress office files",
    "online file compressor", "privacy compression tool", "browser document compressor",
    // 中文
    "文档压缩", "PDF压缩", "在线压缩", "DOCX压缩", "PPTX压缩", "图片压缩",
    "文件压缩工具", "离线压缩", "免费文档压缩", "减小文件大小",
    // SEO long-tail
    "compress PDF without uploading", "reduce DOCX file size online",
    "compress PowerPoint presentation", "Excel file too large",
    "best free document compressor", "secure file compression",
  ],
  authors: [{ name: "DocCompress", url: SITE_URL }],
  creator: "DocCompress",
  publisher: "DocCompress",
  formatDetection: { email: false, address: false, telephone: false },
  category: "technology",

  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: [
      "zh_CN", "hi_IN", "es_ES", "ar_SA", "fr_FR", "pt_BR", "ru_RU", "bn_BD", "de_DE",
    ],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "DocCompress — Free Offline Document Compressor",
    description:
      "Compress PDF, DOCX, PPTX, XLSX, JPG, PNG files directly in your browser. 100% offline, zero data leak. Visual treemap analysis of document resources.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "DocCompress — Offline Document Compression with Visual Treemap",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "DocCompress — Free Offline Document Compressor",
    description:
      "Compress PDF, DOCX, PPTX, XLSX files in your browser. 100% offline — files never leave your device.",
    images: [OG_IMAGE],
    creator: "@doccompress",
  },

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

  alternates: {
    canonical: SITE_URL,
    languages: {
      en: `${SITE_URL}/`,
      zh: `${SITE_URL}/`,
      hi: `${SITE_URL}/`,
      es: `${SITE_URL}/`,
      ar: `${SITE_URL}/`,
      fr: `${SITE_URL}/`,
      pt: `${SITE_URL}/`,
      ru: `${SITE_URL}/`,
      bn: `${SITE_URL}/`,
      de: `${SITE_URL}/`,
    },
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fb" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a22" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "DocCompress",
    url: SITE_URL,
    description:
      "Free offline document compression tool. Compress PDF, DOCX, PPTX, XLSX, JPG, PNG files directly in your browser with zero data leak.",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "PDF compression",
      "DOCX, PPTX, XLSX office document compression",
      "JPG, PNG, WebP image compression",
      "Visual treemap resource analysis",
      "100% offline processing — no server upload",
      "Supports 10 languages",
      "Dark and light theme",
    ],
    browserRequirements: "Requires a modern browser with Web Worker support",
    softwareHelp: {
      "@type": "CreativeWork",
      url: SITE_URL,
    },
  };

  return (
    <html className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('doccompress-theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <ThemeProvider>
          <I18nProvider>
            <ServiceWorkerRegister />
            <TooltipProvider>{children}</TooltipProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
