# origin-core-iptv
# 🎥 Origin Core IPTV

Servidor **Origin** para sistema IPTV distribuido.

Este servicio se encarga de:

* Resolver canales desde la base central
* Seleccionar la mejor calidad del stream (HLS)
* Generar HLS local mediante FFmpeg
* Servir streams a clientes o nodos Edge

---

# 🧠 Arquitectura

```text
[ Backend Central ] (10.254.1.10)
        ↓
   MongoDB (canales + usuarios)
        ↓
[ Origin ] (10.254.1.11)
        ↓
   HLS local (/hls)
        ↓
[ Edge (futuro) ] → Clientes (App / VLC / Web)
```

---

# ⚙️ Requisitos

## 1. Node.js

* Recomendado: **v18+**

Verificar:

```bash
node -v
```

---

## 2. FFmpeg

### Windows (recomendado)

```powershell
winget install --id Gyan.FFmpeg -e
```

Verificar:

```powershell
ffmpeg -version
```

---

## 3. MongoDB

Debe existir una base accesible desde el Origin con los canales cargados.

Ejemplo:

```env
MONGO_URI=mongodb://10.254.1.10:27017/nombre_db
```

---

# 📦 Instalación

Clonar repo:

```bash
git clone <repo-url>
cd origin-core-iptv
```

Instalar dependencias:

```bash
npm install
```

---

# 🔐 Configuración

Crear archivo `.env` en la raíz:

```env
# Puerto del servicio
PORT=4001

# Identidad del nodo
NODE_KEY=origin-central
NODE_TYPE=origin
NODE_NAME=Origin Central

# URL pública del origin
PUBLIC_BASE_URL=http://192.168.10.27:4001

# Base de datos (backend central)
MONGO_URI=mongodb://10.254.1.10:27017/nombre_db

# Ruta HLS local
HLS_ROOT=./storage/hls

# Ruta FFmpeg (Windows usar ruta completa si falla)
FFMPEG_PATH=ffmpeg

# Timeout canales
CHANNEL_IDLE_TIMEOUT_MS=120000
```

---

# 🚀 Ejecución

Modo desarrollo:

```bash
npm run dev
```

Modo producción:

```bash
npm run build
npm start
```

---

# 🔍 Endpoints

## Health check

```http
GET /health
```

Respuesta:

```json
{
  "ok": true,
  "service": "origin"
}
```

---

## Reproducir canal

```http
GET /stream/:channelId
```

Ejemplo:

```http
GET /stream/69d1063821d24bf44cb9b8a3
```

### Flujo:

1. Busca canal en Mongo
2. Resuelve mejor calidad del HLS
3. Inicia FFmpeg si no está activo
4. Redirige a:

```http
/hls/:channelId/index.m3u8
```

---

# 📺 Salida HLS

Los streams se generan en:

```bash
storage/hls/<channelId>/
```

Ejemplo:

```bash
storage/hls/69d1063821d24bf44cb9b8a3/index.m3u8
```

Acceso público:

```http
http://IP:PORT/hls/<channelId>/index.m3u8
```

---

# ⚠️ Consideraciones importantes

## 🔴 node_modules

No se sube al repo.

## 🔴 .env

No se sube al repo (datos sensibles).

## 🔴 storage/hls

No se versiona:

* archivos temporales
* alto consumo de espacio

---

# 📈 Estado actual

✔ Resolución de canales desde Mongo
✔ Selección automática de mejor calidad HLS
✔ Generación HLS con FFmpeg
✔ Reutilización de procesos activos
✔ Servidor funcional

---

# 🚀 Próximas mejoras

* Timeout automático de canales
* Conteo de viewers
* Panel técnico local
* Integración con nodos Edge
* Balanceo de carga
* Dockerización

---

# 🧠 Notas técnicas

* FFmpeg trabaja en modo **copy** (sin transcodificar)
* El Origin actúa como **relay inteligente**
* La selección de calidad se realiza antes del procesamiento

---

# 👨‍💻 Autor

Proyecto desarrollado por Diego 🚀
