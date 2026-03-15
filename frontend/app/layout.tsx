// app/layout.tsx
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Exportujeme URL, aby byla dostupná v celém projektu
export const TARGET_URL = "localhost:8000";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" storageKey="barly-theme">
          <Toaster />
          {/* Tady už není Sidebar ani Header, ty budou v (dashboard) layoutu */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}