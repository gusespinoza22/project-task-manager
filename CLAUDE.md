# Gestor de proyectos y tareas — instrucciones para Claude

## REGLA ABSOLUTA: Nunca perder datos

Ante cualquier cambio, mejora, refactor o nueva funcionalidad en este proyecto:

- **JAMÁS se debe perder ningún dato del usuario**: tareas, proyectos, personas, posiciones, estados, descripciones, imágenes adjuntas, ni ningún otro campo almacenado.
- Antes de modificar tipos, interfaces, el store o la lógica de persistencia, verificar que los cambios son **retrocompatibles** con los datos existentes en `localStorage` y `data.json`.
- Los campos nuevos deben ser **opcionales** (`field?: tipo`) para que los datos guardados anteriormente sigan siendo válidos sin migración.
- Si se requiere una migración de datos, implementarla **explícitamente** antes de aplicar el cambio, nunca después.
- Si hay riesgo de pérdida de datos, **detener y preguntar al usuario** antes de proceder.

## Stack

- React + Vite + TypeScript
- Persistencia: `localStorage` (borrador vivo) + `data.json` en raíz (guardado manual vía botón "Guardar cambios" → `POST /api/save`)
- Fuente de carga: localStorage → data.json → datos semilla (`src/seed.ts`)

## Estructura

```
src/
  main.tsx / App.tsx         shell principal
  store.tsx                  estado central, persistencia, formularios
  types.ts                   tipos del dominio (Task, Project, etc.)
  logic.ts                   helpers puros
  constants.ts               paleta, cuadrantes, umbrales
  seed.ts                    datos semilla de ejemplo
  useIsMobile.ts             breakpoint 820px
  components/                Sidebar, Alerts, Toast, SaveButton, TaskEditPanel
  views/                     Whiteboard, Portfolio, ProjectDetail, Eisenhower,
                             FirstThing, Capture
data.json                    estado persistido por el usuario
```

## Vistas

1. **Pizarra** — tarjetas arrastrables agrupadas por zona de proyecto
2. **Cartera** — proyectos ordenables por prioridad
3. **Proyecto** — detalle editable + lista de tareas (clic en título → panel de edición)
4. **Prioridades (Eisenhower)** — matriz 4 cuadrantes con drag & drop
5. **Lo primero** — ritual nocturno de ordenamiento
6. **Capturar** — formularios de nueva tarea / nuevo proyecto

## Campos de Task

Todos los campos son parte del contrato de datos persistido. No eliminar ninguno:
`id, projectId, title, assignee, importance, urgent, quadrant, starred, done, firstThing, ftOrder, lastMoved, x, y, eisOrder?, desc?, imageDataUrl?`
