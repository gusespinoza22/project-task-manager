import { useStore } from '../store'
import { css } from '../logic'

export function SaveButton({ floating }: { floating?: boolean }) {
  const { dirty, saveState, save, loadState } = useStore()
  const saving = saveState === 'saving'
  const blocked = loadState === 'seed-fallback'

  let label = 'Guardado'
  if (blocked) label = 'Sin data.json'
  else if (saving) label = 'Guardando…'
  else if (saveState === 'error') label = 'Reintentar'
  else if (dirty) label = 'Guardar cambios'

  const active = !blocked && (dirty || saveState === 'error')

  const base = floating
    ? `position:fixed;top:14px;right:14px;z-index:120;display:inline-flex;align-items:center;gap:8px;padding:10px 15px;border-radius:11px;font:700 13px 'Hanken Grotesk';cursor:pointer;box-shadow:0 6px 18px rgba(43,37,32,.18);`
    : `display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:11px 14px;border-radius:11px;font:700 13.5px 'Hanken Grotesk';cursor:pointer;`

  const skin = active
    ? 'border:none;background:#C75D3C;color:#fff'
    : 'border:1px solid #E3D9C8;background:#fff;color:#8C8275'

  return (
    <button
      onClick={() => !saving && !blocked && save()}
      disabled={saving || blocked}
      title={blocked ? 'No se pudo leer data.json — recarga antes de guardar' : dirty ? 'Hay cambios sin guardar' : 'Todo guardado'}
      style={css(base + skin + (saving || blocked ? ';opacity:.7;cursor:default' : ''))}
    >
      {active && (
        <span
          style={css(
            'width:7px;height:7px;border-radius:50%;background:' +
              (floating ? '#fff' : '#fff') +
              ';flex-shrink:0',
          )}
        />
      )}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
      {label}
    </button>
  )
}
