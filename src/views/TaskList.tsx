import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { QMETA } from '../constants'
import { assigneeStyle, chip, css, eff } from '../logic'

type SortKey = 'priority' | 'project' | 'assignee' | 'status' | 'starred'
type StatusFilter = 'all' | 'pending' | 'done'

const QUAD_RANK: Record<string, number> = { do: 0, schedule: 1, delegate: 2, eliminate: 3 }

export function TaskList() {
  const { data, setEditingTaskId, updateTask } = useStore()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('priority')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')

  const proj = (id: string) => data.projects.find((p) => p.id === id)!

  const tasks = useMemo(() => {
    const q = search.toLowerCase().trim()

    const filtered = data.tasks.filter((t) => {
      if (statusFilter === 'pending' && t.done) return false
      if (statusFilter === 'done' && !t.done) return false
      if (!q) return true
      const p = proj(t.projectId)
      const descPlain = (t.desc ?? '').replace(/<[^>]*>/g, ' ').toLowerCase()
      return (
        t.title.toLowerCase().includes(q) ||
        p?.name.toLowerCase().includes(q) ||
        descPlain.includes(q) ||
        t.assignee.toLowerCase().includes(q)
      )
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'priority') return (QUAD_RANK[eff(a)] ?? 9) - (QUAD_RANK[eff(b)] ?? 9)
      if (sortBy === 'project')  return (proj(a.projectId)?.name ?? '').localeCompare(proj(b.projectId)?.name ?? '', 'es')
      if (sortBy === 'assignee') return a.assignee.localeCompare(b.assignee, 'es')
      if (sortBy === 'status')   return Number(a.done) - Number(b.done)
      if (sortBy === 'starred')  return Number(b.starred) - Number(a.starred)
      return 0
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.tasks, data.projects, search, sortBy, statusFilter])

  const sortBtns: { key: SortKey; label: string }[] = [
    { key: 'priority', label: 'Prioridad' },
    { key: 'project',  label: 'Proyecto'  },
    { key: 'assignee', label: 'Asignado'  },
    { key: 'status',   label: 'Estado'    },
    { key: 'starred',  label: 'Estrelladas' },
  ]

  const statusBtns: { key: StatusFilter; label: string }[] = [
    { key: 'all',     label: 'Todas'       },
    { key: 'pending', label: 'Pendientes'  },
    { key: 'done',    label: 'Completadas' },
  ]

  const sortPill = (active: boolean) =>
    css(`padding:6px 13px;border-radius:9px;font:600 13px 'Hanken Grotesk';cursor:pointer;border:1px solid ${
      active ? '#2B2520' : '#E3D9C8'
    };background:${active ? '#2B2520' : '#fff'};color:${active ? '#F4EEE4' : '#6B6358'}`)

  const totalAll = data.tasks.length
  const totalPending = data.tasks.filter((t) => !t.done).length
  const totalDone = data.tasks.filter((t) => t.done).length

  return (
    <section>
      {/* ── Header ── */}
      <div style={css('display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:18px;flex-wrap:wrap')}>
        <div>
          <h1 style={css("margin:0;font:800 25px 'Hanken Grotesk';color:#2B2520;letter-spacing:-.5px")}>
            Todas las tareas
          </h1>
          <p style={css('margin:4px 0 0;font-size:14px;color:#8C8275')}>
            <span style={css("font:600 13px 'JetBrains Mono';color:#2B2520")}>{totalPending}</span> pendientes ·{' '}
            <span style={css("font:600 13px 'JetBrains Mono';color:#2E7D6B")}>{totalDone}</span> completadas ·{' '}
            {tasks.length !== totalAll && (
              <><span style={css("font:600 13px 'JetBrains Mono';color:#C75D3C")}>{tasks.length}</span> en vista · </>
            )}
            clic en el título para editar
          </p>
        </div>

        {/* Search */}
        <div style={css('position:relative')}>
          <svg style={css('position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none')} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A89B86" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar título, proyecto, asignado…"
            style={css("padding:9px 34px 9px 36px;border:1px solid #DDD3C2;border-radius:11px;font:500 14px 'Hanken Grotesk';color:#2B2520;background:#fff;width:300px;max-width:80vw")}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={css('position:absolute;right:10px;top:50%;transform:translateY(-50%);border:none;background:none;cursor:pointer;color:#A89B86;font-size:17px;line-height:1;padding:2px')}
            >×</button>
          )}
        </div>
      </div>

      {/* ── Filter + Sort bar ── */}
      <div style={css('display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap')}>
        {/* Status filter segmented */}
        <div style={css('display:inline-flex;padding:3px;background:#EBE2D2;border-radius:11px;gap:2px')}>
          {statusBtns.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              style={css(`padding:6px 14px;border:none;border-radius:8px;font:600 13px 'Hanken Grotesk';cursor:pointer;background:${statusFilter === key ? '#fff' : 'transparent'};color:${statusFilter === key ? '#2B2520' : '#8C8275'};box-shadow:${statusFilter === key ? '0 1px 3px rgba(43,37,32,.1)' : 'none'}`)}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={css('width:1px;height:22px;background:#DDD3C2;flex-shrink:0')} />

        <span style={css("font:600 11px 'JetBrains Mono';letter-spacing:.4px;color:#A89B86;text-transform:uppercase;flex-shrink:0")}>
          Ordenar
        </span>
        {sortBtns.map(({ key, label }) => (
          <button key={key} onClick={() => setSortBy(key)} style={sortPill(sortBy === key)}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Task list ── */}
      <div style={css('background:#fff;border:1px solid #ECE3D3;border-radius:16px;overflow:hidden')}>
        {tasks.length === 0 ? (
          <div style={css('padding:44px;text-align:center;color:#A89B86;font-size:14px')}>
            {search ? `Sin resultados para "${search}".` : 'No hay tareas en esta vista.'}
          </div>
        ) : (
          tasks.map((t, i) => {
            const p = proj(t.projectId)
            const q = QMETA[eff(t)]
            const descPlain = (t.desc ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

            return (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '13px 18px',
                  borderBottom: i < tasks.length - 1 ? '1px solid #F0E8DA' : 'none',
                  transition: 'background .1s',
                  ...(t.done ? { filter: 'grayscale(1)', opacity: 0.55 } : {}),
                }}
                onMouseEnter={(e) => { if (!t.done) (e.currentTarget as HTMLDivElement).style.background = '#FDFAF5' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '' }}
              >
                {/* Done toggle */}
                <button
                  onClick={() => updateTask(t.id, { done: !t.done, lastMoved: 0 })}
                  title={t.done ? 'Marcar pendiente' : 'Marcar completada'}
                  style={css(`flex-shrink:0;margin-top:2px;width:22px;height:22px;border-radius:6px;border:1.5px solid ${t.done ? '#2E7D6B' : '#CFC4B0'};background:${t.done ? '#2E7D6B' : '#fff'};color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0`)}
                >
                  {t.done && <span style={css('font-size:12px')}>✓</span>}
                </button>

                {/* Main content */}
                <div style={css('flex:1;min-width:0')}>
                  <div style={css('display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap')}>
                    {/* Title — opens edit panel */}
                    <span
                      onClick={() => setEditingTaskId(t.id)}
                      title="Clic para editar"
                      style={{
                        flex: 1,
                        minWidth: 160,
                        font: "600 14.5px/1.35 'Hanken Grotesk'",
                        color: t.done ? '#A89B86' : '#2B2520',
                        cursor: 'pointer',
                        textDecoration: t.done ? 'line-through' : 'none',
                      }}
                    >
                      {t.title}
                      {t.starred && (
                        <span style={css('margin-left:7px;color:#D99A1C;font-size:13px')}>★</span>
                      )}
                    </span>

                    {/* Badges */}
                    <div style={css('display:flex;align-items:center;gap:6px;flex-shrink:0;flex-wrap:wrap')}>
                      {/* Quadrant badge */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: q.bg,
                        border: `1px solid ${q.accent}33`,
                        font: "600 11px 'JetBrains Mono'",
                        color: q.accent,
                        whiteSpace: 'nowrap' as const,
                        flexShrink: 0,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: q.accent, display: 'inline-block' }} />
                        {q.label}
                      </span>
                      {p && <span style={chip(p.color, p.tint)}>{p.name}</span>}
                      <span style={assigneeStyle(t.assignee)}>{t.assignee}</span>
                    </div>
                  </div>

                  {/* Description preview — 1 line */}
                  {descPlain && (
                    <p style={css('margin:4px 0 0;font-size:12.5px;color:#9A8E7E;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:700px')}>
                      {descPlain}
                    </p>
                  )}
                </div>

                {/* Edit button */}
                <button
                  onClick={() => setEditingTaskId(t.id)}
                  title="Editar tarea"
                  style={css('flex-shrink:0;width:30px;height:30px;border:1px solid #E9E1D3;border-radius:8px;background:#FAF6EE;color:#A89B86;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
