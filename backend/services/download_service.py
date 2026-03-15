import requests
from transmission_rpc import Client


class TorrentManager:
    def __init__(self):
        # --- NASTAVENÍ TRANSMISSION ---
        # Pro Mac (pokud běží daemon) obvykle 127.0.0.1
        self.host = 'transmission'
        self.port = 9091
        # Pokud máš vypnutou autentizaci v settings.json, nech None
        self.username = 'admin'
        self.password = 'barly123'

        self.client = None

        # --- COOKIES ---
        self.cookie_string = "uid=753897; pass=28058f259d407b66934f18ec5284f101"

        # Hlavičky, aby si server myslel, že jsme prohlížeč
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Cookie': self.cookie_string
        }

        # Prvotní připojení
        self._connect()

    def _connect(self):
        """Bezpečné připojení k Transmission RPC s totálním debugem."""
        try:
            # Tady si vypíšeme, s čím se to reálně snaží spojit
            self.client = Client(
                host=self.host,
                port=self.port,
                username=self.username,
                password=self.password,
                timeout=10
            )

            session = self.client.get_session()
            print(f"✅SPOJENÍ OK! Verze Transmission: {session.version}")
            return True

        except Exception as e:
            # TADY se dozvíme pravdu
            print(f"Transmission nás vyhodil. Důvod: {type(e).__name__}: {e}")
            self.client = None
            return False

    def add_torrent(self, url: str, title: str = None):
        """Stáhne .torrent soubor s použitím cookies a přidá ho."""
        if not self.client and not self._connect():
            print("❌ Transmission neběží, nelze přidat torrent.")
            return

        try:
            # 1. Magnet linky jdou rovnou
            if url.startswith('magnet:'):
                self.client.add_torrent(url)
                print(f"🧲 Magnet link přidán: {title}")
                return


            print(f"📥 Stahuji .torrent z URL: {url}")

            # 2. Request s tvými cookies
            r = requests.get(url, headers=self.headers, allow_redirects=True, timeout=15)

            # 3. Validace
            if r.status_code == 200:
                # Kontrola, jestli to začíná 'd' (bencoded data) nebo obsahuje 'announce'
                if r.content.strip().startswith(b'd') or b'announce' in r.content:
                    self.client.add_torrent(r.content)
                    print(f"🚀 Torrent '{title}' úspěšně přidán!")
                else:
                    # Pokud jsme i po opravě URL dostali HTML, je problém v Cookies
                    print("⚠️ Stažený soubor stále není torrent. Zkontroluj COOKIES.")
                    print(f"Začátek obsahu: {r.content[:100]}")
            else:
                print(f"❌ Chyba stahování: Status {r.status_code}")

        except Exception as e:
            print(f"❌ Chyba v add_torrent: {e}")

    def tick(self):
        """Vrací data pro WebSocket (voláno každou sekundu z main.py)."""
        if not self.client:
            if not self._connect():
                return []  # Transmission offline

        try:
            torrents = self.client.get_torrents()
            data = []

            for t in torrents:
                # Sjednocení statusů pro frontend
                status = str(t.status)
                if status == "downloading":
                    display_status = "Downloading"
                elif status == "seeding":
                    display_status = "Completed"
                elif status == "stopped":
                    display_status = "Paused"
                else:
                    display_status = status.capitalize()

                data.append({
                    "id": t.id,
                    "title": t.name,
                    "progress": round(t.progress, 1),
                    # Přepočet na MB/s
                    "downloadSpeed": f"{round(t.rate_download / 1048576, 2)} MB/s",
                    "uploadSpeed": f"{round(t.rate_upload / 1048576, 2)} MB/s",
                    "status": display_status,
                    "size": f"{round(t.total_size / 1073741824, 2)} GB"
                })
            return data
        except Exception:
            self.client = None
            return []

    def remove_torrent(self, t_id: int):
        if self.client:
            self.client.remove_torrent(t_id, delete_data=False)
            print(f"🗑️ Torrent {t_id} smazán i s daty.")

    def pause_resume(self, t_id: int, action: str):
        if not self.client: return
        if action == "pause":
            self.client.stop_torrent(t_id)
        else:
            self.client.start_torrent(t_id)