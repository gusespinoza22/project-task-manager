# Gestor de proyectos y tareas — gratis, open source, sin cuenta ni servidor

Aplicación web **gratuita y de código abierto** para gestionar proyectos y
tareas personales o de equipo, con **matriz de Eisenhower**, pizarra tipo
Kanban, cronología de trabajo completado y persistencia 100% local en tu
propia máquina (no hay servidor externo, no hay cuenta que crear, no hay
suscripción). Ideal si buscas una alternativa ligera y autohospedada a Trello,
Notion o Todoist para organizar prioridades con el método
**"urgente vs. importante"**.

Hecho en **React + Vite + TypeScript**, listo para clonar y correr en minutos.

## ¿Por qué este proyecto?

- **Gratis y sin límites**: sin planes de pago, sin límite de tareas, sin anuncios.
- **Tus datos son tuyos**: todo se guarda en un archivo `data.json` en tu propio
  disco. Nada se envía a un servidor de terceros.
- **Sin cuenta, sin login**: clonas, corres `npm run dev` y ya estás trabajando.
- **Código abierto**: puedes leer, modificar y extender cada vista.

## Funcionalidades

1. **Pizarra de silos** — vaciado mental libre; tarjetas arrastrables agrupadas
   por proyecto, con marcado rápido de completada y acceso directo a edición.
2. **Cartera de proyectos** — frentes ordenables por prioridad (drag & drop),
   con filtros, métricas y **proyectos destacados** (★) para fijar los que más
   importan en este momento.
3. **Detalle de proyecto** — info editable + lista de tareas, con resumen
   lateral y marcado de proyecto destacado.
4. **Prioridades (Eisenhower)** — matriz de 4 cuadrantes (hacer / planificar /
   delegar / eliminar); reclasifica y reordena arrastrando. Incluye un
   **panel de "tareas sin clasificar"** que agrupa todo lo pendiente sin
   cuadrante confirmado en toda la base y deja aceptar la sugerencia automática
   o elegir el cuadrante correcto en un clic.
5. **Lista de tareas** — buscador, filtros y orden por prioridad, proyecto,
   responsable o estado. Incluye pestaña de **Cronología**: qué se completó y
   qué se tocó, semana a semana, con un resumen de "actualizado esta semana"
   para saber de un vistazo en qué se ha estado trabajando.
6. **Lo primero, mañana** — ritual nocturno para ordenar qué atacar primero al
   día siguiente, con acciones rápidas de completar y editar sin salir de la
   vista.
7. **Capturar** — formularios de nueva tarea / nuevo proyecto.

Acciones rápidas de completar/editar están disponibles directamente desde las
tarjetas en Pizarra, Eisenhower y Lo primero — no hace falta abrir el panel de
edición para marcar algo como hecho.

## Cómo correrlo (2 minutos)

```bash
git clone https://github.com/gusespinoza22/project-task-manager.git
cd project-task-manager
npm install      # instalar dependencias (una vez)
npm run dev      # servidor de desarrollo  → http://localhost:5173
```

Otros comandos disponibles:

```bash
npm run build    # type-check + build de producción en dist/
npm run preview  # previsualizar el build
```

Al primer arranque no necesitas configurar nada: la app parte con datos de
ejemplo para que puedas explorar todas las vistas de inmediato.

## Persistencia — 100% local, sin servidor externo

- **`data.json`** en la raíz del proyecto es la única fuente de verdad de
  *tu* copia local. Contiene tus datos reales y **no se sube a git** (este
  repo es público) — está en `.gitignore`.
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
- Si el servidor no está disponible (p. ej. un build estático servido sin
  Vite), "Guardar cambios" descarga `data.json` para colocarlo manualmente.
- Cada tarea registra `updatedAt` (última modificación) y `completedAt`
  (cuándo se marcó como hecha), lo que alimenta la vista de Cronología.

> **Migración futura:** la capa de persistencia está aislada en `src/store.tsx`
> (carga inicial + `save()`), lista para cambiarse a Supabase u otra BD si en
> algún momento quieres sincronizar entre dispositivos.

## Estructura

```
src/
  main.tsx              punto de entrada
  App.tsx               shell: sidebar + main + alertas + toast
  store.tsx             estado central, persistencia y formularios
  logic.ts              helpers puros (cuadrantes, estancamiento, semanas, estilos)
  constants.ts          paleta, metadatos de cuadrantes, umbrales
  seed.ts               datos semilla del prototipo
  types.ts              tipos del dominio
  useIsMobile.ts        breakpoint 820px
  components/           Sidebar, Alerts, Toast, SaveButton, TaskTimeline
  views/                Whiteboard, Portfolio, ProjectDetail, Eisenhower,
                        FirstThing, TaskList, Capture
data.example.json       plantilla de ejemplo (versionada en git)
data.json               estado real del usuario (gitignored, no se sube)
```

## Licencia

Proyecto de código abierto, libre para clonar, usar y modificar.
