export type QuadKey = 'do' | 'schedule' | 'delegate' | 'eliminate'

export type ProjectStatus = 'active' | 'paused'

export interface Zone {
  x: number
  y: number
  w: number
  h: number
}

export interface Project {
  id: string
  name: string
  area: string
  color: string
  tint: string
  status: ProjectStatus
  notes: string
  zone: Zone
}

export interface Person {
  name: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  assignee: string
  importance: boolean
  urgent: boolean
  quadrant: QuadKey | null
  starred: boolean
  done: boolean
  firstThing: boolean
  ftOrder: number
  lastMoved: number
  x: number
  y: number
  eisOrder?: number
  desc?: string
  imageDataUrl?: string
}

export interface AppData {
  projects: Project[]
  people: Person[]
  tasks: Task[]
}

export type View =
  | 'whiteboard'
  | 'portfolio'
  | 'project'
  | 'eisenhower'
  | 'first'
  | 'capture'

export type TaskFilter = 'all' | 'mine' | 'delegated' | 'starred'
export type PortFilter = 'all' | 'active' | 'paused'
export type CaptureTab = 'task' | 'project'
