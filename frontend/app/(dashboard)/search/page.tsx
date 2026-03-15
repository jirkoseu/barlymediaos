"use client";
import { TARGET_URL } from "@/app/layout";
import React, { useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, Download } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";
import { Button } from "@/components/ui/button";

import { MovieCard } from "@/components/layout/movie-card"; 
import { SearchResultItem } from "@/lib/types";
import LoadingAnimation from "@/components/layout/loading-anim";
import { toast } from "sonner";

// Typy zpráv ze streamu (necháme lokálně, týkají se jen logiky parseru)
type StreamMessage = 
  | { type: 'info' | 'processing' | 'error'; msg?: string; title?: string }
  | { type: 'result'; data: SearchResultItem }
  | { type: 'done' | 'end'; msg?: string };

export default function Search() {
  const [query, setQuery] = useState("");
  const [isSearching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [statusMessage, setStatusMessage] = useState(""); 
  const [hasSearched, setHasSearched] = useState(false);
  const [isTdownloading, setisTdownloading] = useState(false);
  
  const [selectedMovie, setSelectedMovie] = useState<SearchResultItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 🎨 Barvy tagů pro DIALOG
  const tagTypeColors = {
    year: "dark:bg-blue-800 dark:text-blue-400 text-blue-500 bg-blue-100",
    language: "dark:bg-green-700 dark:text-green-400 text-green-500 bg-green-100",
    quality: "dark:bg-purple-700 dark:text-purple-400 text-purple-500 bg-purple-100",
    other: "dark:bg-gray-700 dark:text-gray-400 text-gray-500 bg-gray-100",
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    // Pokud chceš, aby předchozí výsledky zůstaly rozmazané pod animací, 
    // NEmaž je hned. Místo setResults([]) je necháme, překreslí se až přijdou nová data.
    if (results.length === 0) setResults([]); 
    
    setStatusMessage("Starting engines...");
    setHasSearched(true);

    try {
      // Vymazání starých výsledků těsně před startem streamu, aby naběhly čistě ty nové
      setResults([]); 
      
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(`http://${TARGET_URL}/search?query=${encodedQuery}`);
      if (!response.body) throw new Error("ReadableStream not supported.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; 

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg: StreamMessage = JSON.parse(line);
            if (msg.type === "result") {
              setResults((prev) => [...prev, msg.data]);
            } else if (msg.type === "info" || msg.type === "processing") {
              setStatusMessage(msg.msg || msg.title || "Working...");
            } else if (msg.type === "done" || msg.type === "end") {
              setSearching(false);
            }
          } catch (err) { console.error(err); }
        }
      }
    } catch (error) {
      console.error(error);
      setStatusMessage("Chyba serveru.");
    } finally {
      setSearching(false);
    }
  };

  const openDetail = (movie: SearchResultItem) => {
    setSelectedMovie(movie);
    setIsDialogOpen(true);
  };

  const handleAddTorrent = async (link?: string, title?:string) => {
    try {
        await fetch(`http://${TARGET_URL}/api/torrents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ magnet: link, title: "New Download" }), 
        });
      setisTdownloading(true);
      toast.success(`Downloading ${title}`, {
        description: `Started downloading file ${title}`,
        action: {
          label: "Open",
          onClick: () => window.open("torrents"),
        },
      })
    } catch (error) {
        console.error("Failed to add torrent", error);
    }
  };
  
  return (
    <main className="h-full w-full flex flex-col items-center justify-center relative pt-4 md:pt-0 pb-10">
      
      {/* --- SEARCH INPUT --- */}
      <div className={`z-40 flex flex-col items-center justify-center gap-3 w-full max-w-2xl px-4 transition-all duration-500 sticky top-4 md:absolute ${isSearching || hasSearched ? "md:top-0" : "md:top-1/3"}`}>
        <form onSubmit={handleSearch} className="w-full flex justify-center">
          <InputGroup className={`z-10 w-full transition-all duration-300 shadow-lg bg-background ${isSearching ? "opacity-90 ring-2 ring-primary/20" : ""}`}>
            
            <InputGroupAddon className="pl-2 sm:pl-4">
              {isSearching ? <Spinner className="h-5 w-5 text-neutral-400" /> : <SearchIcon className="h-5 w-5 text-neutral-400" />}
            </InputGroupAddon>
            
            <InputGroupInput
              placeholder={isSearching ? statusMessage : "Search movies and series..."}
              className="text-base sm:text-lg py-5 sm:py-6 focus-visible:ring-0 border-0" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isSearching} 
            />
            
            <InputGroupAddon align="inline-end" className="pr-1 sm:pr-2">
              <InputGroupButton 
                type="submit"
                disabled={isSearching}
                className="hidden sm:flex"
              >
                Search
              </InputGroupButton>
            </InputGroupAddon>

          </InputGroup>
        </form>

        <div className={`z-0 text-xs sm:text-sm bg-neutral-100 dark:bg-neutral-800 p-1 px-3 rounded-full dark:border-neutral-700 border text-neutral-500 transition-all duration-500 shadow-sm ${isSearching ? "opacity-100" : "-mt-10 opacity-0 pointer-events-none"}`}>
          <span>{statusMessage}</span>
        </div>
      </div>

      {/* --- LOADING ANIMATION OVERLAY --- */}
      {isSearching && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none mt-10">
          <LoadingAnimation />
        </div>
      )}

      {/* --- VÝSLEDKY --- */}
      <div 
        className={`w-full px-4 flex flex-wrap justify-center gap-6 transition-all duration-500 mt-24 md:mt-32 max-h-full
        ${!hasSearched ? "opacity-0 pointer-events-none" : 
          isSearching ? "blur-md opacity-40 pointer-events-none grayscale-[30%]" : "opacity-100"}`}
      >
        {!isSearching && hasSearched && results.length === 0 && (
           <div className="text-neutral-400 text-lg mt-10">Nic jsme nenašli.</div>
        )}
        
        {results.map((item) => (
          <MovieCard 
            key={item.url} 
            data={item} 
            onClick={openDetail} 
          />
        ))}
      </div>
      
      {/* --- DIALOG --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* ... (Tvoje původní dialog content bez změn) ... */}
        <DialogContent className="w-full sm:max-w-4xl h-2/3 p-0 overflow-hidden flex flex-col sm:flex-row bg-white dark:bg-neutral-950">
            {selectedMovie && (
            <>
              <div className="relative w-full sm:w-2/5 h-64 sm:h-auto bg-black">
                 {selectedMovie.image ? (
                    <Image src={selectedMovie.image} alt={selectedMovie.title} fill className="object-contain sm:object-cover" />
                 ) : (
                     <div className="flex h-full items-center justify-center text-white">Bez náhledu</div>
                 )}
              </div>
              <div className="flex flex-col p-6 w-full sm:w-3/5 gap-4">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-left leading-tight">{selectedMovie.title}</DialogTitle>
                  <div className="flex flex-row flex-wrap gap-2 mt-3">
                    <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">{selectedMovie.size}</Badge>
                    {selectedMovie.tags.map((tag, idx) => (
                         <Badge key={idx} className={tagTypeColors[tag.type as keyof typeof tagTypeColors]}>{tag.value}</Badge>
                    ))}
                  </div>
                </DialogHeader>
                <DialogDescription className="text-neutral-600 dark:text-neutral-300 text-base mt-2">
                  <span>File is ready to download.</span>
                  
                  <span className="block text-xs text-neutral-400 mt-4 select-all">
                    Source: {selectedMovie.url}
                  </span>
                </DialogDescription>
                <DialogFooter className="mt-auto pt-6 flex gap-2 justify-end">
                  <DialogClose asChild><Button variant="secondary">Close</Button></DialogClose>
                  {!isTdownloading && selectedMovie.download_link ? (
                    <Button className="gap-2" onClick={() => handleAddTorrent(selectedMovie.download_link, selectedMovie.title)}>
                          <Download className="h-4 w-4" /> Download
                      </Button>
                  ) : (
                      <Button disabled variant="outline"><Spinner /> Downloading</Button>
                      
                  )}
                </DialogFooter>
              </div>
            </>
            )}
        </DialogContent>
      </Dialog>

    </main>
  );
}