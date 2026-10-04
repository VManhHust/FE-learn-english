import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { LangProvider } from "@/lib/i18n/LangProvider";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { getLocale } from "@/lib/i18n/getLocale";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "LinguaFlow – Học Tiếng Anh Qua Nội Dung Thực Tế",
    template: "%s | LinguaFlow",
  },
  description:
    "Nền tảng học tiếng Anh miễn phí qua phương pháp Dictation và Shadowing. Luyện nghe, nói, phát âm với nội dung thực tế từ BBC, TED Talks, phim ảnh và podcast.",
  keywords: [
    "học tiếng Anh",
    "dictation",
    "shadowing",
    "luyện nghe tiếng Anh",
    "luyện nói tiếng Anh",
    "phát âm tiếng Anh",
    "learn English",
    "English listening",
    "English speaking",
    "LinguaFlow",
  ],
  authors: [{ name: "LinguaFlow" }],
  creator: "LinguaFlow",
  publisher: "LinguaFlow",
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
    locale: "vi_VN",
    alternateLocale: "en_US",
    siteName: "LinguaFlow",
    title: "LinguaFlow – Học Tiếng Anh Qua Nội Dung Thực Tế",
    description:
      "Luyện nghe, nói tiếng Anh miễn phí với phương pháp Dictation và Shadowing. Nội dung thực tế từ BBC, TED Talks, phim ảnh.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LinguaFlow – Học Tiếng Anh",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinguaFlow – Học Tiếng Anh Qua Nội Dung Thực Tế",
    description:
      "Luyện nghe, nói tiếng Anh miễn phí với phương pháp Dictation và Shadowing.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0e0c" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body>
        <GoogleTagManager />
        <ThemeProvider>
          <LangProvider>
            <AuthProvider>
              {children}
              <Toaster richColors position="top-right" />
            </AuthProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
