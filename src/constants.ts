import type { QuadKey } from './types'

export interface QuadMeta {
  label: string
  sub: string
  bg: string
  accent: string
}

export const QMETA: Record<QuadKey, QuadMeta> = {
  do: { label: 'Hacer', sub: 'Importante · Urgente', bg: '#FBEDE6', accent: '#C0492B' },
  schedule: { label: 'Programar', sub: 'Importante · No urgente', bg: '#E7F1EC', accent: '#2E7D6B' },
  delegate: { label: 'Delegar', sub: 'Urgente · No importante', bg: '#FAF1DC', accent: '#B8841C' },
  eliminate: { label: 'Eliminar', sub: 'Ni urgente ni importante', bg: '#F1EDE4', accent: '#8C8275' },
}

export const PALETTE = [
  '#C75D3C', '#B5482E', '#CB6A4B', '#A24A3E', '#C75A5A', '#B5546E',
  '#9B5D76', '#7A4B8E', '#6B4E9E', '#4A4E9C', '#355E8D', '#3E6FA3',
  '#2C6E57', '#2E7D6B', '#4F7A3A', '#6E8B4A', '#A8870F', '#B8841C',
  '#D99A1C', '#B89B6A', '#8C7B66', '#7A5240', '#5E6B72', '#3F3A36',
]

export const STAR_THRESHOLD = 4
export const STALL_THRESHOLD = 14

/** Whether the project view shows a dropdown selector or a tab strip. */
export const PROJECT_NAV: 'dropdown' | 'tabs' = 'dropdown'

export const QUAD_ORDER: QuadKey[] = ['do', 'schedule', 'delegate', 'eliminate']

// Whiteboard card / zone geometry
export const TASK_CARD_W = 212
export const TASK_CARD_H = 130   // conservative estimate (title + meta + padding)
export const ZONE_HEADER_H = 52  // height reserved for the zone tag at the top
export const ZONE_MARGIN = 12    // inner padding between zone edge and card
export const MIN_ZONE_W = 280    // minimum zone width
export const MIN_ZONE_H = 220    // minimum zone height
