"use client";

import React, { useState, useEffect } from 'react';

/**
 * Komponenta, která zobrazuje aktuální čas.
 * Při přejetí myší se čas posune nahoru a pod ním se zobrazí aktuální datum.
 * Tato komponenta se musí vykreslovat na straně klienta, protože používá hooky
 * (useState, useEffect) pro získání a aktualizaci času v reálném čase.
 */
export default function DateTime() {
  // Stav pro uložení aktuálního data a času
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // Spustí interval, který každou sekundu aktualizuje čas
    const timerId = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    // Vyčistí interval, když je komponenta odpojena
    return () => {
      clearInterval(timerId);
    };
  }, []); // Prázdné pole závislostí zajistí, že se efekt spusti pouze jednou

  // Formátování času (např. 14:35:02)
  const timeString = currentDate.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Formátování data (např. 23. října 2025)
  const dateString = currentDate.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className="group flex flex-col items-center justify-center h-10
                transition-all duration-300 ease-in-out"
      // 'group' umožňuje stylovat potomky na základě stavu rodiče (group-hover)
    >
      {/* Časový element */}
      <div
        className="text-xl text-neutral-800 dark:text-neutral-200
                   transition-all duration-300 ease-in-out
                   group-hover:-translate-y-1 group-hover:text-sm" // Při hoveru se posune lehce nahoru
      >
        {timeString}
      </div>

      {/* Kontejner pro datum (skrytý, dokud není hover) */}
      <div
        className="transition-all duration-300 ease-in-out 
                   overflow-hidden max-h-0 group-hover:max-h-10"
        // Animace "vysunutí" pomocí změny max-height
      >
        <div className="text-xs dark:text-neutral-200 text-neutral-600 pt-1"> {/* pt-1 pro malou mezeru */}
          {dateString}
        </div>
      </div>
    </div>
  );
}
