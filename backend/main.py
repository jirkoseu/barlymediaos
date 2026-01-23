import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- IMPORTY SLUŽEB ---
# Ujisti se, že máš složku 'services' a v ní soubory 'torrent_service.py' a 'download_service.py'
from services.torrent_service import TorrentService
from services.download_service import TorrentManager
from services.file_service import FileManagerService

app = FastAPI()

# Konfigurace CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INICIALIZACE ---
search_service = TorrentService()  # Scraper
download_manager = TorrentManager()  # Downloader (Simulátor/Transmission)
file_service = FileManagerService()
active_websockets = []  # Seznam připojených klientů


# --- MODELY PRO API ---
class TorrentAddRequest(BaseModel):
    magnet: str
    title: str = None


class TorrentActionRequest(BaseModel):
    action: str  # "pause" nebo "resume"


# ==========================================
# 1. ČÁST: VYHLEDÁVÁNÍ (Search)
# ==========================================

@app.get("/")
async def root():
    return {"message": "Torrent Server is running 🚀"}


@app.get("/search")
async def search(query: str):
    """Streamovací endpoint pro vyhledávání."""
    return StreamingResponse(
        search_service.search_stream(query),
        media_type="application/x-ndjson"
    )


# ==========================================
# 2. ČÁST: API PRO STAHOVÁNÍ
# ==========================================

@app.post("/api/torrents")
async def add_torrent(payload: TorrentAddRequest):
    download_manager.add_torrent(payload.magnet, payload.title)
    return {"message": "Torrent added"}


@app.delete("/api/torrents/{torrent_id}")
async def delete_torrent(torrent_id: int):
    download_manager.remove_torrent(torrent_id)
    return {"message": "Deleted"}


@app.post("/api/torrents/{torrent_id}/action")
async def action_torrent(torrent_id: int, payload: TorrentActionRequest):
    download_manager.pause_resume(torrent_id, payload.action)
    return {"message": "Updated"}


# ==========================================
# 3. ČÁST: WEBSOCKETS (Tohle ti chybělo!)
# ==========================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    try:
        while True:
            # Udržujeme spojení naživu (ping/pong), data jen posíláme, nečteme
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in active_websockets:
            active_websockets.remove(websocket)
    except Exception as e:
        print(f"WS Error: {e}")
        if websocket in active_websockets:
            active_websockets.remove(websocket)


# ==========================================
# 4. ČÁST: POZADÍ (Loop)
# ==========================================

@app.on_event("startup")
async def startup_event():
    """Spustí smyčku na pozadí při startu serveru."""
    asyncio.create_task(run_torrent_loop())


async def run_torrent_loop():
    while True:
        # 1. Posuneme simulaci/načteme data
        data = download_manager.tick()

        # 2. Pošleme data všem připojeným klientům
        if active_websockets:
            message = json.dumps(data)
            # Iterujeme přes kopii, abychom mohli mazat
            for ws in active_websockets[:]:
                try:
                    await ws.send_text(message)
                except:
                    if ws in active_websockets:
                        active_websockets.remove(ws)

        # 3. Počkáme 1 sekundu
        await asyncio.sleep(1)


# --- FILE MANAGER ENDPOINT ---
@app.get("/api/files")
async def list_files(path: str = ""):
    """
    Vrátí obsah složky. Pokud path není zadána, použije domovský adresář.
    """
    # Pokud je path prázdná, pošleme tam home dir
    if not path:
        import os
        path = os.path.expanduser("~")

    return file_service.get_files(path)


# Spuštění pro debug (pokud pouštíš 'python main.py')
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)