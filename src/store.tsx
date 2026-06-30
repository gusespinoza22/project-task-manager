import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppData,
  CaptureTab,
  PortFilter,
  Project,
  Task,
  TaskFilter,
  View,
} from './types'
import { PALETTE, TASK_CARD_H, TASK_CARD_W, ZONE_HEADER_H, ZONE_MARGIN } from './constants'
import { hexTint, withEisOrder } from './logic'
import { SEED } from './seed'

const LS_KEY = 'gestor:data:v1'

export interface TaskForm {
  title: string
  projectId: string
  assignee: string
  desc: string
  imageDataUrl: string
  imp: '' | 'high' | 'low'
  urg: '' | 'high' | 'low'
  star: boolean
}

export interface ProjectForm {
  name: string
  area: string
  notes: string
  color: string
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface Store {
  data: AppData
  view: View
  selectedProjectId: string
  filter: TaskFilter
  portFilter: PortFilter
  captureTab: CaptureTab
  projEditing: boolean
  toast: string | null
  dirty: boolean
  saveState: SaveState

  taskForm: TaskForm
  projectForm: ProjectForm
  editingTaskId: string | null

  setView: (v: View) => void
  setSelectedProject: (id: string) => void
  setFilter: (f: TaskFilter) => void
  setPortFilter: (f: PortFilter) => void
  setCaptureTab: (t: CaptureTab) => void
  setProjEditing: (v: boolean | ((p: boolean) => boolean)) => void
  setEditingTaskId: (id: string | null) => void

  updateData: (updater: (d: AppData) => AppData) => void
  updateTask: (id: string, patch: Partial<Task>) => void
  updateProject: (id: string, patch: Partial<Project>) => void
  flash: (msg: string) => void

  setTaskForm: (patch: Partial<TaskForm>) => void
  setProjectForm: (patch: Partial<ProjectForm>) => void
  submitTask: () => void
  submitProject: () => void
  startTaskForProject: (projectId: string) => void

  save: () => Promise<void>
}

const StoreContext = createContext<Store | null>(null)

function loadFromStorage(): AppData | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppData
    if (!parsed.projects || !parsed.tasks) return null
    return parsed
  } catch {
    return null
  }
}

