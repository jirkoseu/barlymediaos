"use client";
import { TARGET_URL } from "@/app/layout";
import { useState, useMemo, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  X, 
  Search, 
  Plus, 
  WifiOff
} from 'lucide-react';

// Shadcn UI imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";

// Definice typu pro Torrent
interface Torrent {
  id: number;
  title: string; 
  status: string; 
  progress: number;
  downloadSpeed: string;
  uploadSpeed: string;
  size: string; 
}

const API_URL = `http://${TARGET_URL}`;
const WS_URL = `ws://${TARGET_URL}/ws`;

export default function TorrentsPage() {
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddTorrent, setShowAddTorrent] = useState<boolean>(false);
  const [newMagnet, setNewMagnet] = useState<string>('');
  
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // --- WebSocket Connection ---
  useEffect(() => {
    let ws: WebSocket;
    
    const connect = () => {
        ws = new WebSocket(WS_URL);
        ws.onopen = () => setIsConnected(true);
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setTorrents(data);
            } catch (e) {
                console.error("Error parsing WS data", e);
            }
        };
        ws.onclose = () => {
            setIsConnected(false);
            setTimeout(connect, 3000);
        };
    };

    connect();
    return () => { if (ws) ws.close(); };
  }, []);

  // --- API Actions ---
  const handleAddTorrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMagnet.trim()) return;
    try {
        await fetch(`${API_URL}/api/torrents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ magnet: newMagnet, title: "New Download" }), 
        });
        setNewMagnet('');
        setShowAddTorrent(false);
    } catch (error) {
        console.error("Failed to add torrent", error);
    }
  };

  const pauseTorrent = async (id: number) => {
    try {
        await fetch(`${API_URL}/api/torrents/${id}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'pause' }),
        });
    } catch (error) { console.error("Failed to pause", error); }
  };

  const resumeTorrent = async (id: number) => {
    try {
        await fetch(`${API_URL}/api/torrents/${id}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'resume' }),
        });
    } catch (error) { console.error("Failed to resume", error); }
  };

  const removeTorrent = async (id: number) => {
    try {
        await fetch(`${API_URL}/api/torrents/${id}`, { method: 'DELETE' });
    } catch (error) { console.error("Failed to delete", error); }
  };

  // --- Filtering & Logic ---
  const filteredTorrents = useMemo(() => {
    let filtered = torrents;
    const tab = activeTab.toLowerCase();

    if (tab !== 'all') {
      filtered = filtered.filter(t => {
        const s = t.status.toLowerCase();
        if (tab === 'downloading') return s.includes('download');
        if (tab === 'completed') return s.includes('seed') || s.includes('complete');
        if (tab === 'active') return s.includes('download') || s.includes('upload');
        if (tab === 'inactive') return s.includes('pause') || s.includes('stop') || s.includes('error');
        return true;
      });
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(query));
    }
    return filtered;
  }, [torrents, activeTab, searchQuery]);

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('download')) return 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20';
    if (s.includes('seed') || s.includes('complete')) return 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20';
    if (s.includes('pause') || s.includes('stop')) return 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20';
    if (s.includes('error')) return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20';
    return 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/20';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-full space-y-4 bg-background text-foreground">
      
      {/* --- Header & Controls --- */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        
        {/* Taby - OPRAVENO: Na mobilu se zalamují (flex-wrap) a text je menší, už žádné scrollování! */}
        <div className="w-full xl:w-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-wrap h-auto w-full justify-start gap-1 p-1 bg-muted/50 rounded-lg">
              {['All', 'Downloading', 'Completed', 'Active', 'Inactive'].map((tab) => (
                <TabsTrigger 
                  key={tab} 
                  value={tab} 
                  className="flex-grow sm:flex-grow-0 text-xs sm:text-sm px-2 sm:px-4 py-1.5 h-auto data-[state=active]:shadow-sm"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Vyhledávání a přidání */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
            {!isConnected && (
                <Badge variant="destructive" className="w-full sm:w-auto justify-center gap-1 items-center animate-pulse">
                    <WifiOff className="h-3 w-3" /> Reconnecting...
                </Badge>
            )}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search torrents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full text-sm"
            />
          </div>
          <Button onClick={() => setShowAddTorrent(true)} className="w-full sm:w-auto shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Add Torrent
          </Button>
        </div>
      </div>

      {/* --- Table Section --- */}
      <div className="flex-1 overflow-auto border-neutral-200 dark:border-neutral-800 rounded-lg border bg-card">
        <Table className="rounded-lg">
          <TableHeader className="hidden md:table-header-group bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
            <TableRow className="text-sm">
              <TableHead className="w-[35%]">Name</TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="w-[25%]">Progress</TableHead>
              <TableHead className="w-[10%] text-right whitespace-nowrap">Speed</TableHead>
              <TableHead className="w-[5%] text-right">Size</TableHead>
              <TableHead className="w-[10%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {filteredTorrents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground italic md:table-cell block">
                  <div className="flex flex-col items-center justify-center h-full w-full gap-2">
                    {isConnected ? (
                      <span>No torrents found.</span>
                    ) : (
                      <>
                        <span>Waiting for backend connection...</span>
                        <Spinner />
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTorrents.map((torrent) => (
                <TableRow 
                  key={torrent.id}
                  className="flex flex-col md:table-row py-3 md:py-0 border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  
                  {/* --- Název a Status (Mobil: Řádek 1) --- */}
                  <TableCell className="border-0 md:border-b p-2 md:p-4 flex items-center justify-between md:table-cell">
                    <div className="font-medium max-w-[250px] sm:max-w-[400px] md:max-w-[300px] lg:max-w-[400px] truncate text-sm" title={torrent.title}>
                      {torrent.title}
                    </div>
                    {/* Status badge - na mobilu */}
                    <div className="md:hidden ml-2 shrink-0 ">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStatusBadgeClass(torrent.status)}`}>
                        {torrent.status}
                      </Badge>
                    </div>
                  </TableCell>

                  {/* Status (Desktop) */}
                  <TableCell className="hidden md:table-cell md:border-b">
                    <Badge variant="outline" className={`text-xs ${getStatusBadgeClass(torrent.status)}`}>
                      {torrent.status}
                    </Badge>
                  </TableCell>

                  {/* --- Progress (Mobil: Řádek 2) --- */}
                  <TableCell className="border-0 md:border-b px-2 md:px-4 py-1 md:py-4">
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex justify-between items-center md:hidden">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Progress</span>
                        <span className="text-xs text-muted-foreground font-medium">{Math.round(torrent.progress)}%</span>
                      </div>
                      <span className="hidden md:block text-xs text-muted-foreground font-medium mb-1">
                        {Math.round(torrent.progress)}%
                      </span>
                      <Progress value={torrent.progress} className="h-1.5 md:h-2" />
                    </div>
                  </TableCell>

                  {/* --- Info a Akce (Mobil: Řádek 3) --- */}
                  <TableCell className="border-0 md:border-b px-2 md:px-4 py-2 md:py-4 flex justify-between items-center md:table-cell text-xs md:text-sm">
                    {/* Rychlost */}
                    <div className="flex flex-col md:items-end">
                       <span className="md:hidden text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Speed</span>
                       <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">{torrent.downloadSpeed}</span>
                    </div>

                    {/* Velikost na mobilu */}
                    <div className="flex flex-col md:hidden items-center px-4 border-l border-r border-border/50">
                       <span className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Size</span>
                       <span className="text-xs text-muted-foreground">{torrent.size}</span>
                    </div>

                    {/* Akce na mobilu */}
                    <div className="flex gap-1 md:hidden">
                      {torrent.status.toLowerCase().includes('download') ? (
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => pauseTorrent(torrent.id)}>
                          <Pause className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => resumeTorrent(torrent.id)}>
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="outline" size="icon" className="h-7 w-7 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => removeTorrent(torrent.id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>

                  {/* Size (Desktop) */}
                  <TableCell className="hidden md:border-b md:table-cell text-right text-sm text-muted-foreground">
                    {torrent.size}
                  </TableCell>

                  {/* Akce (Desktop) */}
                  <TableCell className="hidden md:border-b md:table-cell text-right">
                    <div className="flex justify-end gap-1">
                      {torrent.status.toLowerCase().includes('download') ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => pauseTorrent(torrent.id)}>
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => resumeTorrent(torrent.id)}>
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => removeTorrent(torrent.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>

                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog pro přidání torrentu */}
      <Dialog open={showAddTorrent} onOpenChange={setShowAddTorrent}>
        <DialogContent className="sm:max-w-[425px] w-[95vw] rounded-xl mx-auto">
          <DialogHeader>
            <DialogTitle>Add Torrent</DialogTitle>
            <DialogDescription>Paste sktorrent link or magnet link below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTorrent} className="grid gap-4 py-4">
            <Input
              placeholder="https://sktorrent.eu/... nebo magnet:?"
              value={newMagnet}
              onChange={(e) => setNewMagnet(e.target.value)}
              autoFocus
            />
            <DialogFooter className="flex-row gap-2 sm:justify-end">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setShowAddTorrent(false)}>Cancel</Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={!newMagnet.trim()}>Start Download</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}