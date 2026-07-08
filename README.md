# Gestor de proyectos y tareas

Implementación en **React + Vite + TypeScript** del prototipo de Claude Design
(`gestor-de-proyectos-y-tareas/project/Gestor.dc.html`). Un gestor personal de
proyectos y tareas con 6 vistas y un modelo de prioridades estilo Eisenhower.

## Vistas

1. **Pizarra de silos** — vaciado mental libre; tarjetas arrastrables agrupadas por proyecto.
2. **Cartera de proyectos** — frentes ordenables por prioridad (drag & drop), con filtros y métricas.
3. **Detalle de proyecto** — info editable + lista de tareas, con resumen lateral.
4. **Prioridades (Eisenhower)** — matriz de 4 cuadrantes; reclasifica y reordena arrastrando.
5. **Lo primero, mañana** — ritual nocturno para ordenar qué atacar primero.
6. **Capturar** — formularios de nueva tarea / nuevo proyecto.

## Comandos

```bash
npm install      # instalar dependencias (una vez)
npm run dev      # servidor de desarrollo  → http://localhost:5173
npm run build    # type-check + build de producción en dist/
npm run preview  # previsualizar el build
```

## Persistencia

- **`data.json`** en la raíz del proyecto es la única fuente de verdad. Contiene
  datos reales del usuario, **no se sube a git** (este repo es público) y está
  en `.gitignore`.
- **`data.example.json`** sí está versionado: es una plantilla con datos de
  ejemplo. La primera vez que corres `npm run dev` en un clon nuevo, el
  servidor de Vite copia automáticamente `data.example.json` → `data.json` si
  este último no existe todavía.
- Al cargar la app, siempre se pide `data.json` fresco al servidor (nunca se
  confía en `localStorage` para decidir qué mostrar). `localStorage` solo se
  usa como respaldo si el archivo no se puede leer.
- El botón **"Guardar cambios"** (barra lateral) es lo único que escribe en
  `data.json`, vía `POST /api/save`. No hay autoguardado silencioso a disco.
  Antes de cada escritura se guarda una copia del archivo anterior en
  `.data-backups/` (gitignored) como red de seguridad.
- Si el servidor no está disponible (p. ej. un build estático servido sin Vite),
  "Guardar cambios" descarga `data.json` para colocarlo manualmente.

> **Migración futura:** la capa de persistencia está aislada en `src/store.tsx`
> (carga inicial + `save()`), lista para cambiarse a Supabase u otra BD.

## Estructura

```
src/
  main.tsx              punto de entrada
  App.tsx               shell: sidebar + main + alertas + toast
  store.tsx             estado central, persistencia y formularios
  logic.ts              helpers puros (cuadrantes, estancamiento, estilos)
  constants.ts          paleta, metadatos de cuadrantes, umbrales
  seed.ts               datos semilla del prototipo
  types.ts              tipos del dominio
  useIsMobile.ts        breakpoint 820px
  components/           Sidebar, Alerts, Toast, SaveButton
  views/                Whiteboard, Portfolio, ProjectDetail, Eisenhower,
                        FirstThing, Capture
data.example.json       plantilla de ejemplo (versionada en git)
data.json               estado real del usuario (gitignored, no se sube)
```
