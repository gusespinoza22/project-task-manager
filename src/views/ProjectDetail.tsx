import { useStore } from '../store'
import { PALETTE, PROJECT_NAV, QMETA } from '../constants'
import { assigneeStyle, css, eff, hexTint, isStalled } from '../logic'

export function ProjectDetail({ isMobile }: { isMobile: boolean }) {
  const {
    data,
    selectedProjectId,
    setSelectedProject,
    projEditing,
    setProjEditing,
    updateProject,
    updateTask,
    startTaskForProject,
    setEditingTaskId,
  } = useStore()

  const sel = data.projects.find((p) => p.id === selectedProjectId) ?? data.projects[0]
  const selTasks = data.tasks.filter((t) => t.projectId === sel.id)
  const summary = {
    taskCount: selTasks.length,
    doneCount: selTasks.filter((t) => t.done).length,
    starredCount: selTasks.filter((t) => t.starred).length,
    stalledCount: selTasks.filter((t) => isStalled(t)).length,
  }

  const gridStyle = isMobile
    ? css('display:flex;flex-direction:column;gap:16px')
    : css('display:grid;grid-template-columns:1fr 280px;gap:20px;align-items:start')

  return (
    <section>
      {PROJECT_NAV === 'dropdown' ? (
        <div style={css('margin-bottom:18px')}>
          <label style={css("display:block;font:600 11px 'JetBrains Mono';letter-spacing:.5px;text-transform:uppercase;color:#A89B86;margin-bottom:7px")}>
            Proyecto
          </label>
          <div style={css('position:relative;display:inline-flex;align-items:center;max-width:100%')}>
            <span style={css(`position:absolute;left:14px;width:11px;height:11px;border-radius:50%;background:${sel.color};pointer-events:none`)} />
            <select
              value={sel.id}
              onChange={(e) => {
                setSelectedProject(e.target.value)
                setProjEditing(false)
              }}
              style={css("appearance:none;-webkit-appearance:none;min-width:300px;max-width:100%;padding:12px 40px 12px 34px;border:1px solid #DDD3C2;border-radius:11px;background:#fff;font:700 16px 'Hanken Grotesk';color:#2B2520;cursor:pointer")}
            >
              {data.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <svg style={css('position:absolute;right:14px;pointer-events:none')} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8C8275" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      ) : (
        <div style={css('display:flex;gap:9px;flex-wrap:wrap;margin-bottom:18px')}>
          {data.projects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedProject(p.id)
                setProjEditing(false)
              }}
              style={css(
                `display:inline-flex;align-items:center;gap:8px;padding:9px 15px;border-radius:11px;font:600 13.5px 'Hanken Grotesk';cursor:pointer;border:1px solid ${
                  p.id === sel.id ? '#2B2520' : '#E3D9C8'
                };background:${p.id === sel.id ? '#2B2520' : '#fff'};color:${
                  p.id === sel.id ? '#F4EEE4' : '#6B6358'
                }`,
              )}
            >
              <span style={css(`width:9px;height:9px;border-radius:50%;background:${p.color};display:inline-block`)} />
              {p.name}
            </button>
          ))}
        </div>
      )}

      <div style={gridStyle}>
        <div style={css('background:#fff;border:1px solid #ECE3D3;border-radius:16px;padding:22px 24px')}>
          <div style={css('display:flex;align-items:flex-start;justify-content:space-between;gap:12px')}>
            <div style={css('min-width:0')}>
              <div style={css(`font:600 11px 'JetBrains Mono';letter-spacing:.6px;text-transform:uppercase;color:${sel.color}`)}>
                {sel.area}
              </div>
              <h1 style={css("margin:5px 0 0;font:800 26px 'Hanken Grotesk';color:#2B2520;letter-spacing:-.5px")}>
                {sel.name}
              </h1>
            </div>
            <button
              onClick={() => setProjEditing((v) => !v)}
              style={css("flex-shrink:0;padding:8px 14px;border:1px solid #DDD3C2;border-radius:10px;background:#fff;color:#6B6358;font:600 13px 'Hanken Grotesk';cursor:pointer")}
            >
              {projEditing ? 'Listo' : 'Editar proyecto'}
            </button>
          </div>

          {projEditing ? (
            <div style={css('margin-top:18px;display:flex;flex-direction:column;gap:13px;padding:16px;background:#FAF6EE;border:1px solid #ECE3D3;border-radius:12px')}>
              <label style={css("font:600 12px 'Hanken Grotesk';color:#6B6358")}>
                Nombre
                <input
                  value={sel.name}
                  onChange={(e) => updateProject(sel.id, { name: e.target.value })}
                  style={css("margin-top:5px;width:100%;padding:9px 11px;border:1px solid #DDD3C2;border-radius:9px;font:500 14px 'Hanken Grotesk';color:#2B2520;background:#fff")}
                />
              </label>
              <label style={css("font:600 12px 'Hanken Grotesk';color:#6B6358")}>
                Área
                <input
                  value={sel.area}
                  onChange={(e) => updateProject(sel.id, { area: e.target.value })}
                  style={css("margin-top:5px;width:100%;padding:9px 11px;border:1px solid #DDD3C2;border-radius:9px;font:500 14px 'Hanken Grotesk';color:#2B2520;background:#fff")}
                />
              </label>
              <div>
                <div style={css("font:600 12px 'Hanken Grotesk';color:#6B6358;margin-bottom:8px")}>
                  Color identificador
                </div>
                <div style={css('display:flex;gap:8px;flex-wrap:wrap')}>
                  {PALETTE.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => updateProject(sel.id, { color: hex, tint: hexTint(hex) })}
                      style={css(
                        `width:30px;height:30px;border-radius:8px;cursor:pointer;background:${hex};border:3px solid ${
                          sel.color === hex ? '#2B2520' : 'transparent'
                        };box-shadow:0 1px 2px rgba(43,37,32,.15)`,
                      )}
                    />
                  ))}
                </div>
              </div>
              <label style={css("font:600 12px 'Hanken Grotesk';color:#6B6358")}>
                Notas / comentarios
                <textarea
                  value={sel.notes}
                  onChange={(e) => updateProject(sel.id, { notes: e.target.value })}
                  rows={4}
                  style={css("margin-top:5px;width:100%;padding:10px 11px;border:1px solid #DDD3C2;border-radius:9px;font:400 14px 'Hanken Grotesk';color:#2B2520;background:#fff;resize:vertical;line-height:1.5")}
                />
              </label>
              <button
                onClick={() => setProjEditing(false)}
                style={css("align-self:flex-start;padding:9px 18px;border:none;border-radius:10px;background:#2B2520;color:#F4EEE4;font:600 13px 'Hanken Grotesk';cursor:pointer")}
              >
                Guardar cambios
              </button>
            </div>
          ) : (
            <p style={css('margin:16px 0 0;font-size:15px;line-height:1.6;color:#5C544A;white-space:pre-wrap')}>
              {sel.notes}
            </p>
          )}

          <div style={css('margin-top:22px;border-top:1px solid #F0E8DA;padding-top:18px')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:12px')}>
              <h2 style={css("margin:0;font:700 16px 'Hanken Grotesk';color:#2B2520")}>Tareas del proyecto</h2>
              <span style={css("font:600 12px 'JetBrains Mono';color:#8C8275")}>
                {summary.doneCount}/{summary.taskCount} hechas
              </span>
            </div>
            <div style={css('display:flex;flex-direction:column;gap:9px')}>
              {selTasks.map((t) => {
                const q = QMETA[eff(t)]
                return (
                  <div
                    key={t.id}
                    style={{
                      ...css(
                        `display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:1px solid ${
                          t.starred && !t.done ? '#EFD9A6' : '#EFE6D6'
                        };border-radius:12px;background:${t.starred && !t.done ? '#FCF6E8' : '#FCFAF5'};transition:filter .2s,opacity .2s`,
                      ),
                      ...(t.done ? { filter: 'grayscale(1)', opacity: 0.55 } : {}),
                    }}
                  >
                    <button
                      onClick={() => updateTask(t.id, { done: !t.done, lastMoved: 0 })}
                      style={css(
                        `width:22px;height:22px;flex-shrink:0;margin-top:1px;border-radius:6px;border:1.5px solid ${
                          t.done ? '#2E7D6B' : '#CFC4B0'
                        };background:${t.done ? '#2E7D6B' : '#fff'};color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0`,
                      )}
                    >
                      {t.done && <span style={css('font-size:12px')}>✓</span>}
                    </button>
                    <div style={css('flex:1;min-width:0')}>
                      <div
                        onClick={() => setEditingTaskId(t.id)}
                        style={css(
                          `font:600 14.5px 'Hanken Grotesk';color:#2B2520;cursor:pointer;${
                            t.done ? 'text-decoration:line-through;color:#A89B86' : ''
                          }`,
                        )}
                        title="Clic para editar"
                      >
                        {t.title}
                      </div>
                      <div style={css('display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap')}>
                        <span style={css("display:inline-flex;align-items:center;gap:5px;font:500 11.5px 'Hanken Grotesk';color:#8C8275")}>
                          <span style={css(`width:7px;height:7px;border-radius:2px;background:${q.accent}`)} />
                          {q.label}
                        </span>
                        <span style={assigneeStyle(t.assignee)}>{t.assignee}</span>
                        {isStalled(t) && (
                          <span style={css("font:600 10.5px 'JetBrains Mono';color:#B08A4A")}>
                            ⏳ {t.lastMoved}d sin mover
                          </span>
                        )}
                      </div>
                      {t.desc && (
                        <p style={css('margin:6px 0 0;font-size:13px;color:#7A7060;line-height:1.5;white-space:pre-wrap')}>
                          {t.desc}
                        </p>
                      )}
                      {t.imageDataUrl && (
                        <img
                          src={t.imageDataUrl}
                          alt="Imagen adjunta"
                          style={css('margin-top:8px;max-width:100%;max-height:140px;object-fit:contain;border-radius:8px;border:1px solid #E7DECF;background:#FAF6EE;display:block')}
                        />
                      )}
                    </div>
                    <button
                      onClick={() => updateTask(t.id, { starred: !t.starred })}
                      style={css(
                        `flex-shrink:0;width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;font-size:15px;background:${
                          t.starred ? '#E0A82E' : '#F0E8DA'
                        };color:${t.starred ? '#fff' : '#C4B79F'}`,
                      )}
                    >
                      ★
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div style={css('display:flex;flex-direction:column;gap:14px')}>
          <div style={css('background:#fff;border:1px solid #ECE3D3;border-radius:16px;padding:18px 20px')}>
            <div style={css("font:600 11px 'JetBrains Mono';letter-spacing:.5px;text-transform:uppercase;color:#A89B86;margin-bottom:14px")}>
              Resumen
            </div>
            <div style={css('display:flex;flex-direction:column;gap:14px')}>
              <div style={css('display:flex;align-items:baseline;justify-content:space-between')}>
                <span style={css('font-size:14px;color:#6B6358')}>Tareas totales</span>
                <span style={css("font:800 22px 'Hanken Grotesk';color:#2B2520")}>{summary.taskCount}</span>
              </div>
              <div style={css('display:flex;align-items:baseline;justify-content:space-between')}>
                <span style={css('font-size:14px;color:#6B6358')}>Con estrella</span>
                <span style={css("font:800 22px 'Hanken Grotesk';color:#D99A1C")}>{summary.starredCount}</span>
              </div>
              <div style={css('display:flex;align-items:baseline;justify-content:space-between')}>
                <span style={css('font-size:14px;color:#6B6358')}>Estancadas</span>
                <span style={css("font:800 22px 'Hanken Grotesk';color:#B08A4A")}>{summary.stalledCount}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => startTaskForProject(sel.id)}
            style={css("padding:13px;border:1.5px dashed #D5C9B5;border-radius:14px;background:#FAF6EE;color:#6B6358;font:600 14px 'Hanken Grotesk';cursor:pointer")}
          >
            + Agregar tarea a este proyecto
          </button>
        </div>
      </div>
    </section>
  )
}
