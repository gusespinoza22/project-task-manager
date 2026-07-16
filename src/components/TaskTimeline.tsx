import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { assigneeStyle, chip, css, isThisWeek, weekKey, weekLabel, weekStart } from '../logic'
import type { Task } from '../types'

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function TaskTimeline() {
  const { data, setEditingTaskId } = useStore()
  const currentWeekKey = weekKey(Date.now())
  const [expanded, setExpanded] = useState<Set<string>>(new Set([currentWeekKey]))

  const proj = (id: string) => data.projects.find((p) => p.id === id)

  const updatedThisWeek = useMemo(
    () =>
      data.tasks
        .filter((t) => t.updatedAt && isThisWeek(t.updatedAt))
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)),
    [data.tasks],
  )

  const weeks = useMemo(() => {
    const map = new Map<string, { startMs: number; tasks: Task[] }>()
    for (const t of data.tasks) {
      if (!t.done || !t.completedAt) continue
      const key = weekKey(t.completedAt)
      if (!map.has(key)) map.set(key, { startMs: weekStart(t.completedAt).getTime(), tasks: [] })
      map.get(key)!.tasks.push(t)
    }
    return [...map.entries()]
      .sort((a, b) => b[1].startMs - a[1].startMs)
      .map(([key, v]) => ({
        key,
        label: weekLabel(v.startMs),
        isCurrent: key === currentWeekKey,
        tasks: v.tasks.sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
      }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.tasks])

  const completedNoDate = useMemo(
    () => data.tasks.filter((t) => t.done && !t.completedAt),
    [data.tasks],
  )

  const toggleWeek = (key: string) =>
    setExpanded((s) => {
      const next = new Set(s)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const cardStyle = css('background:#fff;border:1px solid #ECE3D3;border-radius:16px;overflow:hidden')

  const taskRow = (t: Task) => {
    const p = proj(t.projectId)
    return (
      <div
        key={t.id}
        onClick={() => setEditingTaskId(t.id)}
        style={css('display:flex;align-items:center;gap:10px;padding:11px 18px;cursor:pointer;border-top:1px solid #F5EFE3')}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#FDFAF5' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '' }}
      >
        <div style={css('flex:1;min-width:0')}>
          <div style={css("font:600 14px 'Hanken Grotesk';color:#2B2520")}>{t.title}</div>
          <div style={css('display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap')}>
            {p && <span style={chip(p.color, p.tint)}>{p.name}</span>}
            <span style={assigneeStyle(t.assignee)}>{t.assignee}</span>
          </div>
        </div>
        <span style={css("flex-shrink:0;font:500 12px 'JetBrains Mono';color:#A89B86")}>
          {t.done && t.completedAt ? fmtDate(t.completedAt) : t.updatedAt ? fmtDate(t.updatedAt) : ''}
        </span>
      </div>
    )
  }

  return (
    <section style={css('display:flex;flex-direction:column;gap:20px')}>
      {/* Actualizadas esta semana */}
      <div style={cardStyle}>
        <div style={css('padding:16px 18px;border-bottom:1px solid #F0E8DA;display:flex;align-items:center;justify-content:space-between')}>
          <div>
            <div style={css("font:700 15px 'Hanken Grotesk';color:#2B2520")}>Actualizadas esta semana</div>
            <div style={css('margin-top:2px;font-size:12.5px;color:#8C8275')}>
              Cualquier cambio: edición, clasificación, estrella o estatus.
            </div>
          </div>
          <span style={css("font:700 13px 'JetBrains Mono';color:#2B2520;background:#F0E8DA;border-radius:8px;padding:3px 10px")}>
            {updatedThisWeek.length}
          </span>
        </div>
        {updatedThisWeek.length === 0 ? (
          <div style={css('padding:22px;text-align:center;color:#A89B86;font-size:13.5px')}>
            Nada actualizado esta semana todavía.
          </div>
        ) : (
          updatedThisWeek.map(taskRow)
        )}
      </div>

      {/* Cronología de completadas, por semana */}
      <div>
        <div style={css("font:700 15px 'Hanken Grotesk';color:#2B2520;margin-bottom:10px")}>
          Completadas por semana
        </div>
        {weeks.length === 0 && completedNoDate.length === 0 ? (
          <div style={{ ...cardStyle, padding: '22px', textAlign: 'center', color: '#A89B86', fontSize: 13.5 } as React.CSSProperties}>
            Aún no hay tareas completadas.
          </div>
        ) : (
          <div style={css('display:flex;flex-direction:column;gap:10px')}>
            {weeks.map((w) => {
              const isOpen = expanded.has(w.key)
              return (
                <div key={w.key} style={cardStyle}>
                  <button
                    onClick={() => toggleWeek(w.key)}
                    style={css(`width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 18px;border:none;background:${w.isCurrent ? '#FBF0DA' : '#fff'};cursor:pointer;text-align:left`)}
                  >
                    <div style={css('display:flex;align-items:center;gap:9px')}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8C8275" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .12s', flexShrink: 0 }}>
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                      <span style={css("font:700 14px 'Hanken Grotesk';color:#2B2520")}>{w.label}</span>
                      {w.isCurrent && (
                        <span style={css("font:600 10.5px 'JetBrains Mono';letter-spacing:.3px;text-transform:uppercase;color:#9A7B36;background:#F3E2B8;border-radius:6px;padding:2px 7px")}>
                          Esta semana
                        </span>
                      )}
                    </div>
                    <span style={css("font:700 12.5px 'JetBrains Mono';color:#8C8275")}>
                      {w.tasks.length} completada{w.tasks.length === 1 ? '' : 's'}
                    </span>
                  </button>
                  {isOpen && w.tasks.map(taskRow)}
                </div>
              )
            })}

            {completedNoDate.length > 0 && (
              <div style={cardStyle}>
                <div style={css('padding:14px 18px')}>
                  <div style={css("font:700 14px 'Hanken Grotesk';color:#2B2520")}>Sin fecha registrada</div>
                  <div style={css('margin-top:2px;font-size:12px;color:#8C8275')}>
                    Se completaron antes de empezar a registrar la fecha exacta.
                  </div>
                </div>
                {completedNoDate.map(taskRow)}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