function emptyTaskForm(projectId: string): TaskForm {
  return { title: '', projectId, assignee: '', desc: '', imageDataUrl: '', imp: '', urg: '', star: false }
}
function emptyProjectForm(): ProjectForm {
  return { name: '', area: '', notes: '', color: PALETTE[0] }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const stored = useRef<AppData | null>(loadFromStorage())
  const [data, setData] = useState<AppData>(() =>
    stored.current
      ? { ...stored.current, tasks: withEisOrder(stored.current.tasks) }
      : { ...SEED, tasks: withEisOrder(SEED.tasks) },
  )
  const [view, setView] = useState<View>('whiteboard')
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    () => (stored.current ?? SEED).projects[0]?.id ?? 'p1',
  )
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [portFilter, setPortFilter] = useState<PortFilter>('all')
  const [captureTab, setCaptureTab] = useState<CaptureTab>('task')
  const [projEditing, setProjEditing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const [taskForm, setTaskFormState] = useState<TaskForm>(() =>
    emptyTaskForm(selectedProjectId),
  )
  const [projectForm, setProjectFormState] = useState<ProjectForm>(emptyProjectForm)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  const toastTimer = useRef<number | undefined>(undefined)
  const saveTimer = useRef<number | undefined>(undefined)
  // Serialized snapshot of the last committed state — used to decide whether
  // there are unsaved changes (robust to React StrictMode double-mounting).
  const lastSavedJson = useRef<string>(JSON.stringify(data))

  // If localStorage was empty, hydrate from the persisted data.json file.
  useEffect(() => {
    if (stored.current) return
    let cancelled = false
    fetch('/data.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no file'))))
      .then((d: AppData) => {
        if (cancelled) return
        const loaded: AppData = { ...d, tasks: withEisOrder(d.tasks) }
        lastSavedJson.current = JSON.stringify(loaded)
        setData(loaded)
        setSelectedProjectId((cur) => (d.projects.some((p) => p.id === cur) ? cur : d.projects[0]?.id ?? cur))
      })
      .catch(() => {
        /* keep seed defaults */
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Autosave the working draft to localStorage on every data change, and flag
  // dirty only when the state actually differs from the last committed one.
  useEffect(() => {
    const json = JSON.stringify(data)
    try {
      localStorage.setItem(LS_KEY, json)
    } catch {
      /* quota / private mode — ignore */
    }
    setDirty(json !== lastSavedJson.current)
  }, [data])

  const flash = useCallback((msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }, [])

  const updateData = useCallback((updater: (d: AppData) => AppData) => {
    setData((d) => updater(d))
  }, [])

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  }, [])

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setData((d) => ({
      ...d,
      projects: d.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }))
  }, [])

  const setTaskForm = useCallback((patch: Partial<TaskForm>) => {
    setTaskFormState((f) => ({ ...f, ...patch }))
  }, [])
  const setProjectForm = useCallback((patch: Partial<ProjectForm>) => {
    setProjectFormState((f) => ({ ...f, ...patch }))
  }, [])

  const startTaskForProject = useCallback((projectId: string) => {
    setTaskFormState((f) => ({ ...f, projectId }))
    setCaptureTab('task')
    setView('capture')
  }, [])

  const submitTask = useCallback(() => {
    setTaskFormState((f) => {
      if (!f.title.trim() || !f.assignee.trim()) {
        flash('Faltan campos obligatorios')
        return f
      }
      const imp = f.imp === 'high'
      const urg = f.urg === 'high'
      const hasPri = f.imp !== '' && f.urg !== ''
      const id = 't' + Date.now()
      setData((d) => {
        const proj = d.projects.find((p) => p.id === f.projectId) ?? d.projects[0]
        const z = proj.zone

        // Grid placement: fill left-to-right, top-to-bottom within the zone
        const existingInZone = d.tasks.filter((t) => t.projectId === proj.id)
        const cols = Math.max(1, Math.floor((z.w - ZONE_MARGIN) / (TASK_CARD_W + ZONE_MARGIN)))
        const idx = existingInZone.length
        const col = idx % cols
        const row = Math.floor(idx / cols)
        const newTaskX = z.x + ZONE_MARGIN + col * (TASK_CARD_W + ZONE_MARGIN)
        const newTaskY = z.y + ZONE_HEADER_H + ZONE_MARGIN + row * (TASK_CARD_H + ZONE_MARGIN)

        // Auto-expand zone height so the new task is always visible
        const neededH = ZONE_HEADER_H + ZONE_MARGIN + (row + 1) * (TASK_CARD_H + ZONE_MARGIN)
        const newZoneH = Math.max(z.h, neededH)

        const people = d.people.some(
          (p) => p.name.toLowerCase() === f.assignee.trim().toLowerCase(),
        )
          ? d.people
          : [...d.people, { name: f.assignee.trim() }]

        const newTask: Task = {
          id,
          projectId: f.projectId,
          title: f.title.trim(),
          assignee: f.assignee.trim(),
          importance: imp,
          urgent: urg,
          quadrant: hasPri ? (imp && urg ? 'do' : imp ? 'schedule' : urg ? 'delegate' : 'eliminate') : null,
          starred: f.star,
          done: false,
          firstThing: false,
          ftOrder: 0,
          lastMoved: 0,
          x: newTaskX,
          y: newTaskY,
          desc: f.desc.trim() || undefined,
          imageDataUrl: f.imageDataUrl || undefined,
        }

        const projects =
          newZoneH > z.h
            ? d.projects.map((p) =>
                p.id === proj.id ? { ...p, zone: { ...p.zone, h: newZoneH } } : p,
              )
            : d.projects

        return { ...d, projects, tasks: [newTask, ...d.tasks], people }
      })
      setView('whiteboard')
      flash('Tarea creada')
      return emptyTaskForm(f.projectId)
    })
  }, [flash])

  const submitProject = useCallback(() => {
    setProjectFormState((f) => {
      if (!f.name.trim()) {
        flash('Falta el nombre')
        return f
      }
      const id = 'p' + Date.now()
      const tint = hexTint(f.color)
      setData((d) => {
        const newProject: Project = {
          id,
          name: f.name.trim(),
          area: f.area.trim() || 'Sin área',
          color: f.color,
          tint,
          status: 'active',
          notes: f.notes.trim(),
          zone: { x: 40, y: 40 + d.projects.length * 40, w: 400, h: 330 },
        }
        return { ...d, projects: [...d.projects, newProject] }
      })
      setSelectedProjectId(id)
      setView('project')
      flash('Proyecto creado')
      return emptyProjectForm()
    })
  }, [flash])

  const save = useCallback(async () => {
    setSaveState('saving')
    const payload = JSON.stringify(data, null, 2)
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })
      if (!res.ok) throw new Error('bad status ' + res.status)
      lastSavedJson.current = JSON.stringify(data)
      setDirty(false)
      setSaveState('saved')
      flash('Cambios guardados en data.json')
      window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      // Fallback: download the JSON so the user can place it manually.
      try {
        const blob = new Blob([payload], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'data.json'
        a.click()
        URL.revokeObjectURL(url)
        lastSavedJson.current = JSON.stringify(data)
        setDirty(false)
        setSaveState('saved')
        flash('Servidor no disponible — se descargó data.json')
        window.clearTimeout(saveTimer.current)
        saveTimer.current = window.setTimeout(() => setSaveState('idle'), 2000)
      } catch {
        setSaveState('error')
        flash('No se pudo guardar')
      }
    }
  }, [data, flash])

  const value = useMemo<Store>(
    () => ({
      data,
      view,
      selectedProjectId,
      filter,
      portFilter,
      captureTab,
      projEditing,
      toast,
      dirty,
      saveState,
      taskForm,
      projectForm,
      editingTaskId,
      setEditingTaskId,
      setView: (v) => {
        setView(v)
        window.scrollTo(0, 0)
      },
      setSelectedProject: setSelectedProjectId,
      setFilter,
      setPortFilter,
      setCaptureTab,
      setProjEditing,
      updateData,
      updateTask,
      updateProject,
      flash,
      setTaskForm,
      setProjectForm,
      submitTask,
      submitProject,
      startTaskForProject,
      save,
    }),
    [
      data, view, selectedProjectId, filter, portFilter, captureTab, projEditing,
      toast, dirty, saveState, taskForm, projectForm, editingTaskId, updateData,
      updateTask, updateProject, flash, setTaskForm, setProjectForm, submitTask,
      submitProject, startTaskForProject, save,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
