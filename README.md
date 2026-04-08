# 🎥 Origin Core IPTV

Servidor **Origin** para sistema IPTV distribuido.

Este servicio se encarga de:

* Obtener canales desde la base central
* Resolver automáticamente la mejor calidad del stream (HLS)
* Generar HLS local con FFmpeg
* Servir streams a clientes o nodos Edge
* Administrar canales activos en tiempo real
* Exponer panel técnico local

---

# 🧠 Arquitectura

```text
[ Backend IPTV ] (Mongo + API)
        ↓
[ Origin ]  ← (este proyecto)
        ↓
   HLS local (/hls)
        ↓
[ Edge (futuro) ]
        ↓
[ Clientes (App / VLC / Web) ]
```

---

# ⚙️ Requisitos

## 1. Node.js

* Recomendado: **v18 o superior**

```bash
node -v
```

---

## 2. FFmpeg

### Windows

```powershell
winget install --id Gyan.FFmpeg -e
```

Verificar:

```powershell
ffmpeg -version
```

---

## 3. MongoDB

Debe existir una base con los canales.

Ejemplo:

```env
MONGO_URI=mongodb://10.254.1.10:27017/nombre_db
```

---

# 📦 Instalación

```bash
git clone <repo-url>
cd origin-core-iptv
npm install
```

---

# 🔐 Configuración

Crear archivo `.env`:

```env
PORT=4001

NODE_KEY=origin-central
NODE_TYPE=origin
NODE_NAME=Origin Central

PUBLIC_BASE_URL=http://192.168.10.27:4001

MONGO_URI=mongodb://10.254.1.10:27017/nombre_db

HLS_ROOT=./storage/hls

FFMPEG_PATH=ffmpeg

CHANNEL_IDLE_TIMEOUT_MS=0
```

---

# 🚀 Ejecución

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm run build
npm start
```

---

# 📡 Endpoints

## 🔍 Health

```http
GET /health
```

---

## ▶️ Stream

```http
GET /stream/:channelId
```

### Flujo:

* busca canal en Mongo
* resuelve mejor calidad HLS
* inicia FFmpeg
* genera HLS
* redirige a:

```http
/hls/:channelId/index.m3u8
```

---

## 📺 HLS

```http
GET /hls/:channelId/index.m3u8
```

---

## 📊 Canales activos

```http
GET /channels/active
```

---

## 🔎 Estado de canal

```http
GET /channels/:channelId/status
```

---

## 🛑 Detener canal

```http
POST /channels/:channelId/stop
```

---

## 🖥️ Panel técnico

```http
GET /panel
```

👉 Panel web local sin dependencias externas
👉 Permite:

* ver estado del servidor
* ver canales activos
* detener canales
* auto-refresh

---

# 🧠 Lógica de funcionamiento

## 🔁 Flujo de streaming

1. Cliente pide `/stream/:id`
2. Origin consulta Mongo
3. Resuelve mejor variante HLS
4. Inicia FFmpeg (si no existe)
5. Genera HLS local
6. Redirige al playlist

---

## ♻️ Reutilización de canales

Si un canal ya está activo:

* no se reinicia FFmpeg
* se reutiliza el proceso existente

---

## 🧹 Auto cierre de canales

Controlado por:

```env
CHANNEL_IDLE_TIMEOUT_MS
```

### Opciones:

| Valor | Comportamiento    |
| ----- | ----------------- |
| 0     | desactivado       |
| >0    | cierre automático |

Ejemplo:

```env
CHANNEL_IDLE_TIMEOUT_MS=1800000
```

(30 minutos)

---

## 🎯 Selección de calidad

El Origin:

* detecta si la URL es master playlist
* analiza variantes HLS
* selecciona la de mayor bitrate

---

# 📂 Estructura de carpetas

```text
src/
  controllers/
  services/
  routes/
  models/
  config/
  lib/

storage/
  hls/
```

---

# ⚠️ Importante

## ❌ No subir a Git

```txt
node_modules/
.env
storage/hls/
dist/
```

---

# 📈 Estado actual

✔ Streaming HLS funcionando
✔ Resolución automática de calidad
✔ FFmpeg estable
✔ Reutilización de procesos
✔ Panel técnico funcional
✔ Control manual de canales
✔ Preparado para Edge

---

# 🚀 Próximos pasos

* Edge IPTV (caché local)
* balanceo de carga
* viewers en tiempo real
* panel avanzado
* dockerización

---

# 👨‍💻 Autor

Desarrollado por Diego 🚀
