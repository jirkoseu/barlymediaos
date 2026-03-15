"use client";

import { TARGET_URL } from "@/app/layout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search, 
  FolderClosed, 
  Library, 
  Settings, 
  HardDrive,
  Activity,
  Server,
  DownloadCloud,
  ArrowRight
} from "lucide-react";

// Shadcn UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const quickLinks = [
  { label: "Search Media", description: "Find movies and shows", icon: Search, href: "/search", color: "text-green-500", bg: "bg-green-500/10" },
  { label: "File Browser", description: "Manage your downloads", icon: FolderClosed, href: "/file-browser", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { label: "Torrents", description: "Transmission client", icon: Library, href: "/torrents", color: "text-red-500", bg: "bg-red-500/10" },
  { label: "Settings", description: "System configuration", icon: Settings, href: "/settings", color: "text-neutral-500", bg: "bg-neutral-500/10" },
];

interface DiskStats {
  total_gb: number;
  used_gb: number;
  free_gb: number;
  percent_used: number;
}

interface ServiceStats {
  transmission: string;
  samba: string;
  minidlna: string;
}

interface Torrent {
  id: number;
  title: string;
  status: string;
  progress: number;
  downloadSpeed: string;
  size: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [diskStats, setDiskStats] = useState<DiskStats | null>(null);
  const [serviceStats, setServiceStats] = useState<ServiceStats | null>(null);
  const [activeDownloads, setActiveDownloads] = useState<number>(0);
  const [recentTorrents, setRecentTorrents] = useState<Torrent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch pro statická data (Disk a Dostupnost Služeb)
  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const [diskRes, servicesRes] = await Promise.all([
          fetch(`http://${TARGET_URL}/api/system/stats`),
          fetch(`http://${TARGET_URL}/api/system/services`)
        ]);

        const diskData = await diskRes.json();
        const servicesData = await servicesRes.json();

