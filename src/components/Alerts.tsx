import { useStore } from '../store'
import { css, isStalled } from '../logic'
import { STAR_THRESHOLD } from '../constants'

export function Alerts() {
  const { data } = useStore()

  const starred = data.tasks.filter((t) => t.starred && !t.done)
  const showStarAlert = starred.length >= STAR_THRESHOLD
  const starAlertText = `${starred.length} tareas con seguimiento personal activo a la vez — no puedes dar seguimiento intensivo a todas.`

  const stalled = data.tasks.filter((t) => isStalled(t))
  const showStallAlert = stalled.length > 0
  const stallAlertText =
    stalled.length === 1
      ? '1 tarea lleva semanas sin movimiento — ¿la descartas o la reprogramas?'
      : `${stalled.length} tareas llevan semanas sin movimiento. Revisa si las descartas o reprogramas.`

  return (
    <>
      {showStarAlert && (
        <div style={css('margin:0 0 16px;padding:13px 16px;border-radius:13px;background:#FBF0DA;border:1px solid #E8CE8F;display:flex;align-items:center;gap:13px')}>
          <div style={css('width:30px;height:30px;border-radius:8px;background:#E0A82E;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;font-weight:700')}>
            ★
          </div>
          <div style={css('flex:1;min-width:0')}>
            <div style={css('font-weight:700;font-size:14px;color:#7A5A12')}>
              Conflicto de seguimiento personal
            </div>
            <div style={css('font-size:13px;color:#9A7B36;margin-top:1px')}>{starAlertText}</div>
          </div>
          <span style={css("font:600 11px 'JetBrains Mono';color:#9A7B36;white-space:nowrap")}>
            renegociar prioridades
          </span>
        </div>
      )}

      {showStallAlert && (
        <div style={css('margin:0 0 16px;padding:12px 16px;border-radius:13px;background:#F3ECE0;border:1px solid #DCCFB8;display:flex;align-items:center;gap:13px')}>
          <div style={css('width:28px;height:28px;border-radius:8px;background:#B08A4A;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="7.5" x2="12" y2="12.5" />
              <line x1="12" y1="16" x2="12" y2="16" />
            </svg>
          </div>
          <div style={css('flex:1;min-width:0;font-size:13.5px;color:#6E5C3C')}>{stallAlertText}</div>
        </div>
      )}
    </>
  )
}
