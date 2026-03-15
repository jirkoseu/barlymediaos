import React from "react";
import Image from "next/image";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Film } from "lucide-react";
import { SearchResultItem } from "@/lib/types"; // Importujeme typy

interface MovieCardProps {
  data: SearchResultItem;
  onClick: (movie: SearchResultItem) => void;
}

export function MovieCard({ data, onClick }: MovieCardProps) {
  
  // Barvičky pro tagy (můžeme je mít i v configu, ale tady nevadí)
  const tagTypeColors = {
    year: "dark:bg-blue-900/50 dark:text-blue-400 text-blue-500 bg-blue-100",
    language: "dark:bg-green-900/50 dark:text-green-400 text-green-500 bg-green-100",
    quality: "dark:bg-purple-900/50 dark:text-purple-400 text-purple-500 bg-purple-100",
    other: "dark:bg-gray-700/50 dark:text-gray-400 text-gray-500 bg-gray-100",
  };
  const defaultColor = tagTypeColors.other;

  return (
    <Card
      className="p-0 w-64 h-4/7 gap-2 hover:scale-105 hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden group bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
      onClick={() => onClick(data)}
    >
      <div className="relative w-full h-80 bg-neutral-100 flex items-center justify-center overflow-hidden">
        {data.image ? (
          <Image
            src={data.image}
            alt={data.title}
            fill
            loading="lazy"
            className="object-cover group-hover:opacity-90 transition-opacity"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <Film className="h-12 w-12 text-neutral-300" />
        )}
      </div>

      <CardHeader className="p-3 pb-5">
        <CardTitle className="text-center text-sm font-semibold line-clamp-2 h-10 leading-tight">
          {data.title}
        </CardTitle>

        <div className="flex flex-row gap-1 justify-center items-center flex-wrap mt-2">
          {/* Badge pro velikost */}
          <Badge className="dark:bg-yellow-900/50 dark:text-yellow-400 text-yellow-600 bg-yellow-100 border-0 px-2 py-0.5 text-xs">
            {data.size}
          </Badge>

          {/* Renderování tagů (max 3) */}
          {data.tags.slice(0, 5).map((tag, idx) => {
            const colorClass =
              tagTypeColors[tag.type as keyof typeof tagTypeColors] ||
              defaultColor;
            return (
              <Badge key={idx} className={`${colorClass} border-0 px-2 py-0.5 text-xs`}>
                {tag.value}
              </Badge>
            );
          })}
        </div>
      </CardHeader>
    </Card>
  );
}