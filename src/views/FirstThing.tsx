import { Fragment, useEffect, useRef, useState, useMemo } from 'react'
import { useStore } from '../store'
import { assigneeStyle, chip, css, eff } from '../logic'
import { QMETA } from '../constants'

interface Ghost {
  id: string
  x: number
  y: number
  idx: number | null
}

function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

export function FirstThing() {
  const { data, updateData, updateTask, setEditingTaskId } = useStore()
  const [dragId, setDragId] = useState<string | null>(null)
  const [ghost, setGhost] = useState<Ghost | null>(null)
  const idxRef = useRef<number | null>(null)

  const proj = (id: string) => data.projects.find((p) => p.id === id)!

  const toggleFt = (id: string) => {
    updateData((d) => {
      const t = d.tasks.find((x) => x.id === id)!
      if (t.firstThing) {
        return { ...d, tasks: d.tasks.map((x) => (x.id === id ? { ...x, firstThing: false, updatedAt: Date.now() } : x)) }
      }
      const max = Math.max(0, ...d.tasks.filter((x) => x.firstThing).map((x) => x.ftOrder))
      return {
        ...d,
        tasks: d.tasks.map((x) => (x.id === id ? { ...x, firstThing: true, ftOrder: max + 1, lastMoved: 0, updatedAt: Date.now() } : x)),
      }
    })
  }

  useEffect(() => {
    if (!dragId) return
    const move = (e: PointerEvent) => {
      const cont = document.querySelector('[data-ftlist]')
      let idx: number | null = null
      if (cont) {
        const cards = [...cont.querySelectorAll('[data-ftid]')]
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
      setGhost({ id: dragId, x: e.clientX, y: e.clientY, idx })
    }
    const up = () => {
      const at = idxRef.current
      updateData((d) => {
        const ids = d.tasks
          .filter((t) => t.firstThing && !t.done && t.id !== dragId)
          .sort((a, b) => a.ftOrder - b.ftOrder)
          .map((t) => t.id)
        const pos = at == null ? ids.length : Math.min(at, ids.length)
        ids.splice(pos, 0, dragId)
        const om: Record<string, number> = {}
        ids.forEach((tid, i) => (om[tid] = i))
        return { ...d, tasks: d.tasks.map((t) => (om[t.id] != null ? { ...t, ftOrder: om[t.id] } : t)) }
      })
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

  type SortKey = 'priority' | 'project' | 'assignee'
  const QUAD_RANK: Record<string, number> = { do: 0, schedule: 1, delegate: 2, eliminate: 3 }
  const [sortBy, setSortBy] = useState<SortKey>('priority')

  const ftAll = data.tasks.filter((t) => t.firstThing && !t.done).sort((a, b) => a.ftOrder - b.ftOrder)
  const ftList = ghost ? ftAll.filter((t) => t.id !== ghost.id) : ftAll
  const ftInsert = ghost ? (ghost.idx == null ? ftList.length : ghost.idx) : -1
  const lineStyle = css('height:3px;border-radius:2px;background:#C75D3C;margin:1px 4px')
  const ghostTask = ghost ? data.tasks.find((t) => t.id === ghost.id) : null

  const candidates = useMemo(() => {
    const base = data.tasks.filter((t) => !t.firstThing && !t.done)
    if (sortBy === 'priority') {
      return [...base].sort((a, b) => (QUAD_RANK[eff(a)] ?? 9) - (QUAD_RANK[eff(b)] ?? 9))
    }
    if (sortBy === 'project') {
      return [...base].sort((a, b) => {
        const pa = proj(a.projectId)?.name ?? ''
        const pb = proj(b.projectId)?.name ?? ''
        return pa.localeCompare(pb, 'es')
      })
    }
    // assignee
    return [...base].sort((a, b) => a.assignee.localeCompare(b.assignee, 'es'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.tasks, sortBy])

  return (
    <section>
      <div style={css('max-width:720px;margin:0 auto')}>
        <div style={css('text-align:center;margin-bottom:8px')}>
          <span style={css("font:600 11px 'JetBrains Mono';letter-spacing:1px;text-transform:uppercase;color:#A89B86")}>
            Ritual nocturno
          </span>
        </div>
        <h1 style={css("margin:0 0 6px;font:800 27px 'Hanken Grotesk';color:#2B2520;text-align:center;letter-spacing:-.5px")}>
          Lo primero, mañana
        </h1>
        <p style={css('margin:0 0 24px;font-size:14.5px;color:#8C8275;text-align:center')}>
          Sin importar la prioridad: arrastra para ordenar qué atacarás primero y desconecta la ansiedad.
        </p>

        <div style={css('background:#fff;border:1px solid #ECE3D3;border-radius:16px;padding:14px;margin-bottom:22px')}>
          {ftAll.length === 0 && (
            <div style={css('padding:26px;text-align:center;color:#A89B86;font-size:14px')}>
              Aún no eliges nada. Agrega desde la lista de abajo.
            </div>
          )}
          <div data-ftlist="1" style={css('display:flex;flex-direction:column;gap:9px')}>
            {ftList.map((t, i) => {
              const p = proj(t.projectId)
              return (
                <Fragment key={t.id}>
                  {ghost && ftInsert === i && <div style={lineStyle} />}
                  <div
                    data-ftid={t.id}
                    style={css('display:flex;align-items:center;gap:11px;padding:13px 15px;background:#FAF6EE;border:1px solid #EFE6D6;border-radius:12px;cursor:grab;user-select:none;touch-action:none')}
                    onPointerDown={(e) => {
                      e.preventDefault()
                      idxRef.current = null
                      setDragId(t.id)
                      setGhost({ id: t.id, x: e.clientX, y: e.clientY, idx: null })
                    }}
                  >
                    <span style={css('flex-shrink:0;color:#C9BCA4;font-size:15px;line-height:1;letter-spacing:1px')}>⦙</span>
                    <span style={css("font:800 17px 'Hanken Grotesk';color:#C9BCA4;width:18px;text-align:center;flex-shrink:0")}>
                      {i + 1}
                    </span>
                    <div style={css('flex:1;min-width:0')}>
                      <div style={css("font:600 15px 'Hanken Grotesk';color:#2B2520")}>{t.title}</div>
                      <div style={css('display:flex;align-items:center;gap:7px;margin-top:4px;flex-wrap:wrap')}>
                        <span style={chip(p.color, p.tint)}>{p.name}</span>
                        <span style={assigneeStyle(t.assignee)}>{t.assignee}</span>
                        {t.starred && <span style={css('color:#D99A1C;font-size:13px')}>★</span>}
                      </div>
                    </div>
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => updateTask(t.id, { done: true, lastMoved: 0 })}
                      title="Marcar completada"
                      style={css('flex-shrink:0;width:30px;height:30px;border-radius:8px;border:1.5px solid #CFC4B0;background:#fff;cursor:pointer;padding:0')}
                    />
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => setEditingTaskId(t.id)}
                      title="Editar tarea"
                      style={css('flex-shrink:0;width:30px;height:30px;border:1px solid #E7DECF;border-radius:8px;background:#fff;color:#B5A892;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0')}
                    >
                      <EditIcon />
                    </button>
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => toggleFt(t.id)}
                      title="Quitar de Lo primero"
                      style={css('flex-shrink:0;width:30px;height:30px;border:1px solid #E7DECF;border-radius:8px;background:#fff;color:#B5A892;cursor:pointer;font-size:15px;line-height:1')}
                    >
                      ×
                    </button>
                  </div>
                </Fragment>
              )
            })}
            {ghost && ftInsert === ftList.length && <div style={lineStyle} />}
          </div>
        </div>

        <div style={css('display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px;flex-wrap:wrap')}>
          <span style={css("font:600 11px 'JetBrains Mono';letter-spacing:.5px;text-transform:uppercase;color:#A89B86")}>
            Agregar desde pendientes
          </span>
          <div style={css('display:flex;align-items:center;gap:4px')}>
            <span style={css("font:500 11px 'JetBrains Mono';color:#C4B89E;margin-right:2px")}>Ordenar:</span>
            {([
              { key: 'priority', label: 'Prioridad' },
              { key: 'project',  label: 'Proyecto'  },
              { key: 'assignee', label: 'Asignado'  },
            ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                style={css(`padding:4px 10px;border-radius:7px;font:600 12px 'Hanken Grotesk';cursor:pointer;border:1px solid ${
                  sortBy === key ? '#2B2520' : '#DDD3C2'
                };background:${sortBy === key ? '#2B2520' : '#fff'};color:${
                  sortBy === key ? '#F4EEE4' : '#6B6358'
                }`)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div style={css('display:flex;flex-direction:column;gap:8px')}>
          {candidates.map((t) => {
            const p = proj(t.projectId)
            const q = QMETA[eff(t)]
            return (
              <div
                key={t.id}
                style={css('display:flex;align-items:center;gap:9px;width:100%;padding:11px 15px;background:#fff;border:1px solid #ECE3D3;border-radius:11px')}
              >
                <button
                  onClick={() => toggleFt(t.id)}
                  title="Agregar a Lo primero"
                  style={css('flex:1;min-width:0;display:flex;align-items:center;gap:9px;text-align:left;background:none;border:none;padding:0;cursor:pointer')}
                >
                  <span style={css('font-size:18px;color:#C9BCA4;line-height:1;flex-shrink:0')}>+</span>
                  <span style={css("flex:1;min-width:0;font:600 14px 'Hanken Grotesk';color:#2B2520")}>{t.title}</span>
                  {/* Quadrant badge */}
                  <span style={{
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: q.bg,
                    border: `1px solid ${q.accent}33`,
                    font: "600 11px 'JetBrains Mono'",
                    color: q.accent,
                    whiteSpace: 'nowrap',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: q.accent, display: 'inline-block', flexShrink: 0 }} />
                    {q.label}
                  </span>
                  <span style={chip(p.color, p.tint)}>{p.name}</span>
                  <span style={assigneeStyle(t.assignee)}>{t.assignee}</span>
                </button>
                <button
                  onClick={() => updateTask(t.id, { done: true, lastMoved: 0 })}
                  title="Marcar completada"
                  style={css('flex-shrink:0;width:26px;height:26px;border-radius:7px;border:1.5px solid #CFC4B0;background:#fff;cursor:pointer;padding:0')}
                />
                <button
                  onClick={() => setEditingTaskId(t.id)}
                  title="Editar tarea"
                  style={css('flex-shrink:0;width:26px;height:26px;border:1px solid #E9E1D3;border-radius:7px;background:#FAF6EE;color:#A89B86;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0')}
                >
                  <EditIcon />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {ghost && ghostTask && (
        <div
          style={css(
            `position:fixed;left:${ghost.x + 14}px;top:${ghost.y - 12}px;width:300px;max-width:70vw;display:flex;align-items:center;gap:10px;background:#fff;border-radius:12px;padding:13px 15px;border:1px solid #EFE6D6;box-shadow:0 18px 40px rgba(43,37,32,.26);pointer-events:none;z-index:300;transform:rotate(1.5deg)`,
          )}
        >
          <span style={css('color:#C9BCA4;font-size:15px')}>⦙</span>
          <div style={css("font:600 14px 'Hanken Grotesk';color:#2B2520;line-height:1.3")}>{ghostTask.title}</div>
        </div>
      )}
    </section>
  )
}
