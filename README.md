# barlyMediaOS

## Funkcionality projektu

- Responzivní tabulka na **Dashboard**
- Popisky v **System Settings**
- Nastavení **cesty pro stahování filmů** s vlastním tlačítkem **Save**
- **Logo na login page**

---

# 🚀 Návod na spuštění projektu barlyMediaOS

Vítejte v repozitáři maturitního projektu **barlyMediaOS**.  
Tento návod vás krok za krokem provede procesem od stažení zdrojových kódů až po spuštění plně funkční aplikace ve vašem prohlížeči.

Celý projekt je **kontejnerizován**, což znamená, že si nemusíte do počítače instalovat **Python, Node.js ani databáze**.  
Vše se spustí v izolovaném prostředí pomocí Dockeru.

---

# 🛠️ Krok 1: Co budete potřebovat (Předpoklady)

Než začnete, ujistěte se, že máte na svém počítači nainstalované tyto programy:

1. **Git** – pro stažení projektu  
2. **Docker Desktop** – ke stažení na https://www.docker.com/

Ujistěte se, že aplikace **Docker běží na pozadí**.

---

# 📥 Krok 2: Stažení projektu

Otevřete si terminál (Příkazový řádek / PowerShell / Terminal) a stáhněte projekt:

```bash
# Naklonování repozitáře
git clone <ZDE_VLOZTE_ODKAZ_NA_VAS_GIT_REPOZITAR>

# Přesunutí do složky projektu
cd barlyMediaOS
```

**Poznámka:**  
Pokud projekt hodnotíte ze **staženého ZIP archivu**, tento krok přeskočte a pouze otevřete složku projektu v terminálu.

---

# ⚙️ Krok 3: Konfigurace prostředí

Projekt potřebuje pro svůj běh **proměnné prostředí**.

V hlavním adresáři projektu vytvořte kopii souboru `.env.example` a pojmenujte ji `.env`.

### Windows (PowerShell)

```powershell
Copy-Item .env.example -Destination .env
```

### Mac / Linux

```bash
cp .env.example .env
```

Soubor již obsahuje **výchozí konfiguraci**, není nutné nic upravovat.

---

# 🐳 Krok 4: Sestavení a spuštění (Docker)

Nyní projekt sestavíme a spustíme jedním příkazem:

```bash
docker compose up -d --build
```

### Co tento příkaz dělá?

- stáhne prostředí pro **Python backend**
- stáhne prostředí pro **Next.js frontend**
- nainstaluje všechny závislosti
- sestaví projekt
- spustí kontejnery na pozadí (`-d = detached mode`)

⚠️ **První spuštění může trvat několik minut** podle rychlosti internetu a počítače.

---

# 🌐 Krok 5: Otevření aplikace

Jakmile Docker dokončí spuštění kontejnerů, aplikace je připravena.

Otevřete prohlížeč a přejděte na:

```
http://localhost:3000
```

### Dokumentace backendu

Pro oponenty je dostupná také **API dokumentace**:

```
http://localhost:8000/docs
```

---

# 🔐 Krok 6: Přihlášení do systému

Po otevření aplikace se zobrazí **přihlašovací obrazovka**.

Pro účely testování jsou přístupové údaje pevně nastaveny:

**Uživatelské jméno**

```
admin
```

**Heslo**

```
barly123
```

Po přihlášení budete přesměrováni na **hlavní Dashboard**.

---

# 🧪 Krok 7: Co doporučuji vyzkoušet

Systém obsahuje **ukázková data**, aby nebyl prázdný.

Doporučuji projít tyto sekce:

### Dashboard
- statistiky systému
- stav simulovaných služeb

### Search
- zkuste vyhledat film (např. `Matrix`)
- přidání filmu do fronty

### Torrents
- simulace správy stahování
- možnost **pauzy**
- možnost **smazání**

### Files
- prohlížení struktury médií na disku

---

# 🛑 Krok 8: Ukončení aplikace

Po dokončení testování můžete aplikaci vypnout:

```bash
docker compose down
```

Tím se všechny kontejnery zastaví a systém se bezpečně ukončí.

---

# 📦 Technologie projektu

- **Next.js** – frontend
- **Python (FastAPI)** – backend
- **Docker & Docker Compose** – kontejnerizace
- **REST API**
