import sqlite3
import json
from typing import Optional

DB_FILE = "torrents.db"  # Přejmenováno


def init_db():
    """Vytvoří tabulku pro torrenty."""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    # Upravené sloupce pro potřeby torrentů
    c.execute('''
              CREATE TABLE IF NOT EXISTS torrents
              (
                  url
                  TEXT
                  PRIMARY
                  KEY,
                  title
                  TEXT,
                  image
                  TEXT,
                  size
                  TEXT,
                  tags
                  TEXT, -- Uložíme jako JSON string
                  download_link
                  TEXT, -- Finální odkaz na .torrent/magnet
                  source_query
                  TEXT,
                  timestamp
                  DATETIME
                  DEFAULT
                  CURRENT_TIMESTAMP
              )
              ''')
    conn.commit()
    conn.close()


class TorrentRepo:
    def __init__(self):
        init_db()

    def get_torrent(self, url: str) -> Optional[dict]:
        """Vrátí torrent z cache."""
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM torrents WHERE url = ?", (url,))
        row = c.fetchone()
        conn.close()

        if row:
            data = dict(row)
            # Pokud jsou tagy uložené jako string, převedeme zpět na list/dict
            if data.get('tags'):
                try:
                    data['tags'] = json.loads(data['tags'])
                except:
                    pass
            return data
        return None

    def save_torrent(self, data: dict, source_query: str):
        """Uloží nový torrent."""
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()

        # Serializace tagů do JSON stringu pro uložení
        tags_json = json.dumps(data.get('tags', []))

        try:
            c.execute('''
                INSERT OR REPLACE INTO torrents (url, title, image, size, tags, download_link, source_query)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                data['url'],
                data['title'],
                data['image'],
                data['size'],
                tags_json,
                data['download_link'],
                source_query
            ))
            conn.commit()
        except Exception as e:
            print(f"DB Error: {e}")
        finally:
            conn.close()