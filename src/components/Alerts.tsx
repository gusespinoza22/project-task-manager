import { useState } from 'react'
import { useStore } from '../store'
import { assigneeStyle, chip, css, isStalled } from '../logic'
import { STAR_THRESHOLD } from '../constants'

export function Alerts() {
  const { data, setView, setEditingTaskId } = useStore()
  const [showStallPopup, setShowStallPopup] = useState(false)

  const starred = data.tasks.filter((t) => t.starred && !t.done)
  const showStarAlert = starred.length >= STAR_THRESHOLD
  const starAlertText = `${starred.length} tareas con seguimiento personal activo a la vez — no puedes dar seguimiento intensivo a todas.`

  const stalled = data.tasks.filter((t) => isStalled(t))
  const showStallAlert = stalled.length > 0
  const stallAlertText =
    stalled.length === 1
      ? '1 tarea lleva semanas sin movimiento — ¿la descartas o la reprogramas?'
      : `${stalled.length} tareas llevan semanas sin movimiento. Revisa si las descartas o reprogramas.`

  const proj = (id: string) => data.projects.find((p) => p.id === id)

  const openTask = (taskId: string) => {
    setShowStallPopup(false)
    setView('list')
    setEditingTaskId(taskId)
  }

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
          <button
            onClick={() => setShowStallPopup(true)}
            style={css("flex-shrink:0;border:none;background:none;padding:0;cursor:pointer;font:600 12.5px 'Hanken Grotesk';color:#B08A4A;text-decoration:underline;white-space:nowrap")}
          >
            Ver tareas
          </button>
        </div>
      )}

      {showStallPopup && (
        <div
          onClick={() => setShowStallPopup(false)}
          style={css('position:fixed;inset:0;background:rgba(43,37,32,.22);z-index:500;display:flex;align-items:center;justify-content:center;padding:24px')}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={css('background:#fff;border-radius:16px;max-width:520px;width:100%;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(43,37,32,.25)')}
          >
            <div style={css('padding:18px 22px;border-bottom:1px solid #F0E8DA;display:flex;align-items:center;justify-content:space-between;gap:12px')}>
              <div style={css("font:700 16px 'Hanken Grotesk';color:#2B2520")}>
                Tareas sin movimiento
              </div>
              <button
                onClick={() => setShowStallPopup(false)}
                style={css('border:none;background:none;cursor:pointer;color:#8C8275;font-size:18px;line-height:1;padding:2px')}
              >×</button>
            </div>
            <div style={{ ...css('flex:1;padding:8px'), overflowY: 'auto' }}>
              {stalled.map((t) => {
                const p = proj(t.projectId)
                return (
                  <div
                    key={t.id}
                    onClick={() => openTask(t.id)}
                    style={css('display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:11px;cursor:pointer')}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#FAF6EE' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '' }}
                  >
                    <div style={css('flex:1;min-width:0')}>
                      <div style={css("font:600 14px 'Hanken Grotesk';color:#2B2520;margin-bottom:5px")}>
                        {t.title}
                      </div>
                      <div style={css('display:flex;align-items:center;gap:6px;flex-wrap:wrap')}>
                        {p && <span style={chip(p.color, p.tint)}>{p.name}</span>}
                        <span style={assigneeStyle(t.assignee)}>{t.assignee}</span>
                        <span style={css("font:600 10.5px 'JetBrains Mono';color:#B08A4A;background:#F3ECE0;border-radius:6px;padding:3px 7px")}>
                          ⏳ {t.lastMoved} días sin mover
                        </span>
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A89B86" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
