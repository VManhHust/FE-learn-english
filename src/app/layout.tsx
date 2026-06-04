import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { LangProvider } from "@/lib/i18n/LangProvider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="vi" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body>
        <ThemeProvider>
          <LangProvider>
            {children}
            <Toaster richColors position="top-right" />
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
