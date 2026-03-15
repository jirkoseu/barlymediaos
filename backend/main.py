import asyncio
import json
import sqlite3
import subprocess
import shutil
import os
import socket

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# --- IMPORTY INTERNÍCH SLUŽEB ---
from services.torrent_service import TorrentService
from services.download_service import TorrentManager
from services.file_service import FileManagerService
from auth import verify_password, create_access_token, init_db

# ==========================================
# 0. KONFIGURACE A INICIALIZACE
# ==========================================

ENV_PATH = "./.env"
load_dotenv(ENV_PATH)

PROJECT_NAME = os.getenv("PROJECT_NAME", "barlyMediaOS")
DEFAULT_MEDIA_PATH = "/app/media"  # Sjednocená výchozí cesta

app = FastAPI(title="barlyMediaOS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializace služeb
search_service = TorrentService()
download_manager = TorrentManager()
file_service = FileManagerService()
active_websockets = []


# ==========================================
# 1. Pydantic Modely
# ==========================================

class TorrentAddRequest(BaseModel):
    magnet: str
    title: str = None


class TorrentActionRequest(BaseModel):
    action: str  # "pause" nebo "resume"


class SettingsPayload(BaseModel):
    media_path: str
    samba_enabled: bool
    minidlna_enabled: bool


class PathUpdate(BaseModel):
    media_path: str


class ServicesUpdate(BaseModel):
    samba_enabled: bool
    minidlna_enabled: bool


class LoginRequest(BaseModel):
    username: str
    password: str


# ==========================================
# 2. POMOCNÉ FUNKCE
# ==========================================

def update_env_variable(key: str, value: str):
    """Bezpečně přepíše konkrétní řádek v .env souboru a updatuje os.environ."""
    if not os.path.exists(ENV_PATH):
        with open(ENV_PATH, "w") as f:
            f.write(f"{key}={value}\n")
    else:
        with open(ENV_PATH, "r") as f:
            lines = f.readlines()

        key_found = False
        with open(ENV_PATH, "w") as f:
            for line in lines:
                if line.startswith(f"{key}="):
                    f.write(f"{key}={value}\n")
                    key_found = True
                else:
                    f.write(line)
            if not key_found:
                f.write(f"{key}={value}\n")

    os.environ[key] = str(value)


def manage_container(container_name: str, enable: bool):
    """Pošle příkaz přímo do systémového Dockeru pro start/stop kontejneru."""
    action = "start" if enable else "stop"
    full_name = f"{PROJECT_NAME}_{container_name}"

    try:
        subprocess.run(["docker", action, full_name], check=True, capture_output=True, text=True)
        print(f"✅ Kontejner {full_name} -> {action.upper()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Chyba Dockeru ({full_name}): {e.stderr}")
        return False


def is_port_open(host: str, port: int) -> bool:
    """Ověří, zda je daný port na hostiteli otevřený."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False


# ==========================================
# 3. ZÁKLADNÍ API A AUTH
# ==========================================

@app.get("/")
async def root():
    return {"status": "online", "message": "barlyMediaOS Backend API"}


@app.post("/api/login")
async def login(data: LoginRequest):
    init_db()
    try:
        with sqlite3.connect("mediaos.db") as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT hashed_password FROM users WHERE username=?", (data.username,))
            user = cursor.fetchone()
    except sqlite3.OperationalError:
        raise HTTPException(status_code=500, detail="Database error.")

    if not user or not verify_password(data.password, user[0]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(data={"sub": data.username})
    return {"access_token": token, "token_type": "bearer"}


# ==========================================
# 4. VYHLEDÁVÁNÍ A TORRENTY
# ==========================================

@app.get("/search")
async def search(query: str):
    """Streamovací endpoint pro vyhledávání z webu."""
    return StreamingResponse(
        search_service.search_stream(query),
        media_type="application/x-ndjson"
    )


@app.post("/api/torrents")
async def add_torrent(payload: TorrentAddRequest):
    download_manager.add_torrent(payload.magnet, payload.title)
    return {"message": "Torrent added"}


@app.delete("/api/torrents/{torrent_id}")
async def delete_torrent(torrent_id: int):
    download_manager.remove_torrent(torrent_id)
    return {"message": "Torrent deleted"}


@app.post("/api/torrents/{torrent_id}/action")
async def action_torrent(torrent_id: int, payload: TorrentActionRequest):
    download_manager.pause_resume(torrent_id, payload.action)
    return {"message": f"Torrent {payload.action}d"}


# ==========================================
# 5. WEBSOCKET A BACKGROUND LOOP
# ==========================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep-alive
    except WebSocketDisconnect:
        if websocket in active_websockets:
            active_websockets.remove(websocket)
    except Exception as e:
        print(f"WS Error: {e}")
        if websocket in active_websockets:
            active_websockets.remove(websocket)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(run_torrent_loop())


async def run_torrent_loop():
    while True:
        data = download_manager.tick()
        if active_websockets:
            message = json.dumps(data)
            for ws in active_websockets[:]:
                try:
                    await ws.send_text(message)
                except Exception:
                    if ws in active_websockets:
                        active_websockets.remove(ws)
        await asyncio.sleep(1)


# ==========================================
# 6. SOUBORY A SYSTÉM
# ==========================================

@app.get("/api/files")
async def list_files(path: str = ""):
    """Procházení souborů. Pokud není zadána cesta, použije .env MEDIA_PATH nebo default."""
    # Využijeme dynamicky načtenou cestu z prostředí
    target_path = path if path else os.getenv("MEDIA_PATH", DEFAULT_MEDIA_PATH)

    if not os.path.exists(target_path):
        try:
            os.makedirs(target_path, exist_ok=True)
        except Exception:
            return {"error": "Path not found and could not be created"}

    return file_service.get_files(target_path)


@app.get("/api/system/stats")
async def get_system_stats():
    """Vrací obsazenost disku na základě hlavní složky s médii."""
    target_path = os.getenv("MEDIA_PATH", DEFAULT_MEDIA_PATH)
    try:
        total, used, free = shutil.disk_usage(target_path)
        gb = 2 ** 30
        return {
            "total_gb": round(total / gb, 1),
            "used_gb": round(used / gb, 1),
            "free_gb": round(free / gb, 1),
            "percent_used": round((used / total) * 100, 1)
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/system/services")
async def get_services_status():
    """Zjišťuje, zda služby běží (kontrolou portů)."""
    minidlna_alive = is_port_open("minidlna", 8200) or is_port_open("172.17.0.1", 8200)
    return {
        "transmission": "online" if is_port_open("transmission", 9091) else "offline",
        "samba": "online" if is_port_open("samba", 445) else "offline",
        "minidlna": "online" if minidlna_alive else "offline"
    }


# ==========================================
# 7. NASTAVENÍ (Settings)
# ==========================================

@app.get("/api/settings")
async def get_settings():
    return {
        "media_path": os.getenv("MEDIA_PATH", DEFAULT_MEDIA_PATH),
        "samba_enabled": os.getenv("SAMBA_ENABLED", "true").lower() == "true",
        "minidlna_enabled": os.getenv("MINIDLNA_ENABLED", "true").lower() == "true"
    }


@app.post("/api/settings/path")
async def save_path(payload: PathUpdate):
    print(f"📂 Změna cesty k médiím: {payload.media_path}")
    update_env_variable("MEDIA_PATH", payload.media_path)
    return {"status": "success", "media_path": payload.media_path}


@app.post("/api/settings/services")
async def save_services(payload: ServicesUpdate):
    print(f"⚙️ Změna služeb: Samba={payload.samba_enabled}, DLNA={payload.minidlna_enabled}")

    update_env_variable("SAMBA_ENABLED", str(payload.samba_enabled).lower())
    update_env_variable("MINIDLNA_ENABLED", str(payload.minidlna_enabled).lower())

    samba_ok = manage_container("samba", payload.samba_enabled)
    dlna_ok = manage_container("minidlna", payload.minidlna_enabled)

    if not samba_ok or not dlna_ok:
        return {"status": "partial_success", "message": "Některé kontejnery neodpověděly."}

    return {"status": "success", "message": "Služby úspěšně restartovány."}


# ==========================================
# RUN
# ==========================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)