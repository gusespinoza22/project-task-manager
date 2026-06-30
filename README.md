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

- El estado vivo se guarda automáticamente en **localStorage** mientras trabajas.
- El botón **"Guardar cambios"** (barra lateral) escribe el estado completo en
  **`data.json`** en la raíz del proyecto, mediante un endpoint del servidor de
  Vite (`POST /api/save`). Ese archivo es la fuente de verdad persistente.
- Al cargar: primero `localStorage`; si está vacío, se lee `data.json`; si
  tampoco existe, se usan los datos semilla (`src/seed.ts`).
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
data.json               estado persistido (escrito por "Guardar cambios")
```
