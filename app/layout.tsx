import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "EcoPolyAI — Urban Farming Polibag Berbasis AI",
  description:
    "Platform Urban Farming Polibag & Pengolahan Limbah Organik Rumah Tangga Berbasis AI untuk lahan sempit 1m²",
  themeColor: "#10B981",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${geist.variable} font-sans antialiased`}>
        {/* TopBar hanya mobile — desktop pakai Sidebar */}
        <TopBar />

        {/* Main content area:
            - Mobile: pt-14 untuk menghindari TopBar fixed (h-14)
            - Desktop: pl-64 untuk sidebar, tidak ada TopBar */}
        <div className="pt-14 md:pt-0 md:pl-64">
          <main className="min-h-screen pb-24 md:pb-6">{children}</main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