        if (!diskData.error) setDiskStats(diskData);
        setServiceStats(servicesData);
      } catch (error) {
        console.error("Failed to fetch dashboard HTTP data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStats();
    const interval = setInterval(fetchAllStats, 30000); 
    return () => clearInterval(interval);
  }, []);

  // 2. WebSocket pro živé statistiky stahování a tabulku
  useEffect(() => {
    let ws: WebSocket;
    
    const connect = () => {
        ws = new WebSocket(`ws://${TARGET_URL}/ws`);
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (Array.isArray(data)) {
                  // Počet aktivních stahování pro widget
                  const downloadingCount = data.filter((t: Torrent) => 
                    t.status && t.status.toLowerCase().includes('download')
                  ).length;
                  setActiveDownloads(downloadingCount);

                  // Uložíme si prvních 5 torrentů pro naši novou tabulku
                  setRecentTorrents(data.slice(0, 5));
                }
            } catch (e) {
                console.error("Error parsing WS data on dashboard", e);
            }
        };

        ws.onclose = () => {
            setTimeout(connect, 3000);
        };
    };

    connect();
    
    return () => { 
      if (ws) ws.close(); 
    };
  }, []);

  // Pomocná komponenta pro řádek služby
  const ServiceStatusRow = ({ name, status, children }: { name: string, status?: string, children?: React.ReactNode }) => {
    const isOnline = status === "online";
    
    return (
      <div className="flex justify-between items-center p-3 bg-muted/40 rounded-lg border border-border/50 transition-all hover:bg-muted/60">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sm">{name}</span>
          {children}
        </div>
        
        {status ? (
          <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md ${
            isOnline ? 'text-green-500 bg-green-500/10' : 'text-destructive bg-destructive/10'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-destructive'}`}></span>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground animate-pulse">Checking...</span>
        )}
      </div>
    );
  };

  // Pomocná fce pro barvy odznaků v tabulce
  const getStatusBadgeClass = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('download')) return 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20';
    if (s.includes('seed') || s.includes('complete')) return 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20';
    if (s.includes('pause') || s.includes('stop')) return 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20';
    if (s.includes('error')) return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20';
    return 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/20';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Hlavní uvítací sekce */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to barlyMediaOS. Monitoring core systems.
        </p>
      </div>

      {/* Rychlé odkazy */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.label} href={link.href}>
            <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 bg-card h-full">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-full transition-transform duration-300 group-hover:scale-110 ${link.bg}`}>
                  <link.icon className={`h-8 w-8 ${link.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{link.label}</h3>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Grid pro Disk a Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Statistiky Disku */}
        <Card className="lg:col-span-2 shadow-sm border-neutral-200 dark:border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-primary" />
                Storage Capacity
              </CardTitle>
              <CardDescription>Primary media drive utilization</CardDescription>
            </div>
            <Server className="h-8 w-8 text-muted-foreground opacity-20" />
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading && !diskStats ? (
              <div className="h-24 flex items-center justify-center text-muted-foreground animate-pulse">
                Analyzing disk space...
              </div>
            ) : diskStats ? (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-4xl font-bold tracking-tighter">{diskStats.used_gb}</span>
                    <span className="text-muted-foreground font-medium ml-1">GB used</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold">{diskStats.free_gb} GB</span>
                    <span className="text-muted-foreground text-sm block">free of {diskStats.total_gb} GB</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${
                      diskStats.percent_used > 90 ? 'bg-destructive' : 
                      diskStats.percent_used > 75 ? 'bg-orange-500' : 'bg-primary'
                    }`}
                    style={{ width: `${diskStats.percent_used}%` }}
                  />
                </div>
                <p className="text-right text-xs text-muted-foreground font-medium">
                  {diskStats.percent_used}% Utilization
                </p>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-destructive">
                Failed to load storage data.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Živý Status Služeb */}
        <Card className="shadow-sm border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Service Health
            </CardTitle>
            <CardDescription>Real-time system status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            
            <ServiceStatusRow name="Transmission (Torrents)" status={serviceStats?.transmission}>
              {activeDownloads > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
                  <DownloadCloud className="h-3.5 w-3.5 animate-pulse" />
                  {activeDownloads} active {activeDownloads === 1 ? 'download' : 'downloads'}
                </div>
              )}
            </ServiceStatusRow>

            <ServiceStatusRow name="Samba (SMB Share)" status={serviceStats?.samba} />
            <ServiceStatusRow name="MiniDLNA (Media Server)" status={serviceStats?.minidlna} />
          
          </CardContent>
        </Card>

      </div>

      {/* --- KARTA: RECENT TORRENTS --- */}
            <Card className="shadow-sm border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between ">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <DownloadCloud className="h-5 w-5 text-primary" />
                    Recent Transfers
                  </CardTitle>
                  <CardDescription>Live overview of your downloads</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild className="hidden sm:flex text-xs h-8">
                  <Link href="/torrents" className="flex items-center gap-1">
                    View All <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </CardHeader>
      
              <CardContent className="p-0">
                <div className="overflow-x-hidden">
                  <Table>
                    <TableHeader className="hidden md:table-header-group">
                      <TableRow className="border-b hover:bg-transparent">
                        <TableHead className="w-[45%] py-3 text-xs uppercase font-bold tracking-wider pl-4">Name</TableHead>
                        <TableHead className="py-3 text-xs uppercase font-bold tracking-wider">Status</TableHead>
                        <TableHead className="w-[25%] py-3 text-xs uppercase font-bold tracking-wider">Progress</TableHead>
                        <TableHead className="text-right py-3 text-xs uppercase font-bold tracking-wider pr-6">Speed</TableHead>
                      </TableRow>
                    </TableHeader>
                    
                    <TableBody>
                      {recentTorrents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-sm text-muted-foreground italic block md:table-cell">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Activity className="h-8 w-8 opacity-20" />
                              <span>No active transfers.</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentTorrents.map((torrent) => (
                          <TableRow 
                            key={torrent.id}
                            onClick={() => router.push('/torrents')}
                            className="flex flex-col md:table-row py-2 md:py-0 border-b last:border-0 hover:bg-primary/[0.02] transition-colors cursor-pointer group"
                          >
                            {/* --- Název a Status (Mobil: Řádek 1) --- */}
                            <TableCell className="border-0  p-3 md:p-4 flex items-center justify-between md:table-cell">
                              <div className="font-medium text-foreground group-hover:text-primary transition-colors max-w-[250px] sm:max-w-[400px] md:max-w-[250px] lg:max-w-[350px] truncate text-sm" title={torrent.title}>
                                {torrent.title}
                              </div>
                              {/* Status badge - na mobilu */}
                              <div className="md:hidden ml-2 shrink-0">
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium ${getStatusBadgeClass(torrent.status)}`}>
                                  {torrent.status}
                                </Badge>
                              </div>
                            </TableCell>
      
                            {/* Status (Desktop) */}
                            <TableCell className="hidden md:table-cell border-0 py-2.5">
                              <Badge variant="outline" className={`text-[11px] px-2 py-0 font-medium ${getStatusBadgeClass(torrent.status)}`}>
                                {torrent.status}
                              </Badge>
                            </TableCell>
      
                            {/* --- Progress (Mobil: Řádek 2) --- */}
                            <TableCell className="border-0  px-3 md:px-4 py-1 md:py-2.5">
                              <div className="flex flex-col gap-1 w-full">
                                <div className="flex justify-between items-center md:hidden">
                                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Progress</span>
                                  <span className="text-[11px] text-muted-foreground font-semibold tabular-nums">{Math.round(torrent.progress)}%</span>
                                </div>
                                <span className="hidden md:block text-[11px] text-muted-foreground font-semibold mb-1 tabular-nums">
                                  {Math.round(torrent.progress)}%
                                </span>
                                <Progress value={torrent.progress} className="h-1.5 md:h-1" />
                              </div>
                            </TableCell>
      
                            {/* --- Speed (Mobil: Řádek 3) --- */}
                            <TableCell className="border-0 hidden px-3 md:px-4 py-2 md:py-2.5 flex justify-between items-center md:table-cell text-xs md:text-right md:pr-6">
                              <span className="md:hidden text-[10px] text-muted-foreground uppercase font-semibold">Speed</span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">{torrent.downloadSpeed}</span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
      
                {/* Tlačítko pro mobily */}
                <div className="p-3 bg-muted/10 border-t sm:hidden">
                  <Button variant="outline" className="w-full text-xs h-9" asChild>
                    <Link href="/torrents" className="flex items-center justify-center">
                      View All Transfers <ArrowRight className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

    </div>
  );
}