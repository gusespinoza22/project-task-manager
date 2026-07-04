import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import {
  MIN_ZONE_H,
  MIN_ZONE_W,
  QMETA,
  TASK_CARD_H,
  TASK_CARD_W,
  ZONE_HEADER_H,
  ZONE_MARGIN,
} from '../constants'
import { assigneeStyle, chip, css, eff, isStalled, starBadge } from '../logic'

type DragState =
  | {
      kind: 'task'
      id: string
      sx: number; sy: number
      ox: number; oy: number
      zoneX: number; zoneY: number; zoneW: number; zoneH: number
    }
  | {
      kind: 'zone'
      projectId: string
      sx: number; sy: number
      ox: number; oy: number
      taskOffsets: { id: string; ox: number; oy: number }[]
    }
  | {
      kind: 'resize'
      projectId: string
      sx: number; sy: number
      ow: number; oh: number
    }

export function Whiteboard({ isMobile }: { isMobile: boolean }) {
  const { data, updateTask, updateData, setView } = useStore()
  const [dragState, setDragState] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showDone, setShowDone] = useState(false)

  // Track fullscreen state changes (including Esc key exit)
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      sectionRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // Drag event listeners
  useEffect(() => {
    if (!dragState) return

    const move = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return

      if (d.kind === 'task') {
        const dx = e.clientX - d.sx
        const dy = e.clientY - d.sy
        const rawX = d.ox + dx
        const rawY = d.oy + dy
        const newX = Math.max(
          d.zoneX + ZONE_MARGIN,
          Math.min(d.zoneX + d.zoneW - TASK_CARD_W - ZONE_MARGIN, rawX),
        )
        const newY = Math.max(
          d.zoneY + ZONE_HEADER_H,
          Math.min(d.zoneY + d.zoneH - TASK_CARD_H - ZONE_MARGIN, rawY),
        )
        updateTask(d.id, { x: newX, y: newY, lastMoved: 0 })
        return
      }

      if (d.kind === 'zone') {
        const dx = e.clientX - d.sx
        const dy = e.clientY - d.sy
        const newZoneX = Math.max(0, d.ox + dx)
        const newZoneY = Math.max(0, d.oy + dy)
        const actualDx = newZoneX - d.ox
        const actualDy = newZoneY - d.oy
        updateData((cur) => ({
          ...cur,
          projects: cur.projects.map((p) =>
            p.id === d.projectId
              ? { ...p, zone: { ...p.zone, x: newZoneX, y: newZoneY } }
              : p,
          ),
          tasks: cur.tasks.map((t) => {
            const off = d.taskOffsets.find((o) => o.id === t.id)
            if (!off) return t
            return { ...t, x: off.ox + actualDx, y: off.oy + actualDy }
          }),
        }))
        return
      }

      if (d.kind === 'resize') {
        const dx = e.clientX - d.sx
        const dy = e.clientY - d.sy
        const newW = Math.max(MIN_ZONE_W, d.ow + dx)
        const newH = Math.max(MIN_ZONE_H, d.oh + dy)
        updateData((cur) => ({
          ...cur,
          projects: cur.projects.map((p) =>
            p.id === d.projectId
              ? { ...p, zone: { ...p.zone, w: newW, h: newH } }
              : p,
          ),
        }))
      }
    }

    const up = () => {
      dragRef.current = null
      setDragState(null)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [dragState, updateTask, updateData])

  const proj = (id: string) => data.projects.find((p) => p.id === id)!

  // Canvas grows to fit all zone positions
  const canvasW = Math.max(1400, ...data.projects.map((p) => p.zone.x + p.zone.w + 160))
  const canvasH = Math.max(900, ...data.projects.map((p) => p.zone.y + p.zone.h + 160))

  // Canvas container height: flex in fullscreen, fixed-vh otherwise
  const canvasContainerStyle: React.CSSProperties = isFullscreen
    ? { flex: 1, minHeight: 0, overflow: 'auto' }
    : {
        height: isMobile ? '70vh' : '72vh',
        overflow: 'auto',
      }

  return (
    <section
      ref={sectionRef}
      style={
        isFullscreen
          ? {
              display: 'flex',
              flexDirection: 'column',
              background: '#EFE8DB',
              padding: '24px 28px',
              boxSizing: 'border-box',
              height: '100vh',
              gap: 14,
            }
          : undefined
      }
    >
      {/* Header row */}
      <div style={css('display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:14px;flex-wrap:wrap')}>
        <div>
          <h1 style={css("margin:0;font:800 25px 'Hanken Grotesk';color:#2B2520;letter-spacing:-.5px")}>
            Pizarra de silos
          </h1>
          <p style={css('margin:4px 0 0;font-size:14px;color:#8C8275;max-width:640px')}>
            Arrastra tareas <strong style={css('color:#6B6358')}>dentro de su zona</strong> ·
            mueve una zona desde su <strong style={css('color:#6B6358')}>etiqueta ⊹</strong> ·
            redimensiona desde el <strong style={css('color:#6B6358')}>grip ⋱ esquina</strong>
          </p>
        </div>
        <div style={css('display:flex;align-items:center;gap:8px')}>
          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '9px 13px',
              border: '1px solid #DDD3C2',
              borderRadius: 10,
              background: isFullscreen ? '#2B2520' : '#fff',
              color: isFullscreen ? '#F4EEE4' : '#6B6358',
              cursor: 'pointer',
              font: "600 13px 'Hanken Grotesk'",
            }}
          >
            {isFullscreen ? (
              /* Exit fullscreen icon */
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="8 3 3 3 3 8"/>
                <polyline points="21 8 21 3 16 3"/>
                <polyline points="3 16 3 21 8 21"/>
                <polyline points="16 21 21 21 21 16"/>
                <line x1="8" y1="8" x2="16" y2="16"/>
                <line x1="16" y1="8" x2="8" y2="16"/>
              </svg>
            ) : (
              /* Enter fullscreen icon */
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9"/>
                <polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/>
                <line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            )}
            {!isMobile && (isFullscreen ? 'Salir' : 'Pantalla completa')}
          </button>

          <button
            onClick={() => setShowDone((v) => !v)}
            title={showDone ? 'Ocultar completadas' : 'Mostrar completadas'}
            style={css(`display:flex;align-items:center;gap:6px;padding:9px 13px;border:1px solid ${showDone ? '#2E7D6B' : '#DDD3C2'};border-radius:10px;background:${showDone ? '#E9F2EC' : '#fff'};color:${showDone ? '#2E7D6B' : '#6B6358'};font:600 13px 'Hanken Grotesk';cursor:pointer`)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {!isMobile && 'Completadas'}
          </button>
          <button
            onClick={() => setView('capture')}
            style={css("display:flex;align-items:center;gap:7px;padding:10px 16px;border:none;border-radius:11px;background:#2B2520;color:#F4EEE4;font:600 14px 'Hanken Grotesk';cursor:pointer")}
          >
            + Nueva tarea
          </button>
        </div>
      </div>

      {/* Canvas scroll wrapper */}
      <div
        style={{
          ...canvasContainerStyle,
          borderRadius: 18,
          border: '1px solid #E3D9C8',
          backgroundColor: '#FBF8F1',
          backgroundImage: 'radial-gradient(#D9CDB6 1.3px,transparent 1.3px)',
          backgroundSize: '26px 26px',
          backgroundPosition: '-13px -13px',
          boxShadow: 'inset 0 1px 3px rgba(43,37,32,.04)',
        }}
      >
        {/* Canvas — sized to always contain all zones */}
        <div style={{ position: 'relative', width: canvasW, height: canvasH }}>

          {/* ── Project zone boxes ── */}
          {data.projects.map((p) => {
            const isMoving = dragState?.kind === 'zone' && dragState.projectId === p.id
            const isResizing = dragState?.kind === 'resize' && dragState.projectId === p.id
            return (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: p.zone.x,
                  top: p.zone.y,
                  width: p.zone.w,
                  height: p.zone.h,
                  borderRadius: 20,
                  background: p.tint + '66',
                  border: `1.5px dashed ${isMoving ? p.color : p.color + '55'}`,
                  boxSizing: 'border-box',
                  zIndex: isMoving ? 20 : 1,
                  boxShadow: isMoving ? '0 18px 44px rgba(43,37,32,.15)' : undefined,
                }}
              >
                {/* Zone tag — drag handle */}
                <div
                  title="Arrastra para mover la zona"
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const ds: DragState = {
                      kind: 'zone',
                      projectId: p.id,
                      sx: e.clientX,
                      sy: e.clientY,
                      ox: p.zone.x,
                      oy: p.zone.y,
                      taskOffsets: data.tasks
                        .filter((t) => t.projectId === p.id)
                        .map((t) => ({ id: t.id, ox: t.x, oy: t.y })),
                    }
                    dragRef.current = ds
                    setDragState(ds)
                  }}
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    font: "700 12px 'Hanken Grotesk'",
                    color: '#5C544A',
                    background: '#fff',
                    border: `1px solid ${p.color}33`,
                    padding: '5px 11px 5px 9px',
                    borderRadius: 9,
                    boxShadow: isMoving
                      ? '0 4px 12px rgba(43,37,32,.14)'
                      : '0 1px 2px rgba(43,37,32,.05)',
                    cursor: 'move',
                    userSelect: 'none',
                    touchAction: 'none',
                    zIndex: 3,
                  }}
                >
                  {/* Move icon — 4 arrow heads */}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill={p.color} style={{ opacity: 0.65, flexShrink: 0 }}>
                    <polygon points="6,0 7.6,2.4 4.4,2.4"/>
                    <polygon points="6,12 7.6,9.6 4.4,9.6"/>
                    <polygon points="0,6 2.4,7.6 2.4,4.4"/>
                    <polygon points="12,6 9.6,7.6 9.6,4.4"/>
                  </svg>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block', flexShrink: 0 }} />
                  {p.name}
                  <span style={{ opacity: 0.6, fontWeight: 500 }}>· {p.area}</span>
                </div>

                {/* Resize grip — bottom-right corner */}
                <div
                  title="Arrastra para redimensionar"
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const ds: DragState = {
                      kind: 'resize',
                      projectId: p.id,
                      sx: e.clientX,
                      sy: e.clientY,
                      ow: p.zone.w,
                      oh: p.zone.h,
                    }
                    dragRef.current = ds
                    setDragState(ds)
                  }}
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    width: 24,
                    height: 24,
                    cursor: 'se-resize',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: p.color,
                    opacity: isResizing ? 0.9 : 0.45,
                    userSelect: 'none',
                    touchAction: 'none',
                    zIndex: 3,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 12L12 2M6 12L12 6M10 12L12 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            )
          })}

          {/* ── Task cards — done tasks hidden unless showDone toggle is active ── */}
          {data.tasks.filter((t) => showDone || !t.done).map((t) => {
            const p = proj(t.projectId)
            const q = QMETA[eff(t)]
            const dragging = dragState?.kind === 'task' && dragState.id === t.id

            return (
              <div
                key={t.id}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: TASK_CARD_W,
                  boxSizing: 'border-box',
                  background: '#fff',
                  borderRadius: 14,
                  padding: '12px 14px',
                  cursor: dragging ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  touchAction: 'none',
                  transform: `translate(${t.x}px,${t.y}px)${dragging ? ' scale(1.03)' : ''}`,
                  zIndex: dragging ? 50 : 5,
                  border: t.starred ? '1.5px solid #E0A82E' : '1px solid #EAE1D2',
                  boxShadow: dragging
                    ? '0 14px 34px rgba(43,37,32,.18)'
                    : t.starred
                      ? '0 1px 2px rgba(43,37,32,.05),0 6px 18px rgba(217,154,28,.22)'
                      : '0 1px 2px rgba(43,37,32,.05),0 5px 14px rgba(43,37,32,.05)',
                  ...(t.done ? { filter: 'grayscale(1)', opacity: 0.5 } : {}),
                }}
                onPointerDown={(e) => {
                  e.preventDefault()
                  const zone = p.zone
                  const ds: DragState = {
                    kind: 'task',
                    id: t.id,
                    sx: e.clientX,
                    sy: e.clientY,
                    ox: t.x,
                    oy: t.y,
                    zoneX: zone.x,
                    zoneY: zone.y,
                    zoneW: zone.w,
                    zoneH: zone.h,
                  }
                  dragRef.current = ds
                  setDragState(ds)
                }}
              >
                <div style={css('display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px')}>
                  <span style={chip(p.color, p.tint)}>{p.name}</span>
                  {t.starred && <span style={starBadge()}>★</span>}
                </div>
                <div style={css("font:600 14.5px 'Hanken Grotesk';color:#2B2520;line-height:1.3")}>
                  {t.title}
                </div>
                <div style={css('display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap')}>
                  <span style={css("display:inline-flex;align-items:center;gap:5px;font:500 11.5px 'Hanken Grotesk';color:#8C8275")}>
                    <span style={css(`width:8px;height:8px;border-radius:2px;background:${q.accent};display:inline-block`)} />
                    {q.label}
                  </span>
                  <span style={assigneeStyle(t.assignee)}>{t.assignee}</span>
                </div>
                {isStalled(t) && (
                  <div style={css("margin-top:9px;font:600 10.5px 'JetBrains Mono';color:#B08A4A;background:#F3ECE0;border-radius:6px;padding:3px 7px;display:inline-block")}>
                    ⏳ {t.lastMoved} días sin mover
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
