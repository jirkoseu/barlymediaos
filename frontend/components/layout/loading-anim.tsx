import React from 'react';

// Styl definuje animaci (kulička <-> sloupec)
const animationStyles = `
  @keyframes ball-to-column {
    0%, 100% {
      transform: scaleY(0.5); 
      border-radius: 50%;
      opacity: 0.9;
    }
    50% {
      transform: scaleY(1);
      border-radius: 0.5rem;
      opacity: 1;
    }
  }

  .animate-ball-to-column {
    animation: ball-to-column 2.5s infinite ease-in-out;
    transform-origin: bottom;
    animation-fill-mode: backwards;
  }
`;

/**
 * Komponenta, která zobrazuje animátor inspirovaný logem.
 */
export default function LoadingAnimation({ className }: { className?: string }) {
  return (
    <>
      {/* Vložení stylů pro animaci */}
      <style>{animationStyles}</style>

      <div className={`${className}`}>
        <div className="flex items-end space-x-2 fade-in">
          {/* Zelený tvar */}
          <div
            className="w-8 h-16 bg-[#1fB254] animate-ball-to-column"
            style={{ animationDelay: '0s' }}
          />
          {/* Žlutý tvar */}
          <div
            className="w-8 h-16 bg-[#f0b429] animate-ball-to-column"
            style={{ animationDelay: '0.4s' }}
          />
          {/* Červený tvar */}
          <div
            className="w-8 h-16 bg-[#e15241] animate-ball-to-column"
            style={{ animationDelay: '0.8s' }}
          />
        </div>
      </div>
    </>
  );
}

