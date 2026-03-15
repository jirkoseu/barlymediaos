"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

// Pomocná funkce pro hezčí formátování názvů
// Např. "file-browser" -> "File browser"
const capitalize = (s: string) => {
    const formatted = s.replace(/-/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  // Rozdělí URL na segmenty a odfiltruje prázdné (pro kořenovou cestu "/")
  const segments = pathname.split('/').filter(Boolean); 

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {/* Zobrazí oddělovač pouze pokud nejsme na hlavní stránce */}
        {segments.length > 0 && <BreadcrumbSeparator />}
        
        {segments.map((segment, index) => {
          // Vytvoří cestu pro každý segment, např. "/settings", pak "/settings/sharing"
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const isLast = index === segments.length - 1;

          return (
            <Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  // Poslední segment je aktuální stránka (není to odkaz)
                  <BreadcrumbPage>{capitalize(segment)}</BreadcrumbPage>
                ) : (
                  // Předchozí segmenty jsou odkazy
                  <BreadcrumbLink asChild>
                    <Link href={href}>{capitalize(segment)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {/* Zobrazí oddělovač za každým segmentem kromě posledního */}
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}