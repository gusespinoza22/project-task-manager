import { Fragment, useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { css } from '../logic'
import type { PortFilter } from '../types'

interface Ghost {
  id: string
  x: number
  y: number
  idx: number | null
}

const PFILT: Record<PortFilter, string> = {
  all: 'Todos',
  active: 'Solo activos',
  paused: 'En pausa',
}

export function Portfolio() {
  const { data, portFilter, setPortFilter, setView, setSelectedProject, updateData, updateProject } = useStore()
  const [ghost, setGhost] = useState<Ghost | null>(null)
  const dragId = useRef<string | null>(null)
  const dropIdx = useRef<number | null>(null)

  useEffect(() => {
    if (!ghost) return
    const move = (e: PointerEvent) => {
      const cont = document.querySelector('[data-plist]')
      let idx: number | null = null
      if (cont) {
        const rows = [...cont.querySelectorAll('[data-pid]')]
        idx = rows.length
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i].getBoundingClientRect()
          if (e.clientY < r.top + r.height / 2) {
            idx = i
            break
          }
        }
      }
      dropIdx.current = idx
      setGhost((g) => (g ? { ...g, x: e.clientX, y: e.clientY, idx } : g))
    }
    const up = () => {
      const id = dragId.current
      const at = dropIdx.current
      if (id) {
        updateData((d) => {
          const ids = d.projects.filter((p) => p.id !== id).map((p) => p.id)
          const pos = at == null ? ids.length : Math.min(at, ids.length)
          ids.splice(pos, 0, id)
          return { ...d, projects: ids.map((pid) => d.projects.find((p) => p.id === pid)!) }
        })
      }
      dragId.current = null
      dropIdx.current = null
      setGhost(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [ghost, updateData])

  const filterStyle = (active: boolean) =>
    css(
      `padding:8px 14px;border-radius:10px;font:600 13px 'Hanken Grotesk';cursor:pointer;border:1px solid ${
        active ? '#2B2520' : '#E3D9C8'
      };background:${active ? '#2B2520' : '#fff'};color:${active ? '#F4EEE4' : '#6B6358'}`,
    )

  const activeCount = data.projects.filter((p) => p.status !== 'paused').length
  const pausedCount = data.projects.filter((p) => p.status === 'paused').length
  const starredCount = data.projects.filter((p) =>
    data.tasks.some((t) => t.projectId === p.id && t.starred && !t.done),
  ).length

  const ranked = data.projects.map((p, i) => ({ p, rank: i + 1 }))
  const visible = ranked
    .filter(({ p }) =>
      portFilter === 'active' ? p.status !== 'paused' : portFilter === 'paused' ? p.status === 'paused' : true,
    )
    .filter(({ p }) => !(ghost && ghost.id === p.id))
  const pInsert = ghost ? (ghost.idx == null ? visible.length : ghost.idx) : -1
  const lineStyle = css('height:3px;border-radius:2px;background:#2B2520;margin:1px 4px')

  const ghostProj = ghost ? data.projects.find((p) => p.id === ghost.id) : null

  return (
    <section>
      <div style={css('display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:6px;flex-wrap:wrap')}>
        <div>
          <h1 style={css("margin:0;font:800 25px 'Hanken Grotesk';color:#2B2520;letter-spacing:-.5px")}>
            Cartera de proyectos
          </h1>
          <p style={css('margin:4px 0 0;font-size:14px;color:#8C8275')}>
            Tus frentes activos, ordenados por importancia. Arrastra para subir o bajar la prioridad.
          </p>
        </div>
        <div style={css('display:flex;gap:7px;flex-wrap:wrap')}>
          {(Object.keys(PFILT) as PortFilter[]).map((k) => (
            <button key={k} onClick={() => setPortFilter(k)} style={filterStyle(portFilter === k)}>
              {PFILT[k]}
            </button>
          ))}
        </div>
      </div>

      <div style={css('display:flex;gap:20px;flex-wrap:wrap;margin:14px 0 18px')}>
        <div style={css('display:flex;align-items:baseline;gap:8px')}>
          <span style={css("font:800 28px 'Hanken Grotesk';color:#2B2520")}>{activeCount}</span>
          <span style={css('font-size:13px;color:#8C8275')}>frentes activos</span>
        </div>
        <div style={css('display:flex;align-items:baseline;gap:8px')}>
          <span style={css("font:800 28px 'Hanken Grotesk';color:#B08A4A")}>{pausedCount}</span>
          <span style={css('font-size:13px;color:#8C8275')}>en pausa</span>
        </div>
        <div style={css('display:flex;align-items:baseline;gap:8px')}>
          <span style={css("font:800 28px 'Hanken Grotesk';color:#D99A1C")}>{starredCount}</span>
          <span style={css('font-size:13px;color:#8C8275')}>con estrella</span>
        </div>
      </div>

      <div data-plist="1" style={css('display:flex;flex-direction:column;gap:9px')}>
        {visible.map(({ p, rank }, i) => {
          const pt = data.tasks.filter((t) => t.projectId === p.id && !t.done)
          const mine = pt.filter((t) => t.assignee === 'Yo').length
          const del = pt.length - mine
          const paused = p.status === 'paused'
          const hasStar = data.tasks.some((t) => t.projectId === p.id && t.starred && !t.done)
          return (
            <Fragment key={p.id}>
              {ghost && pInsert === i && <div style={lineStyle} />}
              <div
                data-pid={p.id}
                onClick={() => {
                  setSelectedProject(p.id)
                  setView('project')
                }}
                style={css(
                  `display:flex;align-items:center;gap:12px;padding:14px 16px;background:#fff;border:1px solid ${
                    paused ? '#E7DECF' : '#ECE3D3'
                  };border-radius:13px;cursor:pointer;${paused ? 'opacity:.62' : ''}`,
                )}
              >
                <span
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    dragId.current = p.id
                    dropIdx.current = null
                    setGhost({ id: p.id, x: e.clientX, y: e.clientY, idx: null })
                  }}
                  style={css('flex-shrink:0;color:#C4B79F;font-size:16px;line-height:1;letter-spacing:1px;cursor:grab;touch-action:none;padding:4px 2px')}
                >
                  ⠿
                </span>
                <span style={css("flex-shrink:0;width:26px;height:26px;border-radius:8px;background:#2B2520;color:#F4EEE4;font:800 13px 'JetBrains Mono';display:flex;align-items:center;justify-content:center")}>
                  {rank}
                </span>
                <span style={css(`width:12px;height:12px;border-radius:50%;background:${p.color};flex-shrink:0`)} />
                <div style={css('flex:1;min-width:0')}>
                  <div style={css('display:flex;align-items:center;gap:9px;flex-wrap:wrap')}>
                    <span style={css("font:700 16px 'Hanken Grotesk';color:#2B2520")}>{p.name}</span>
                    {hasStar && <span style={css('color:#D99A1C;font-size:14px')}>★</span>}
                  </div>
                  <div style={css('display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap')}>
                    <span style={css("font:600 10.5px 'JetBrains Mono';letter-spacing:.3px;text-transform:uppercase;color:#A89B86")}>
                      {p.area}
                    </span>
                    <span style={css('color:#D6CCB8')}>·</span>
                    <span style={css("font:500 12px 'Hanken Grotesk';color:#8C8275")}>
                      {pt.length} tareas · {mine} mías / {del} delegadas
                    </span>
                  </div>
                </div>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    updateProject(p.id, { status: paused ? 'active' : 'paused' })
                  }}
                  style={css(
                    `flex-shrink:0;padding:6px 13px;border-radius:9px;border:1px solid ${
                      paused ? '#DCCFB8' : '#CBE0CF'
                    };background:${paused ? '#F3ECE0' : '#E9F2EC'};color:${
                      paused ? '#9A7B36' : '#2E7D6B'
                    };font:600 12px 'Hanken Grotesk';cursor:pointer;white-space:nowrap`,
                  )}
                >
                  {paused ? 'En pausa' : 'Activo'}
                </button>
              </div>
            </Fragment>
          )
        })}
        {ghost && pInsert === visible.length && <div style={lineStyle} />}
      </div>

      {ghost && ghostProj && (
        <div
          style={css(
            `position:fixed;left:${ghost.x + 14}px;top:${ghost.y - 12}px;width:340px;max-width:72vw;display:flex;align-items:center;gap:11px;background:#fff;border-radius:13px;padding:14px 16px;border:1px solid #ECE3D3;box-shadow:0 18px 40px rgba(43,37,32,.26);pointer-events:none;z-index:300;transform:rotate(1.2deg)`,
          )}
        >
          <span style={css(`width:11px;height:11px;border-radius:50%;background:${ghostProj.color}`)} />
          <div style={css("font:700 15px 'Hanken Grotesk';color:#2B2520;line-height:1.3")}>{ghostProj.name}</div>
        </div>
      )}
    </section>
  )
}
