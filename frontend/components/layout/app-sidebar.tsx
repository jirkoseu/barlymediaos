"use client";

import { cn } from "@/lib/utils";
import { useEffect } from "react"; 
import { Home, Settings, User, FolderClosed, Search, Library } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

// Settings jsme vyndali z tohoto pole, protože bude mít speciální místo
const navItems = [
  { label: "Dashboard", icon: Home, href: "/" },
  { label: "Search", icon: Search, href: "/search" },
  { label: "File Browser", icon: FolderClosed, href: "/file-browser" },
  { label: "Torrents", icon: Library, href: "/torrents" },
];

interface AppSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed?: (val: boolean) => void;
}

export function AppSidebar({ isCollapsed, setIsCollapsed }: AppSidebarProps) {
  const pathname = usePathname();

  // --- Automatické zasunutí při načtení na mobilu ---
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768 && setIsCollapsed) {
      setIsCollapsed(true);
    }
  }, [setIsCollapsed]);
  // ---------------------------------------------------------

  return (
    <>
      {/* Mobilní overlay: Ztmaví pozadí a umožní zavřít menu kliknutím vedle */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsCollapsed && setIsCollapsed(true)}
        />
      )}

      <div
        className={cn(
          "bg-background border-r p-3 transition-transform duration-300 ease-in-out z-50 flex flex-col h-screen fixed inset-y-0 left-0",
          // MOBIL: Když je isCollapsed true, odjede úplně mimo obrazovku
          isCollapsed ? "-translate-x-full" : "translate-x-0",
          // DESKTOP: Zůstává na obrazovce, jen mění šířku
          "md:relative md:translate-x-0",
          isCollapsed ? "w-64 md:w-[72px]" : "w-64"
        )}
      >
        
        {/* HLAVIČKA SIDEBARU */}
        <div className="mb-8 p-2 flex items-center justify-between">
          <div className="flex items-center justify-center">
            <Image
              src="/images/barlymediaos_logob.svg"
              alt="barlyMediaOS Logo"
              width={48}
              height={32}
              className={cn(
                "transition-all duration-300",
                isCollapsed ? "mr-0" : "mr-3"
              )}
            />
            {!isCollapsed && (
              <h2 className="text-lg whitespace-nowrap opacity-100 transition-opacity duration-500 fade-in">
                barlyMediaOS
              </h2>
            )}
          </div>
        </div>

        {/* HLAVNÍ NAVIGACE */}
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => {
                  // Zavře menu na mobilu automaticky po kliknutí na odkaz
                  if (window.innerWidth < 768 && setIsCollapsed) {
                    setIsCollapsed(true);
                  }
                }}
                className={cn(
                  "flex items-center gap-4 p-2 rounded-lg transition-colors group",
                  isActive 
                    ? "bg-accent text-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  isCollapsed ? "md:w-min md:ml-1.5" : ""
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className={cn("whitespace-nowrap font-medium", isCollapsed && "md:hidden")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* SETTINGS ÚPLNĚ DOLE */}
        <div className="mt-auto pt-4 border-t">
          <Link
            href="/settings"
            onClick={() => {
              if (window.innerWidth < 768 && setIsCollapsed) setIsCollapsed(true);
            }}
            className={cn(
              "flex items-center gap-4 p-2 rounded-lg transition-colors group text-muted-foreground hover:bg-accent hover:text-foreground",
              pathname === "/settings" ? "bg-accent text-foreground shadow-sm" : "",
              isCollapsed ? "md:w-min md:ml-1.5" : ""
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span className={cn("whitespace-nowrap font-medium", isCollapsed && "md:hidden")}>
              Settings
            </span>
          </Link>
        </div>

      </div>
    </>
  );
}