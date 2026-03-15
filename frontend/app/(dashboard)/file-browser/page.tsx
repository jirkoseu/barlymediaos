"use client";

import { TARGET_URL } from "@/app/layout";
import React, { useState, useEffect } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUp, Monitor, FolderPlus, Upload, RefreshCcw,
  Copy, Scissors, Trash, Edit, List, Grid, Folder, File, FileText,
  Presentation, Film, Archive, Settings, Image as ImageIcon, Music
} from "lucide-react";

// Shadcn UI Importy
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

// Typy
interface FileItem {
  id: string;
  name: string;
  path: string;
  date: string;
  type: string;
  size: string;
  iconType: string;
  isDir: boolean;
}

const API_URL = `http://${TARGET_URL}`;

export default function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  
  // Stavy pro cesty
  const [currentPath, setCurrentPath] = useState<string>("");
  const [parentPath, setParentPath] = useState<string>("");
  const [inputPath, setInputPath] = useState<string>(""); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Načtení souborů
  const fetchFiles = async (path: string = "") => {
      setIsLoading(true);
      try {
        const encodedPath = encodeURIComponent(path);
        
        const res = await fetch(`${API_URL}/api/files?path=${encodedPath}&t=${Date.now()}`, {
          cache: "no-store",
        });
        
        const data = await res.json();
        
        if (data.files) {
          setFiles(data.files);
          setCurrentPath(data.path);
          setInputPath(data.path); 
          setParentPath(data.parent); 
        }
  
        await new Promise((resolve) => setTimeout(resolve, 300));
  
      } catch (error) {
        console.error("Failed to fetch files:", error);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleNavigate = (path: string) => {
    setHistory((prev) => [...prev, currentPath]);
    fetchFiles(path);
  };

  const handleBack = () => {
    if (history.length > 0) {
      const previousPath = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      fetchFiles(previousPath);
    }
  };

  const handleUpLevel = () => {
    if (parentPath && parentPath !== currentPath) {
      setHistory((prev) => [...prev, currentPath]);
      fetchFiles(parentPath);
    }
  };

  const handleInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (inputPath !== currentPath) {
        handleNavigate(inputPath);
      }
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case "folder": return <Folder className="w-5 h-5 shrink-0 text-yellow-400 fill-yellow-400/20" />;
      case "pdf": return <File className="w-5 h-5 shrink-0 text-red-500" />;
      case "word": return <FileText className="w-5 h-5 shrink-0 text-blue-500" />;
      case "video": return <Film className="w-5 h-5 shrink-0 text-purple-500" />;
      case "image": return <ImageIcon className="w-5 h-5 shrink-0 text-blue-400" />;
      case "audio": return <Music className="w-5 h-5 shrink-0 text-pink-500" />;
      case "zip": return <Archive className="w-5 h-5 shrink-0 text-orange-400" />;
      case "exe": return <Settings className="w-5 h-5 shrink-0 text-green-500" />;
      case "txt": return <FileText className="w-5 h-5 shrink-0 text-gray-400" />;
      default: return <File className="w-5 h-5 shrink-0 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-full space-y-3 bg-background text-foreground">
      
      {/* --- Top Navigation Bar --- */}
      {/* Na mobilu flex-col (pod sebou), na desktopu flex-row (vedle sebe) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 bg-muted/40 p-2 rounded-lg border">
        
        {/* Tlačítka a Path Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
          
          {/* Obal pro šipky a refresh (na mobilu v jedné řadě) */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-1">
              <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleBack} 
                  disabled={history.length === 0}
                  title="Back in history"
                  className="h-9 w-9"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleUpLevel}
                  disabled={!parentPath || parentPath === currentPath}
                  title="Up to parent folder"
                  className="h-9 w-9"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>

            {/* Refresh tlačítko - na mobilu skočí doprava k šipkám */}
            <div className="sm:hidden flex items-center gap-1">
               <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => fetchFiles(currentPath)}
                title="Refresh"
                className="h-9 w-9"
               >
                <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
               </Button>
            </div>
          </div>
          
          <Separator orientation="vertical" className="hidden sm:block h-6 mx-1" />

          {/* Path Bar - na mobilu zabere celou šířku pod šipkami */}
          <div className="flex-1 flex items-center relative w-full">
            <div className="absolute left-3 flex items-center pointer-events-none">
                <Monitor className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input 
                value={inputPath || ""}
                onChange={(e) => setInputPath(e.target.value)}
                onKeyDown={handleInputSubmit}
                placeholder="Type path and press Enter..."
                className="pl-9 h-9 w-full bg-background border-input focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Refresh tlačítko - na desktopu klasicky vpravo */}
        <div className="hidden sm:flex items-center gap-1 ml-2">
           <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => fetchFiles(currentPath)}
            title="Refresh"
            className="h-9 w-9"
           >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
           </Button>
        </div>
      </div>

      {/* --- File List (Table) --- */}
      <div className="flex-1 border rounded-md bg-card overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-auto">
            <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                <TableRow>
                  {/* Name zabere maximum místa */}
                  <TableHead className="w-full sm:w-[50%]">Name</TableHead>
                  {/* Datum a Typ schováme na mobilu */}
                  <TableHead className="hidden md:table-cell whitespace-nowrap">Date modified</TableHead>
                  <TableHead className="hidden lg:table-cell">Type</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Size</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {files.length === 0 && !isLoading ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            Folder is empty or access denied.
                        </TableCell>
                    </TableRow>
                ) : (
                    files.map((file) => (
                    <TableRow
                        key={file.id}
                        onClick={() => file.isDir && handleNavigate(file.path)}
                        className={`
                            cursor-pointer transition-colors
                            hover:bg-muted/50
                            ${file.isDir ? 'font-medium' : ''}
                        `}
                    >
                        <TableCell className="py-2">
                            <div className="flex items-center gap-3">
                                {renderIcon(file.iconType)}
                                {/* Truncate zajistí, že se dlouhý název ustřihne třemi tečkami místo zalomení tabulky */}
                                <span className="truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
                                  {file.name}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground whitespace-nowrap hidden md:table-cell">
                          {file.date}
                        </TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground hidden lg:table-cell">
                          {file.type}
                        </TableCell>
                        <TableCell className="py-2 text-xs font-mono text-right text-muted-foreground whitespace-nowrap">
                          {file.size}
                        </TableCell>
                    </TableRow>
                    ))
                )}
            </TableBody>
            </Table>
        </div>
      </div>

      {/* --- Status Bar --- */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border rounded-lg text-xs text-muted-foreground">
        <div className="flex items-center gap-2 md:gap-3 truncate w-full">
            <span className="shrink-0">{files.length} items</span>
            <Separator orientation="vertical" className="h-3 shrink-0" />
            <span className="truncate flex-1 max-w-[150px] sm:max-w-none">{currentPath}</span>
        </div>
        <div className="flex flex-row gap-2 items-center justify-end shrink-0 pl-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="hidden sm:inline">Ready</span>
        </div>
      </div>
    </div>
  );
}