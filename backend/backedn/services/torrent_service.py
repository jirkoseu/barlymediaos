import json
import asyncio
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import re
from unidecode import unidecode
from database import TorrentRepo

# --- ZDE JSOU TVOJE REGEXY A POMOCNÉ FUNKCE (z scrape.zip) ---
TAG_REGEX = re.compile(r'\[([^\]]+)\]|\(([^)]+)\)')
CSFD_REGEX = re.compile(r'\s*=\s*CSFD\s*\d*%$')


def categorize_tag(tag: str) -> str:
    tag_lower = tag.lower()
    if re.search(r'\d{3,4}p', tag_lower): return 'quality'
    quality_keywords = ['4k', 'hdr', 'dv', 'remux', 'web', 'rip', 'bluray', 'bdrip', 'hdtv', 'brrip', 'uhd']
    if any(key in tag_lower for key in quality_keywords): return 'quality'
    if re.match(r'^\d{4}', tag): return 'year'
    lang_keywords = ['cz', 'en', 'sk', 'de', 'fr', 'dabing', 'titulky', 'sub']
    if any(key in tag_lower for key in lang_keywords): return 'language'
    return 'other'


def parse_movie_title(raw_name: str):
    found_tags = TAG_REGEX.findall(raw_name)
    raw_tags = [tag1 or tag2 for tag1, tag2 in found_tags]
    cleaned_name = TAG_REGEX.sub('', raw_name)
    cleaned_name = CSFD_REGEX.sub('', cleaned_name)
    cleaned_name = " ".join(cleaned_name.split()).strip()
    categorized_tags = []
    for tag in raw_tags:
        categorized_tags.append({'type': categorize_tag(tag), 'value': tag})
    return cleaned_name, categorized_tags


# --- HLAVNÍ TŘÍDA (Hybrid Scrape & Crawler) ---

class TorrentService:
    def __init__(self):
        self.db = TorrentRepo()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    def _scrape_list(self, search_query: str):
        """
        Synchronní funkce pro získání seznamu (původní scrape_sktorrent).
        Vrací seznam kandidátů (bez finálního linku).
        """
        normalized_query = unidecode(search_query)
        url = f"https://sktorrent.eu/torrent/torrents_v2.php?search={normalized_query.replace(' ', '+')}"

        candidates = []
        try:
            resp = requests.get(url, headers=self.headers, timeout=10)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, 'lxml')
            items = soup.find_all('td', class_='lista', valign='top', width='33%')

            for item in items:
                link_tag = item.find('a', href=lambda href: href and 'details.php' in href)
                image_tag = item.find('img', class_='lozad')

                if not link_tag or not image_tag: continue

                raw_name = link_tag.contents[-1].strip()
                relative_url = link_tag.get('href')
                full_url = urljoin(url, relative_url)  # Důležité pro DB ID

                image_url = image_tag.get('data-src') or image_tag.get('src')

                # Velikost
                parent_div = link_tag.find_parent('div')
                size = "N/A"
                if parent_div:
                    for line in parent_div.text.splitlines():
                        if line.strip().startswith('Velkost'):
                            size = line.strip().split('|')[0].replace('Velkost', '').strip()
                            break

                clean_name, tags = parse_movie_title(raw_name)

                if clean_name:
                    candidates.append({
                        'title': clean_name,
                        'url': full_url,  # URL je unikátní klíč
                        'image': image_url,
                        'size': size,
                        'tags': tags
                    })
        except Exception as e:
            print(f"Chyba při scrapování seznamu: {e}")
            return []

        return candidates

    def _scrape_details(self, details_url: str):
        """Získá finální download link z detailu."""
        try:
            resp = requests.get(details_url, headers=self.headers, timeout=10)
            soup = BeautifulSoup(resp.text, 'lxml')
            download_tag = soup.find('a', href=lambda href: href and 'download.php' in href)

            if download_tag:
                return urljoin(details_url, download_tag.get('href'))
        except Exception as e:
            print(f"Chyba detailu: {e}")
        return None

    # --- ASYNC GENERÁTOR PRO API ---
    async def search_stream(self, query: str):
        """
        Generator, který posílá data frontend-u v reálném čase (NDJSON).
        """
        yield json.dumps({"type": "info", "msg": f"Hledám: {query}, na sktorrent.eu"}) + "\n"

        # 1. Získání kandidátů (běží v threadu, aby neblokoval event loop)
        loop = asyncio.get_event_loop()
        candidates = await loop.run_in_executor(None, self._scrape_list, query)

        if not candidates:
            yield json.dumps({"type": "end", "msg": "Žádné výsledky."}) + "\n"
            return

        yield json.dumps({"type": "info", "msg": f"Nalezeno {len(candidates)} položek. Zpracovávám..."}) + "\n"

        # 2. Iterace přes výsledky
        for cand in candidates:

            # A) KONTROLA CACHE
            cached = self.db.get_torrent(cand['url'])

            if cached and cached.get('download_link'):
                # Máme v DB i s linkem -> posíláme hned
                yield json.dumps({"type": "result", "data": cached}) + "\n"
                await asyncio.sleep(0.01)  # Krátká pauza pro UI
                continue

            # B) NENÍ V CACHE -> STÁHNOUT DETAIL
            yield json.dumps({"type": "processing", "title": f"Zpracovávám: {cand['title']}"}) + "\n"

            # Scrapujeme detail (opět v threadu, protože requests blokuje)
            final_link = await loop.run_in_executor(None, self._scrape_details, cand['url'])

            if final_link:
                cand['download_link'] = final_link

                # Uložíme do DB pro příště
                self.db.save_torrent(cand, query)

                yield json.dumps({"type": "result", "data": cand}) + "\n"
            else:
                # I když nenajdeme link, můžeme vrátit alespoň info o torrentu?
                # Zatím přeskočíme
                pass

        yield json.dumps({"type": "done"}) + "\n"