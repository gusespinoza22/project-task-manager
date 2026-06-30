import { useEffect } from 'react'
import { useStore } from '../store'
import { PALETTE } from '../constants'
import { css } from '../logic'
import { RichEditor } from '../components/RichEditor'

export function Capture() {
  const {
    data,
    captureTab,
    setCaptureTab,
    taskForm,
    setTaskForm,
    submitTask,
    projectForm,
    setProjectForm,
    submitProject,
    setView,
  } = useStore()

  // Handle Ctrl+V paste of images when this view is open (task tab only)
  useEffect(() => {
    if (captureTab !== 'task') return
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'))
      if (!item) return
      e.preventDefault()
      const file = item.getAsFile()
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => setTaskForm({ imageDataUrl: reader.result as string })
      reader.readAsDataURL(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [captureTab, setTaskForm])

  const tabOn = (on: boolean) =>
    css(`padding:9px 18px;border:none;border-radius:9px;font:600 13.5px 'Hanken Grotesk';cursor:pointer;background:${on ? '#fff' : 'transparent'};color:${on ? '#2B2520' : '#8C8275'};box-shadow:${on ? '0 1px 3px rgba(43,37,32,.1)' : 'none'}`)
  const seg = (on: boolean) =>
    css(`padding:7px 15px;border:none;border-radius:8px;font:600 13px 'Hanken Grotesk';cursor:pointer;background:${on ? '#fff' : 'transparent'};color:${on ? '#2B2520' : '#8C8275'};box-shadow:${on ? '0 1px 2px rgba(43,37,32,.12)' : 'none'}`)

  return (
    <section>
      <div style={css('max-width:680px;margin:0 auto')}>
        <div style={css('display:inline-flex;padding:4px;background:#EBE2D2;border-radius:12px;margin-bottom:22px')}>
          <button onClick={() => setCaptureTab('task')} style={tabOn(captureTab === 'task')}>Nueva tarea</button>
          <button onClick={() => setCaptureTab('project')} style={tabOn(captureTab === 'project')}>Nuevo proyecto</button>
        </div>

        {captureTab === 'task' ? (
          <div style={css('background:#fff;border:1px solid #ECE3D3;border-radius:16px;padding:24px 26px;display:flex;flex-direction:column;gap:18px')}>

            {/* Título */}
            <div>
              <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:6px")}>
                Título <span style={css('color:#C75D3C')}>*</span>
              </label>
              <input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ title: e.target.value })}
                placeholder="¿Qué hay que hacer?"
                style={css("width:100%;padding:12px 14px;border:1px solid #DDD3C2;border-radius:10px;font:500 15px 'Hanken Grotesk';color:#2B2520;background:#FCFAF5")}
              />
            </div>

            {/* Proyecto + Asignado */}
            <div style={css('display:flex;gap:14px;flex-wrap:wrap')}>
              <div style={css('flex:1;min-width:200px')}>
                <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:6px")}>
                  Proyecto <span style={css('color:#C75D3C')}>*</span>
                </label>
                <select
                  value={taskForm.projectId}
                  onChange={(e) => setTaskForm({ projectId: e.target.value })}
                  style={css("width:100%;padding:12px 14px;border:1px solid #DDD3C2;border-radius:10px;font:500 14px 'Hanken Grotesk';color:#2B2520;background:#FCFAF5")}
                >
                  {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={css('flex:1;min-width:200px')}>
                <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:6px")}>
                  Asignado a <span style={css('color:#C75D3C')}>*</span>
                </label>
                <input
                  value={taskForm.assignee}
                  onChange={(e) => setTaskForm({ assignee: e.target.value })}
                  list="people-list"
                  placeholder="Escribe un nombre…"
                  style={css("width:100%;padding:12px 14px;border:1px solid #DDD3C2;border-radius:10px;font:500 14px 'Hanken Grotesk';color:#2B2520;background:#FCFAF5")}
                />
                <datalist id="people-list">
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
                value={taskForm.desc}
                onChange={(html) => setTaskForm({ desc: html })}
                minHeight={140}
              />
            </div>

            {/* Imagen */}
            <div>
              <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:6px")}>
                Imagen <span style={css('font-weight:500;color:#A89B86')}>· opcional</span>
              </label>
              {taskForm.imageDataUrl ? (
                <div style={css('position:relative;border-radius:10px;overflow:hidden;border:1px solid #DDD3C2')}>
                  <img
                    src={taskForm.imageDataUrl}
                    alt="Imagen adjunta"
                    style={css('width:100%;display:block;max-height:220px;object-fit:contain;background:#FAF6EE')}
                  />
                  <button
                    onClick={() => setTaskForm({ imageDataUrl: '' })}
                    style={css('position:absolute;top:8px;right:8px;width:26px;height:26px;border-radius:7px;border:none;background:rgba(43,37,32,.6);color:#fff;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center')}
                    title="Quitar imagen"
                  >×</button>
                  <div style={css("position:absolute;bottom:8px;left:8px;font:600 10px 'JetBrains Mono';color:#fff;background:rgba(43,37,32,.5);padding:3px 8px;border-radius:5px")}>
                    Ctrl+V para reemplazar
                  </div>
                </div>
              ) : (
                <div style={css('display:flex;align-items:center;gap:11px;padding:14px;border:1.5px dashed #D5C9B5;border-radius:12px;background:#FAF6EE;color:#A89B86')}>
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

            {/* Importancia + Urgencia + Estrella */}
            <div style={css('display:flex;gap:18px;flex-wrap:wrap;align-items:flex-end')}>
              <div>
                <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:6px")}>
                  Importancia <span style={css('font-weight:500;color:#A89B86')}>· opcional</span>
                </label>
                <div style={css('display:inline-flex;padding:3px;background:#F0E8DA;border-radius:10px;gap:3px')}>
                  <button onClick={() => setTaskForm({ imp: 'high' })} style={seg(taskForm.imp === 'high')}>Alta</button>
                  <button onClick={() => setTaskForm({ imp: 'low' })} style={seg(taskForm.imp === 'low')}>Baja</button>
                </div>
              </div>
              <div>
                <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:6px")}>
                  Urgencia <span style={css('font-weight:500;color:#A89B86')}>· opcional</span>
                </label>
                <div style={css('display:inline-flex;padding:3px;background:#F0E8DA;border-radius:10px;gap:3px')}>
                  <button onClick={() => setTaskForm({ urg: 'high' })} style={seg(taskForm.urg === 'high')}>Alta</button>
                  <button onClick={() => setTaskForm({ urg: 'low' })} style={seg(taskForm.urg === 'low')}>Baja</button>
                </div>
              </div>
              <button
                onClick={() => setTaskForm({ star: !taskForm.star })}
                style={css(`display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:11px;font:600 13.5px 'Hanken Grotesk';cursor:pointer;border:1.5px solid ${taskForm.star ? '#E0A82E' : '#DDD3C2'};background:${taskForm.star ? '#FBF0DA' : '#fff'};color:${taskForm.star ? '#9A7B36' : '#8C8275'}`)}
              >
                ★ Seguimiento personal
              </button>
            </div>

            <p style={css("margin:0;font:500 12px 'JetBrains Mono';color:#A89B86")}>
              Si dejas prioridad en blanco, la herramienta la sugiere después en Prioridades.
            </p>

            <div style={css('display:flex;gap:10px;border-top:1px solid #F0E8DA;padding-top:18px')}>
              <button
                onClick={() => submitTask()}
                style={css("padding:12px 22px;border:none;border-radius:11px;background:#C75D3C;color:#fff;font:700 14px 'Hanken Grotesk';cursor:pointer")}
              >
                Guardar tarea
              </button>
              <button
                onClick={() => setView('whiteboard')}
                style={css("padding:12px 22px;border:1px solid #DDD3C2;border-radius:11px;background:#fff;color:#6B6358;font:600 14px 'Hanken Grotesk';cursor:pointer")}
              >
                Cancelar
              </button>
            </div>
          </div>

        ) : (
          <div style={css('background:#fff;border:1px solid #ECE3D3;border-radius:16px;padding:24px 26px;display:flex;flex-direction:column;gap:18px')}>
            <div>
              <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:6px")}>
                Nombre del proyecto <span style={css('color:#C75D3C')}>*</span>
              </label>
              <input
                value={projectForm.name}
                onChange={(e) => setProjectForm({ name: e.target.value })}
                placeholder="Ej. Lanzamiento App Móvil"
                style={css("width:100%;padding:12px 14px;border:1px solid #DDD3C2;border-radius:10px;font:500 15px 'Hanken Grotesk';color:#2B2520;background:#FCFAF5")}
              />
            </div>
            <div>
              <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:6px")}>Área</label>
              <input
                value={projectForm.area}
                onChange={(e) => setProjectForm({ area: e.target.value })}
                placeholder="Ej. Producto, Finanzas…"
                style={css("width:100%;padding:12px 14px;border:1px solid #DDD3C2;border-radius:10px;font:500 14px 'Hanken Grotesk';color:#2B2520;background:#FCFAF5")}
              />
            </div>
            <div>
              <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:8px")}>Color identificador</label>
              <div style={css('display:flex;gap:10px;flex-wrap:wrap')}>
                {PALETTE.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => setProjectForm({ color: hex })}
                    style={css(`width:34px;height:34px;border-radius:9px;cursor:pointer;background:${hex};border:3px solid ${projectForm.color === hex ? '#2B2520' : 'transparent'};box-shadow:0 1px 3px rgba(43,37,32,.15)`)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label style={css("display:block;font:700 12px 'Hanken Grotesk';color:#2B2520;margin-bottom:6px")}>Notas / comentarios</label>
              <textarea
                value={projectForm.notes}
                onChange={(e) => setProjectForm({ notes: e.target.value })}
                rows={4}
                placeholder="Objetivo, contexto, quién lo pidió…"
                style={css("width:100%;padding:11px 14px;border:1px solid #DDD3C2;border-radius:10px;font:400 14px 'Hanken Grotesk';color:#2B2520;background:#FCFAF5;resize:vertical;line-height:1.5")}
              />
            </div>
            <div style={css('display:flex;gap:10px;border-top:1px solid #F0E8DA;padding-top:18px')}>
              <button
                onClick={() => submitProject()}
                style={css("padding:12px 22px;border:none;border-radius:11px;background:#C75D3C;color:#fff;font:700 14px 'Hanken Grotesk';cursor:pointer")}
              >
                Crear proyecto
              </button>
              <button
                onClick={() => setView('project')}
                style={css("padding:12px 22px;border:1px solid #DDD3C2;border-radius:11px;background:#fff;color:#6B6358;font:600 14px 'Hanken Grotesk';cursor:pointer")}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
