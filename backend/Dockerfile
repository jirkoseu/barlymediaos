# Použijeme tvůj Python 3.12 (slim verze pro menší velikost)
FROM python:3.12-slim

# Místo bojování s apt-get si rovnou zkopírujeme hotové binárky přímo od Dockeru
COPY --from=docker:cli /usr/local/bin/docker /usr/local/bin/
COPY --from=docker/compose-bin:latest /docker-compose /usr/libexec/docker/cli-plugins/docker-compose
RUN chmod +x /usr/libexec/docker/cli-plugins/docker-compose

WORKDIR /app

# Zkopírujeme seznam závislostí
COPY requirements.txt .

# 1. Nainstalujeme základ + Uvicorn + Playwright
RUN pip install --no-cache-dir -r requirements.txt fastapi "uvicorn[standard]" playwright

# 2. KRITICKÝ KROK: Stažení čistě jen prohlížeče Chromium a jeho linuxových závislostí
RUN playwright install --with-deps chromium

# Zkopírujeme zbytek kódu
COPY . .

# Spuštění serveru přes python modul (bezpečnější metoda)
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]