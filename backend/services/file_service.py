import os
import datetime
import math


class FileManagerService:
    def get_files(self, path: str):
        """
        Vrátí seznam souborů a složek v dané cestě.
        """
        # Pokud cesta neexistuje, vrátíme se do domovského adresáře
        if not os.path.exists(path):
            path = os.path.expanduser("~")

        items = []

        try:
            # Projdeme adresář
            with os.scandir(path) as entries:
                for entry in entries:
                    try:
                        # Získání metadat
                        stats = entry.stat()
                        size = self._convert_size(stats.st_size) if entry.is_file() else "-"
                        mod_time = datetime.datetime.fromtimestamp(stats.st_mtime).strftime('%Y-%m-%d %H:%M')

                        # Určení typu ikony a textu
                        icon_type = "file"
                        file_type = "File"

                        if entry.is_dir():
                            icon_type = "folder"
                            file_type = "File folder"
                        else:
                            ext = entry.name.split('.')[-1].lower() if '.' in entry.name else ""
                            if ext in ['jpg', 'png', 'gif', 'jpeg']:
                                icon_type = "image"; file_type = "Image"
                            elif ext in ['mp4', 'mkv', 'avi', 'mov']:
                                icon_type = "video"; file_type = "Video"
                            elif ext in ['mp3', 'wav', 'flac']:
                                icon_type = "audio"; file_type = "Audio"
                            elif ext == 'pdf':
                                icon_type = "pdf"; file_type = "PDF Document"
                            elif ext in ['doc', 'docx']:
                                icon_type = "word"; file_type = "Word Document"
                            elif ext in ['zip', 'rar', '7z', 'tar']:
                                icon_type = "zip"; file_type = "Archive"
                            elif ext == 'exe':
                                icon_type = "exe"; file_type = "Application"
                            elif ext == 'txt':
                                icon_type = "txt"; file_type = "Text Document"

                        items.append({
                            "id": entry.path,  # Použijeme plnou cestu jako ID
                            "name": entry.name,
                            "path": entry.path,
                            "date": mod_time,
                            "type": file_type,
                            "size": size,
                            "iconType": icon_type,
                            "isDir": entry.is_dir()
                        })
                    except PermissionError:
                        continue  # Přeskočíme soubory, kam nemáme přístup
        except PermissionError:
            return {"error": "Access Denied", "path": path, "files": []}

        # Seřadíme: Složky první, pak soubory
        items.sort(key=lambda x: (not x['isDir'], x['name'].lower()))

        return {
            "path": path,
            "parent": os.path.dirname(path),
            "files": items
        }

    def _convert_size(self, size_bytes):
        if size_bytes == 0: return "0 B"
        size_name = ("B", "KB", "MB", "GB", "TB")
        i = int(math.floor(math.log(size_bytes, 1024)))
        p = math.pow(1024, i)
        s = round(size_bytes / p, 2)
        return "%s %s" % (s, size_name[i])