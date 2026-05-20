# ViajeNYC.com

Guía de viaje a Nueva York en español. Sitio estático construido para GitHub Pages.

---

## Deploy en GitHub Pages

1. Sube el repositorio a GitHub.
2. Ve a **Settings → Pages**.
3. En "Source", selecciona la rama `main` y la carpeta `/ (root)`.
4. El archivo `CNAME` ya contiene `viajenyc.com`. Apunta tu dominio a GitHub Pages en tu proveedor DNS:
   - Tipo A: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - O un CNAME apuntando a `<tu-usuario>.github.io`
5. Activa HTTPS en la configuración de Pages.

El sitio no requiere build steps, npm, ni servidor. GitHub Pages sirve los archivos directamente.

---

## Desarrollo local

Abre un servidor local desde la raíz del proyecto (necesario para que los `fetch()` de Shorts funcionen):

```bash
# Python 3
python3 -m http.server 8080

# Node.js
npx serve .

# VS Code
# Usa la extensión "Live Server"
```

Luego abre `http://localhost:8080` en tu navegador.

**Nota:** Abrir `index.html` directamente como `file://` funciona para la mayoría del sitio, pero los módulos de Shorts (que hacen `fetch()` a `/data/shorts/*.json`) requieren un servidor HTTP.

---

## Estructura del proyecto

```
viajenyc/
├── index.html                          # Homepage
├── 404.html                            # Página de error 404
├── sitemap.xml
├── robots.txt
├── CNAME
│
├── assets/
│   ├── css/styles.css                  # Sistema de diseño completo
│   └── js/main.js                      # Nav, FAQ, cargador de Shorts
│
├── data/
│   └── shorts/
│       ├── registry.json               # Índice de feeds de Shorts
│       └── *.json                      # Feeds por tema (vacíos hasta poblar)
│
├── guia/primera-vez-en-nueva-york/
├── itinerarios/{3,5,7}-dias/
├── barrios/{manhattan,brooklyn,queens,mejores-barrios}/
├── atracciones/{central-park,times-square,...}/
├── experiencias/{broadway,miradores,mercados}/
├── comida/{donde-comer,comer-barato}/
├── viajes/{pareja,ninos,solo}/
├── temporadas/{navidad,verano,primavera,otono}/
├── guias/{alojarse,gratis,presupuesto,errores,metro,aeropuertos,seguridad}/
├── sobre-viajenyc/
└── contacto/
```

---

## Módulo de YouTube Shorts — Cómo poblar los feeds

El módulo de Shorts es **puramente front-end**. Lee archivos JSON estáticos desde `/data/shorts/`.  
No hay scraper, API de YouTube, ni herramienta de descarga. Los feeds se alimentan manualmente.

### Estructura de cada feed (`/data/shorts/*.json`)

```json
{
  "topic": "central-park",
  "title": "Central Park",
  "description": "Descripción opcional del feed.",
  "items": [
    {
      "id": "VIDEO_ID_DE_YOUTUBE",
      "title": "Título del video en español o inglés",
      "thumbnail": "https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg",
      "channel": "Nombre del Canal",
      "channel_url": "https://www.youtube.com/@canal",
      "duration_seconds": 45,
      "published_at": "2024-11-15",
      "description": "Descripción breve del video.",
      "tags": ["nueva-york", "central-park", "viaje"]
    }
  ]
}
```

**Campos requeridos:** `id`, `title`  
**Campos opcionales:** `thumbnail`, `channel`, `channel_url`, `duration_seconds`, `published_at`, `description`, `tags`

### Comportamiento del módulo

| Estado del feed | Comportamiento en pantalla |
|-----------------|---------------------------|
| `items` con contenido | Muestra tira horizontal de cards de Shorts |
| `items: []` (vacío) | Muestra estado "Próximamente" con texto elegante |
| Archivo no encontrado / error de red | El módulo se elimina del DOM silenciosamente |

### Páginas con módulo de Shorts activo

Las siguientes páginas incluyen el módulo de Shorts (se activa automáticamente cuando se pobla el feed):

- `/guia/primera-vez-en-nueva-york/` → `primera-vez-nyc.json`
- `/atracciones/central-park/` → `central-park.json`
- `/atracciones/times-square/` → `times-square.json`
- `/atracciones/estatua-de-la-libertad/` → `estatua-libertad.json`
- `/atracciones/puente-de-brooklyn/` → `puente-brooklyn.json`
- `/experiencias/broadway-en-nueva-york/` → `broadway-nyc.json`
- `/experiencias/mejores-miradores-nueva-york/` → `miradores-nyc.json`
- `/guias/como-usar-el-metro-de-nueva-york/` → `metro-nyc.json`

### Páginas en registry pero sin módulo UI (preparadas para el futuro)

- `/itinerarios/nueva-york-en-3-dias/` → `itinerario-3-dias.json`
- `/itinerarios/nueva-york-en-5-dias/` → `itinerario-5-dias.json`
- `/temporadas/navidad-en-nueva-york/` → `navidad-nyc.json`
- `/comida/comer-barato-en-nueva-york/` → `comer-barato.json`
- `/viajes/nueva-york-en-pareja/` → `nyc-pareja.json`
- `/viajes/nueva-york-con-ninos/` → `nyc-ninos.json`
- `/temporadas/verano-en-nueva-york/` → `verano-nyc.json`

---

## Diseño y templates

El sitio usa 7 templates HTML con un sistema de diseño compartido (CSS variables en `assets/css/styles.css`):

| Template | Páginas |
|----------|---------|
| Homepage | `index.html` |
| Pillar guide | Primera vez, museos, alojarse, presupuesto |
| Itinerary | 3, 5, 7 días |
| Neighborhood | Manhattan, Brooklyn, Queens, mejores barrios |
| Attraction | Central Park, Times Square, Estatua, Puente, Miradores |
| Experience | Broadway, comida, pareja, niños, solo, temporadas |
| Utility | Metro, aeropuertos, errores, gratis, seguridad |

---

## Aviso legal

Los precios, horarios y políticas de entrada en este sitio son orientativos y pueden cambiar.  
Siempre verifica la información con las fuentes oficiales antes de planificar tu viaje.
