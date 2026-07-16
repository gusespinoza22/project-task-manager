import { Fragment, useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { QMETA, QUAD_ORDER } from '../constants'
import { assigneeStyle, chip, css, eff, starBadge, suggest } from '../logic'
import type { QuadKey, TaskFilter } from '../types'

function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

interface Ghost {
  id: string
  x: number
  y: number
  quad: QuadKey | null
  idx: number | null
}

const FILT: Record<TaskFilter, string> = {
  all: 'Todas',
  mine: 'Solo las mías',
  delegated: 'Solo delegadas',
  starred: 'Solo estrelladas',
}

export function Eisenhower({ isMobile }: { isMobile: boolean }) {
  const { data, filter, setFilter, updateData, updateTask, flash, setEditingTaskId } = useStore()
  const [dragId, setDragId] = useState<string | null>(null)
  const [ghost, setGhost] = useState<Ghost | null>(null)
  const quadRef = useRef<QuadKey | null>(null)
  const idxRef = useRef<number | null>(null)
  const [showUnclassified, setShowUnclassified] = useState(false)

  // Unclassified = no explicit quadrant set, across the whole DB (not just
  // the current filter/view) — relies purely on the auto-suggestion for now.
  const unclassified = data.tasks.filter((t) => !t.done && t.quadrant === null)

  useEffect(() => {
    if (unclassified.length === 0) setShowUnclassified(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unclassified.length])

  useEffect(() => {
    if (!dragId) return
    const move = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const q = el && (el.closest('[data-quad]') as HTMLElement | null)
      const quad = q ? (q.getAttribute('data-quad') as QuadKey) : null
      quadRef.current = quad
      let idx: number | null = null
      if (q) {
        const cards = [...q.querySelectorAll('[data-eid]')]
        idx = cards.length
        for (let i = 0; i < cards.length; i++) {
          const r = cards[i].getBoundingClientRect()
          if (e.clientY < r.top + r.height / 2) {
            idx = i
            break
          }
        }
      }
      idxRef.current = idx
      setGhost({ id: dragId, x: e.clientX, y: e.clientY, quad, idx })
    }
    const up = () => {
      const q = quadRef.current
      const at = idxRef.current
      if (q) {
        updateData((d) => {
          const ids = d.tasks
            .filter((t) => t.id !== dragId && eff(t) === q)
            .sort((a, b) => (a.eisOrder ?? 0) - (b.eisOrder ?? 0))
            .map((t) => t.id)
          const pos = at == null ? ids.length : Math.min(at, ids.length)
          ids.splice(pos, 0, dragId)
          const om: Record<string, number> = {}
          ids.forEach((tid, i) => (om[tid] = i))
          return {
            ...d,
            tasks: d.tasks.map((t) =>
              t.id === dragId
                ? { ...t, quadrant: q, eisOrder: om[t.id], lastMoved: 0, updatedAt: Date.now() }
                : om[t.id] != null
                  ? { ...t, eisOrder: om[t.id] }
                  : t,
            ),
          }
        })
      }
      quadRef.current = null
      idxRef.current = null
      setDragId(null)
      setGhost(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [dragId, updateData])

  const proj = (id: string) => data.projects.find((p) => p.id === id)!
  const pass = (t: (typeof data.tasks)[number]) => {
    if (t.done) return false
    if (filter === 'mine') return t.assignee === 'Yo'
    if (filter === 'delegated') return t.assignee !== 'Yo'
    if (filter === 'starred') return t.starred
    return true
  }

  const chipStyle = (active: boolean) =>
    css(
      `padding:8px 14px;border-radius:10px;font:600 13px 'Hanken Grotesk';cursor:pointer;border:1px solid ${
        active ? '#2B2520' : '#E3D9C8'
      };background:${active ? '#2B2520' : '#fff'};color:${active ? '#F4EEE4' : '#6B6358'}`,
    )

  const ghostTask = ghost ? data.tasks.find((t) => t.id === ghost.id) : null
  const ghostProj = ghostTask ? proj(ghostTask.projectId) : null

  return (
    <section>
      <div style={css('display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:16px;flex-wrap:wrap')}>
        <div>
          <h1 style={css("margin:0;font:800 25px 'Hanken Grotesk';color:#2B2520;letter-spacing:-.5px")}>
            Prioridades · todas las tareas
          </h1>
          <p style={css('margin:4px 0 0;font-size:14px;color:#8C8275')}>
            Arrastra para reclasificar entre cuadrantes{' '}
            <strong style={css('color:#6B6358')}>y para ordenar</strong> arriba→abajo dentro de cada uno. El orden se conserva.
          </p>
        </div>
        <div style={css('display:flex;gap:7px;flex-wrap:wrap')}>
          {(Object.keys(FILT) as TaskFilter[]).map((k) => (
            <button key={k} onClick={() => setFilter(k)} style={chipStyle(filter === k)}>
              {FILT[k]}
            </button>
          ))}
        </div>
      </div>

      {unclassified.length > 0 && (
        <div style={css('margin:0 0 16px;padding:12px 16px;border-radius:13px;background:#F3ECE0;border:1px solid #DCCFB8;display:flex;align-items:center;gap:13px')}>
          <div style={css('width:28px;height:28px;border-radius:8px;background:#B08A4A;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="7.5" x2="12" y2="12.5" />
              <line x1="12" y1="16" x2="12" y2="16" />
            </svg>
          </div>
          <div style={css('flex:1;min-width:0;font-size:13.5px;color:#6E5C3C')}>
            {unclassified.length === 1
              ? '1 tarea en toda la base no tiene clasificación confirmada en Eisenhower — se ubica solo por sugerencia.'
              : `${unclassified.length} tareas en toda la base no tienen clasificación confirmada en Eisenhower — se ubican solo por sugerencia.`}
          </div>
          <button
            onClick={() => setShowUnclassified(true)}
            style={css("flex-shrink:0;border:none;background:none;padding:0;cursor:pointer;font:600 12.5px 'Hanken Grotesk';color:#B08A4A;text-decoration:underline;white-space:nowrap")}
          >
            Clasificar ahora
          </button>
        </div>
      )}

      <div
        style={
          isMobile
            ? css('display:flex;flex-direction:column;gap:14px')
            : css('display:grid;grid-template-columns:1fr 1fr;gap:16px')
        }
      >
        {QUAD_ORDER.map((k) => {
          const meta = QMETA[k]
          const list = data.tasks
            .filter((t) => pass(t) && eff(t) === k && !(ghost && ghost.id === t.id))
            .sort((a, b) => (a.eisOrder ?? 0) - (b.eisOrder ?? 0))
          const hot = ghost && ghost.quad === k
          const insertIdx = hot ? (ghost!.idx == null ? list.length : ghost!.idx) : -1
          const lineStyle = css(`height:3px;border-radius:2px;background:${meta.accent};margin:1px 3px`)

          return (
            <div
              key={k}
              data-quad={k}
              style={css(
                `background:${meta.bg};border-radius:16px;padding:16px 17px;min-height:200px;border:2px solid ${
                  hot ? meta.accent : 'transparent'
                };transition:border-color .12s`,
              )}
            >
              <div style={{ ...css('display:flex;align-items:center;justify-content:space-between;margin-bottom:12px'), pointerEvents: 'none' }}>
                <div>
                  <div style={css(`font:700 16px 'Hanken Grotesk';color:${meta.accent}`)}>{meta.label}</div>
                  <div style={css("font:500 11.5px 'JetBrains Mono';color:#A89B86;margin-top:1px")}>{meta.sub}</div>
                </div>
                <span style={css(`font:700 13px 'JetBrains Mono';color:${meta.accent};background:#fff;border-radius:8px;padding:3px 9px`)}>
                  {list.length}
                </span>
              </div>
              <div style={css('display:flex;flex-direction:column;gap:8px;min-height:40px')}>
                {list.map((t, i) => {
                  const p = proj(t.projectId)
                  let cs = `background:#fff;border-radius:12px;padding:12px 13px;cursor:grab;user-select:none;touch-action:none;border-left:3px solid ${p.color};box-shadow:0 1px 3px rgba(43,37,32,.07);`
                  if (t.starred) cs += 'box-shadow:0 1px 3px rgba(43,37,32,.07),0 0 0 1.5px #E0A82E;'
                  return (
                    <Fragment key={t.id}>
                      {hot && insertIdx === i && <div style={lineStyle} />}
                      <div
                        data-eid={t.id}
                        style={css(cs)}
                        onPointerDown={(e) => {
                          e.preventDefault()
                          quadRef.current = null
                          idxRef.current = null
                          setDragId(t.id)
                          setGhost({ id: t.id, x: e.clientX, y: e.clientY, quad: null, idx: null })
                        }}
                      >
                        <div style={css('display:flex;align-items:flex-start;justify-content:space-between;gap:9px')}>
                          <span style={css(`flex-shrink:0;width:20px;height:20px;border-radius:6px;background:${meta.accent}1A;color:${meta.accent};font:700 11px 'JetBrains Mono';display:flex;align-items:center;justify-content:center;margin-top:1px`)}>
                            {i + 1}
                          </span>
                          <div style={css('flex:1;min-width:0')}>
                            <div style={css('display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:6px')}>
                              <span style={chip(p.color, p.tint)}>{p.name}</span>
                              <span style={assigneeStyle(t.assignee)}>{t.assignee}</span>
                            </div>
                            <div style={css("font:600 14px 'Hanken Grotesk';color:#2B2520;line-height:1.3")}>{t.title}</div>
                          </div>
                          {t.starred && <span style={starBadge()}>★</span>}
                          <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation()
                              updateTask(t.id, { done: true, lastMoved: 0 })
                            }}
                            title="Marcar completada"
                            style={css('flex-shrink:0;width:26px;height:26px;border:1.5px solid #CFC4B0;border-radius:7px;background:#fff;cursor:pointer;padding:0')}
                          />
                          <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingTaskId(t.id)
                            }}
                            title="Editar tarea"
                            style={css('flex-shrink:0;width:26px;height:26px;border:1px solid #E9E1D3;border-radius:7px;background:#fff;color:#A89B86;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0')}
                          >
                            <EditIcon />
                          </button>
                        </div>
                        {t.quadrant === null && (
                          <div style={css('margin-top:9px;display:flex;align-items:center;gap:8px;padding-top:9px;border-top:1px dashed #E7DECF')}>
                            <span style={css("flex:1;font:500 11px 'JetBrains Mono';color:#A89B86")}>sugerido por reglas</span>
                            <button
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation()
                                updateTask(t.id, { quadrant: suggest(t) })
                                flash('Clasificación confirmada')
                              }}
                              style={css("padding:4px 11px;border:none;border-radius:7px;background:#2B2520;color:#F4EEE4;font:600 11.5px 'Hanken Grotesk';cursor:pointer")}
                            >
                              Confirmar
                            </button>
                          </div>
                        )}
                      </div>
                    </Fragment>
                  )
                })}
                {hot && insertIdx === list.length && <div style={lineStyle} />}
              </div>
            </div>
          )
        })}
      </div>

      {showUnclassified && (
        <div
          onClick={() => setShowUnclassified(false)}
          style={css('position:fixed;inset:0;background:rgba(43,37,32,.22);z-index:500;display:flex;align-items:center;justify-content:center;padding:24px')}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={css('background:#fff;border-radius:16px;max-width:640px;width:100%;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(43,37,32,.25)')}
          >
            <div style={css('padding:18px 22px;border-bottom:1px solid #F0E8DA;display:flex;align-items:center;justify-content:space-between;gap:12px')}>
              <div>
                <div style={css("font:700 16px 'Hanken Grotesk';color:#2B2520")}>
                  Clasificar tareas pendientes
                </div>
                <div style={css('margin-top:2px;font-size:12.5px;color:#8C8275')}>
                  Confirma la sugerencia o elige el cuadrante manualmente.
                </div>
              </div>
              <button
                onClick={() => setShowUnclassified(false)}
                style={css('flex-shrink:0;border:none;background:none;cursor:pointer;color:#8C8275;font-size:18px;line-height:1;padding:2px')}
              >×</button>
            </div>
            <div style={{ ...css('flex:1;padding:8px'), overflowY: 'auto' }}>
              {unclassified.map((t) => {
                const p = proj(t.projectId)
                const sug = suggest(t)
                const sugMeta = QMETA[sug]
                return (
                  <div key={t.id} style={css('padding:12px 14px;border-radius:11px')}>
                    <div style={css('display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:9px')}>
                      <button
                        onClick={() => updateTask(t.id, { done: true, lastMoved: 0 })}
                        title="Marcar completada"
                        style={css('flex-shrink:0;margin-top:2px;width:22px;height:22px;border-radius:6px;border:1.5px solid #CFC4B0;background:#fff;cursor:pointer;padding:0')}
                      />
                      <div style={css('flex:1;min-width:0')}>
                        <div style={css("font:600 14px 'Hanken Grotesk';color:#2B2520;margin-bottom:5px")}>
                          {t.title}
                        </div>
                        <div style={css('display:flex;align-items:center;gap:6px;flex-wrap:wrap')}>
                          <span style={chip(p.color, p.tint)}>{p.name}</span>
                          <span style={assigneeStyle(t.assignee)}>{t.assignee}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => { setEditingTaskId(t.id); setShowUnclassified(false) }}
                        title="Editar tarea completa"
                        style={css('flex-shrink:0;width:28px;height:28px;border:1px solid #E9E1D3;border-radius:8px;background:#fff;color:#A89B86;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0')}
                      >
                        <EditIcon />
                      </button>
                    </div>
                    <div style={css('display:flex;align-items:center;gap:8px;flex-wrap:wrap')}>
                      <button
                        onClick={() => { updateTask(t.id, { quadrant: sug }); flash('Clasificación confirmada') }}
                        style={css(`display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;border:1.5px solid ${sugMeta.accent};background:${sugMeta.bg};color:${sugMeta.accent};font:600 12.5px 'Hanken Grotesk';cursor:pointer`)}
                      >
                        Confirmar sugerencia: {sugMeta.label}
                      </button>
                      <span style={css("font:500 11px 'JetBrains Mono';color:#C4B79F")}>o elige:</span>
                      {QUAD_ORDER.filter((k) => k !== sug).map((k) => {
                        const m = QMETA[k]
                        return (
                          <button
                            key={k}
                            onClick={() => { updateTask(t.id, { quadrant: k }); flash('Clasificación confirmada') }}
                            style={css(`padding:6px 11px;border-radius:8px;border:1px solid ${m.accent}55;background:#fff;color:${m.accent};font:600 12px 'Hanken Grotesk';cursor:pointer`)}
                          >
                            {m.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {ghost && ghostTask && ghostProj && (
        <div
          style={css(
            `position:fixed;left:${ghost.x + 14}px;top:${ghost.y - 10}px;width:230px;background:#fff;border-radius:12px;padding:12px 13px;border-left:3px solid ${ghostProj.color};box-shadow:0 18px 40px rgba(43,37,32,.28);pointer-events:none;z-index:300;transform:rotate(2deg)`,
          )}
        >
          <div style={css("font:600 14px 'Hanken Grotesk';color:#2B2520;line-height:1.3")}>{ghostTask.title}</div>
          <div style={css("margin-top:6px;font:500 11.5px 'JetBrains Mono';color:#A89B86")}>
            {ghost.quad ? '→ ' + QMETA[ghost.quad].label : 'arrastra a un cuadrante'}
          </div>
        </div>
      )}
    </section>
  )
}
