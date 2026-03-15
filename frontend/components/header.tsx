"use client";

import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  User, 
  LogOut 
} from "lucide-react";
import { DynamicBreadcrumb } from "@/components/layout/dynbreadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import DateTime from "@/components/ui/time";

interface HeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export function Header({ isCollapsed, setIsCollapsed }: HeaderProps) {
  const router = useRouter();
  const username = "admin"; 

  const handleSignOut = () => {
    Cookies.remove("auth_token");
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-2 md:gap-4 bg-background/80 backdrop-blur-md p-3 md:p-4 border-b">
      
      {/* LEFT SIDE: Navigation */}
      <div className="flex flex-row items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="shrink-0" // Zabráni smrsknutí tlačítka
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        
        {/* Breadcrumb schováme na úplně nejmenších mobilech, zobrazíme až od velikosti 'sm' */}
        <div className="hidden sm:flex">
          <DynamicBreadcrumb />
        </div>
      </div>

      {/* RIGHT SIDE: User & Time */}
      <div className="flex flex-row items-center gap-2 md:gap-4">
        
        {/* User Dropdown with Badge */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex gap-2 p-1 px-2 hover:bg-accent rounded-full transition-all">
              <Badge variant="secondary" className="px-2 md:px-3 py-1 font-medium bg-primary/10 text-primary border-primary/20">
                <User className="h-3 w-3 md:mr-1" />
                {/* Na velmi malých displejích můžeme schovat i text 'admin' a nechat jen ikonu, ale zatím ho necháme */}
                <span className="hidden min-[380px]:block">{username}</span>
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{username}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive cursor-pointer focus:bg-red-200 dark:focus:bg-red-800/50 focus:text-destructive-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2 text-destructive" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Separátor a Čas schováme na mobilech ('hidden md:flex') */}
        <div className="hidden md:flex items-center gap-4">
          <div className="h-8 w-[1px] bg-border mx-1" />
          <DateTime />
        </div>
        
      </div>
    </header>
  );
}