import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { LangProvider } from "@/lib/i18n/LangProvider";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "LinguaFlow – Học Tiếng Anh",
  description: "Nền tảng học tiếng Anh qua nội dung thực tế",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body>
        <GoogleTagManager />
        <ThemeProvider>
          <LangProvider>
            {/* AuthProvider dùng chung toàn app — không cần đặt lại ở từng layout */}
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
