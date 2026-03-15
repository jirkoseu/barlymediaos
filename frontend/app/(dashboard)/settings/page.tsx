"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { TARGET_URL } from "@/app/layout";
import { 
  HardDrive, 
  ShieldCheck, 
  Save, 
  Settings, 
  RefreshCw,
  Activity,
  Video
} from "lucide-react";

// Shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch"; 
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [mediaPath, setMediaPath] = useState("");
  const [sambaEnabled, setSambaEnabled] = useState(false);
  const [dlnaEnabled, setDlnaEnabled] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPath, setIsSavingPath] = useState(false);
  const [isSavingServices, setIsSavingServices] = useState(false);

  // 1. Načtení aktuálního nastavení z backendu při startu
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`http://${TARGET_URL}/api/settings`);
        const data = await response.json();
        
        if (!data.error) {
          setMediaPath(data.media_path);
          setSambaEnabled(data.samba_enabled);
          setDlnaEnabled(data.minidlna_enabled);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast.error("Could not fetch current configuration");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // 2. Uložení pouze cesty k médiím
  const savePath = async () => {
    setIsSavingPath(true);
    const tid = toast.loading("Updating storage path...");
    try {
      const response = await fetch(`http://${TARGET_URL}/api/settings/path`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media_path: mediaPath }),
      });
      if (!response.ok) throw new Error();
      toast.success("Storage path updated", { id: tid });
    } catch (e) {
      toast.error("Save failed", { id: tid });
    } finally {
      setIsSavingPath(false);
    }
  };

  // 3. Uložení stavu služeb
  const saveServices = async () => {
    setIsSavingServices(true);
    const tid = toast.loading("Applying service changes...");
    try {
      const response = await fetch(`http://${TARGET_URL}/api/settings/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          samba_enabled: sambaEnabled,
          minidlna_enabled: dlnaEnabled,
        }),
      });
      if (!response.ok) throw new Error();
      toast.success("Services updated and restarted", { id: tid });
    } catch (e) {
      toast.error("Failed to update services", { id: tid });
    } finally {
      setIsSavingServices(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground text-sm">Configure barlyMediaOS storage and network protocols.</p>
        </div>
      </div>

      {/* --- Sekce 1: Storage --- */}
      <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden bg-card">
        <CardHeader className="bg-muted/10 border-b pb-4">
          <CardTitle className="text-lg flex items-center gap-2 font-semibold">
            <HardDrive className="h-4 w-4 text-primary" />
            Storage Configuration
          </CardTitle>
          <CardDescription>The path where your media files and database are located.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Primary Media Path</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={mediaPath}
                onChange={(e) => setMediaPath(e.target.value)}
                placeholder="/mnt/media"
                className="font-mono text-sm bg-muted/20 border-border/40 focus-visible:ring-primary/20"
              />
              <Button onClick={savePath} disabled={isSavingPath} className="shrink-0 shadow-sm">
                {isSavingPath ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Path
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground italic px-1">
              Note: This folder will be used by Samba, DLNA and Transmission.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* --- Sekce 2: Services --- */}
      <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden bg-card">
        <CardHeader className="bg-muted/10 border-b pb-4">
          <CardTitle className="text-lg flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Network Services
          </CardTitle>
          <CardDescription>Enable or disable file sharing and streaming protocols.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          
          {/* Samba Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Samba (SMB)</span>
                <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">Sharing</Badge>
              </div>
              <p className="text-xs text-muted-foreground max-w-md">
                Access your files from macOS Finder or Windows Explorer.
              </p>
            </div>
            <Switch 
              checked={sambaEnabled} 
              onCheckedChange={setSambaEnabled} 
            />
          </div>

          <div className="h-px bg-border/40" />

          {/* DLNA Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">MiniDLNA</span>
                <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">Streaming</Badge>
              </div>
              <p className="text-xs text-muted-foreground max-w-md">
                Stream movies directly to your Smart TV or game consoles.
              </p>
            </div>
            <Switch 
              checked={dlnaEnabled} 
              onCheckedChange={setDlnaEnabled} 
            />
          </div>

          <div className="pt-2">
            <Button onClick={saveServices} variant="secondary" disabled={isSavingServices} className="w-full sm:w-auto">
              {isSavingServices ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Apply Services
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="flex items-center justify-center gap-2 text-muted-foreground opacity-50 text-[10px] uppercase tracking-tighter">
        <Activity className="h-3 w-3" />
        barlyMediaOS v1.0.0 — Build 2026
      </div>
    </div>
  );
}