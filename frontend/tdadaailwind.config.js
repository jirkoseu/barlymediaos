/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // <-- Toto je klíčová část!
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Upravte podle struktury vašeho projektu
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Váš CSS soubor definuje barvy pomocí CSS proměnných,
      // takže zde pravděpodobně nepotřebujete rozsáhlou konfiguraci barev,
      // pokud ji nevyužívají shadcn/ui komponenty atd.
    },
  },
  plugins: [
    require('tailwindcss-animate') // Vidím, že importujete "tw-animate-css"
  ],
}