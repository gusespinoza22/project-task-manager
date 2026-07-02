import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { QMETA } from '../constants'
import { css, suggest } from '../logic'
import type { QuadKey, Task } from '../types'
import { RichEditor } from './RichEditor'

export function TaskEditPanel() {
  const { data, editingTaskId, setEditingTaskId, updateTask, updateData, flash } = useStore()

  const task = editingTaskId ? data.tasks.find((t) => t.id === editingTaskId) ?? null : null

  const [draft, setDraft] = useState<Task | null>(null)
  const prevId = useRef<string | null>(null)
  const imageZoneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (task && task.id !== prevId.current) {
      setDraft({ ...task })
      prevId.current = task.id
    }
    if (!task) { prevId.current = null; setDraft(null) }
  }, [task])

  // Handle Ctrl+V paste of images anywhere in the panel
  useEffect(() => {
    if (!editingTaskId) return
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'))
      if (!item) return
      e.preventDefault()
      const file = item.getAsFile()
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        setDraft((d) => d ? { ...d, imageDataUrl: reader.result as string } : d)
      }
      reader.readAsDataURL(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [editingTaskId])

  if (!task || !draft) return null

  const proj = (id: string) => data.projects.find((p) => p.id === id)!
  const currentProj = proj(draft.projectId)

  const patch = (p: Partial<Task>) => setDraft((d) => (d ? { ...d, ...p } : d))

  const save = () => {
    if (!draft.title.trim()) { flash('El título no puede estar vacío'); return }
    updateTask(draft.id, {
      title: draft.title.trim(),
      projectId: draft.projectId,
      assignee: draft.assignee,
      importance: draft.importance,
      urgent: draft.urgent,
      quadrant: draft.quadrant,
      starred: draft.starred,
      done: draft.done,
      desc: draft.desc?.replace(/<[^>]*>/g, '').trim() ? draft.desc : undefined,
      imageDataUrl: draft.imageDataUrl || undefined,
    })
    if (draft.assignee && !data.people.some((p) => p.name.toLowerCase() === draft.assignee.toLowerCase())) {
      updateData((d) => ({ ...d, people: [...d.people, { name: draft.assignee }] }))
    }
    flash('Tarea guardada')
    setEditingTaskId(null)
  }

  const deleteTask = () => {
    updateData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== draft.id) }))
    flash('Tarea eliminada')
    setEditingTaskId(null)
  }

  const effQuad: QuadKey = draft.quadrant || suggest(draft)
  const quadMeta = QMETA[effQuad]

  const seg = (on: boolean) =>
    css(`padding:7px 15px;border:none;border-radius:8px;font:600 13px 'Hanken Grotesk';cursor:pointer;background:${on ? '#fff' : 'transparent'};color:${on ? '#2B2520' : '#8C8275'};box-shadow:${on ? '0 1px 2px rgba(43,37,32,.12)' : 'none'}`)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setEditingTaskId(null)}
        style={css('position:fixed;inset:0;background:rgba(43,37,32,.22);z-index:400;backdrop-filter:blur(1px)')}
      />

      {/* Panel */}
      <div style={css('position:fixed;top:0;right:0;bottom:0;width:50vw;max-width:100vw;background:#fff;z-index:401;display:flex;flex-direction:column;box-shadow:-12px 0 40px rgba(43,37,32,.16)')}>

        {/* Header */}
        <div style={{ ...css(`padding:20px 24px 16px;border-bottom:1px solid #F0E8DA;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;background:${currentProj.tint}`), flexShrink: 0 }}>
          <div style={css('min-width:0')}>
            <div style={css(`font:600 10.5px 'JetBrains Mono';letter-spacing:.5px;text-transform:uppercase;color:${currentProj.color};margin-bottom:4px`)}>
              {currentProj.name}
            </div>
            <div style={css("font:700 17px 'Hanken Grotesk';color:#2B2520;line-height:1.3")}>
              Editar tarea
            </div>
          </div>
          <button
            onClick={() => setEditingTaskId(null)}
            style={css('flex-shrink:0;width:32px;height:32px;border:1px solid #DDD3C2;border-radius:9px;background:#fff;color:#8C8275;cursor:pointer;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center')}
          >×</button>
        </div>

        {/* Scrollable body */}
        <div style={{ ...css('flex:1;padding:24px;display:flex;flex-direction:column;gap:18px'), overflowY: 'auto' }}>

          {/* Título */}
          <div>
            <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:6px")}>
              Título <span style={css('color:#C75D3C')}>*</span>
            </label>
            <input
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              style={css("width:100%;padding:11px 13px;border:1px solid #DDD3C2;border-radius:10px;font:500 15px 'Hanken Grotesk';color:#2B2520;background:#FCFAF5")}
            />
          </div>

          {/* Proyecto + Asignado */}
          <div style={css('display:flex;gap:14px;flex-wrap:wrap')}>
            <div style={css('flex:1;min-width:180px')}>
              <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:6px")}>
                Proyecto
              </label>
              <select
                value={draft.projectId}
                onChange={(e) => patch({ projectId: e.target.value })}
                style={css("width:100%;padding:11px 13px;border:1px solid #DDD3C2;border-radius:10px;font:500 14px 'Hanken Grotesk';color:#2B2520;background:#FCFAF5")}
              >
                {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={css('flex:1;min-width:180px')}>
              <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:6px")}>
                Asignado a
              </label>
              <input
                value={draft.assignee}
                onChange={(e) => patch({ assignee: e.target.value })}
                list="edit-people-list"
                style={css("width:100%;padding:11px 13px;border:1px solid #DDD3C2;border-radius:10px;font:500 14px 'Hanken Grotesk';color:#2B2520;background:#FCFAF5")}
              />
              <datalist id="edit-people-list">
                {data.people.map((p) => <option key={p.name} value={p.name} />)}
              </datalist>
            </div>
          </div>

          {/* Descripción enriquecida */}
          <div>
            <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:6px")}>
              Descripción / comentarios <span style={css('font-weight:500;color:#A89B86')}>· opcional</span>
            </label>
            <RichEditor
              value={draft.desc ?? ''}
              onChange={(html) => patch({ desc: html })}
              minHeight={220}
              placeholder="Detalles, contexto, actualizaciones…"
            />
          </div>

          {/* Imagen pegable */}
          <div>
            <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:6px")}>
              Imagen <span style={css('font-weight:500;color:#A89B86')}>· opcional</span>
            </label>
            {draft.imageDataUrl ? (
              <div style={css('position:relative;border-radius:10px;overflow:hidden;border:1px solid #DDD3C2')}>
                <img
                  src={draft.imageDataUrl}
                  alt="Imagen adjunta"
                  style={css('width:100%;display:block;max-height:220px;object-fit:contain;background:#FAF6EE')}
                />
                <button
                  onClick={() => patch({ imageDataUrl: undefined })}
                  style={css('position:absolute;top:8px;right:8px;width:26px;height:26px;border-radius:7px;border:none;background:rgba(43,37,32,.6);color:#fff;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center')}
                  title="Quitar imagen"
                >×</button>
                <div style={css("position:absolute;bottom:8px;left:8px;font:600 10px 'JetBrains Mono';color:#fff;background:rgba(43,37,32,.5);padding:3px 8px;border-radius:5px")}>
                  Ctrl+V para reemplazar
                </div>
              </div>
            ) : (
              <div
                ref={imageZoneRef}
                style={css('display:flex;align-items:center;gap:11px;padding:14px;border:1.5px dashed #D5C9B5;border-radius:10px;background:#FAF6EE;color:#A89B86;cursor:default')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.6"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                <span style={css("font:500 13px 'Hanken Grotesk'")}>
                  Pega una imagen con <strong>Ctrl+V</strong> para adjuntarla
                </span>
              </div>
            )}
          </div>

          {/* Importancia / Urgencia */}
          <div style={css('display:flex;gap:14px;flex-wrap:wrap')}>
            <div>
              <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:6px")}>Importancia</label>
              <div style={css('display:inline-flex;padding:3px;background:#F0E8DA;border-radius:10px;gap:3px')}>
                <button onClick={() => patch({ importance: true, quadrant: null })} style={seg(draft.importance)}>Alta</button>
                <button onClick={() => patch({ importance: false, quadrant: null })} style={seg(!draft.importance)}>Baja</button>
              </div>
            </div>
            <div>
              <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:6px")}>Urgencia</label>
              <div style={css('display:inline-flex;padding:3px;background:#F0E8DA;border-radius:10px;gap:3px')}>
                <button onClick={() => patch({ urgent: true, quadrant: null })} style={seg(draft.urgent)}>Alta</button>
                <button onClick={() => patch({ urgent: false, quadrant: null })} style={seg(!draft.urgent)}>Baja</button>
              </div>
            </div>
          </div>

          {/* Cuadrante Eisenhower */}
          <div>
            <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:8px")}>
              Cuadrante Eisenhower
            </label>
            <div style={css('display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px')}>
              {(['do','schedule','delegate','eliminate'] as QuadKey[]).map((k) => {
                const m = QMETA[k]
                const active = draft.quadrant === k || (draft.quadrant === null && effQuad === k)
                const forced = draft.quadrant === k
                return (
                  <button
                    key={k}
                    onClick={() => patch({ quadrant: forced ? null : k })}
                    style={css(`padding:7px 13px;border-radius:9px;font:600 12.5px 'Hanken Grotesk';cursor:pointer;border:1.5px solid ${active ? m.accent : m.accent+'33'};background:${active ? m.bg : '#fff'};color:${m.accent}`)}
                  >
                    {m.label}
                    {active && !forced && <span style={css("font:500 10px 'JetBrains Mono';margin-left:5px;opacity:.7")}>(auto)</span>}
                  </button>
                )
              })}
            </div>
            <div style={css(`padding:10px 13px;border-radius:10px;background:${quadMeta.bg};border:1px solid ${quadMeta.accent}33`)}>
              <div style={css(`font:700 13px 'Hanken Grotesk';color:${quadMeta.accent}`)}>
                {quadMeta.label} · {quadMeta.sub}
              </div>
            </div>
          </div>

          {/* Opciones extra */}
          <div style={css('display:flex;gap:10px;flex-wrap:wrap')}>
            <button
              onClick={() => patch({ starred: !draft.starred })}
              style={css(`display:inline-flex;align-items:center;gap:7px;padding:9px 15px;border-radius:10px;font:600 13px 'Hanken Grotesk';cursor:pointer;border:1.5px solid ${draft.starred ? '#E0A82E' : '#DDD3C2'};background:${draft.starred ? '#FBF0DA' : '#fff'};color:${draft.starred ? '#9A7B36' : '#8C8275'}`)}
            >
              ★ Seguimiento personal
            </button>
            <button
              onClick={() => patch({ done: !draft.done })}
              style={css(`display:inline-flex;align-items:center;gap:7px;padding:9px 15px;border-radius:10px;font:600 13px 'Hanken Grotesk';cursor:pointer;border:1.5px solid ${draft.done ? '#2E7D6B' : '#DDD3C2'};background:${draft.done ? '#E9F2EC' : '#fff'};color:${draft.done ? '#2E7D6B' : '#8C8275'}`)}
            >
              {draft.done ? '✓ Completada' : '○ Pendiente'}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div style={{ ...css('padding:18px 24px;border-top:1px solid #F0E8DA;display:flex;gap:10px;align-items:center'), flexShrink: 0 }}>
          <button
            onClick={save}
            style={css("flex:1;padding:12px;border:none;border-radius:11px;background:#C75D3C;color:#fff;font:700 14px 'Hanken Grotesk';cursor:pointer")}
          >
            Guardar cambios
          </button>
          <button
            onClick={deleteTask}
            style={css("padding:11px 15px;border:1px solid #E8CFC8;border-radius:11px;background:#fff;color:#C75D3C;font:600 13px 'Hanken Grotesk';cursor:pointer")}
            title="Eliminar tarea"
          >
            🗑 Eliminar
          </button>
        </div>
      </div>
    </>
  )
}
