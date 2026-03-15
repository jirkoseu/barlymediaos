"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/header"; // Cestu k Headeru si případně uprav

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. ZLATÉ PRAVIDLO: Výchozí stav je TRUE (zasunutý). 
  // Tím zamezíme probliknutí na mobilech při prvním načtení.
  const [isCollapsed, setIsCollapsed] = useState(true);

  // 2. CHYTRÉ ROZBALENÍ: Když zjistíme, že jsme na velkém monitoru, menu rozbalíme.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsCollapsed(false); // Na desktopu rozbalíme
      } else {
        setIsCollapsed(true);  // Na mobilu ujistíme, že je zavřeno
      }
    };

    // Spustíme hned při načtení v prohlížeči
    handleResize();

    // Volitelně: Můžeme poslouchat i na změnu velikosti okna, když s ním uživatel hýbe
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* SIDEBAR */}
      <AppSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      {/* HLAVNÍ OBSAH */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* HEADER */}
        <Header isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        
        {/* STRÁNKA (Dashboard, Torrents, atd.) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}