import type { CSSProperties } from 'react'
import type { QuadKey, Task } from './types'
import { STALL_THRESHOLD } from './constants'

/**
 * Parse a CSS declaration string into a React style object. Lets us reuse the
 * exact style strings from the original Claude Design prototype for fidelity.
 */
export function css(str: string): CSSProperties {
  const out: Record<string, string> = {}
  for (const decl of str.split(';')) {
    const i = decl.indexOf(':')
    if (i === -1) continue
    const prop = decl.slice(0, i).trim()
    const val = decl.slice(i + 1).trim()
    if (!prop) continue
    const key = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
    out[key] = val
  }
  return out as CSSProperties
}

export function suggest(t: Task): QuadKey {
  if (t.importance && t.urgent) return 'do'
  if (t.importance) return 'schedule'
  if (t.urgent) return 'delegate'
  return 'eliminate'
}

/** Effective quadrant: explicit classification or the rule-based suggestion. */
export function eff(t: Task): QuadKey {
  return t.quadrant || suggest(t)
}

export function isStalled(t: Task): boolean {
  return !t.done && t.lastMoved >= STALL_THRESHOLD
}

/** Monday 00:00 (local time) of the week containing `ts`. */
export function weekStart(ts: number): Date {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0=Sun .. 6=Sat
  const diffToMonday = (day + 6) % 7 // Mon->0, Tue->1, ..., Sun->6
  d.setDate(d.getDate() - diffToMonday)
  return d
}

/** Stable key identifying a Monday–Sunday week (the Monday's date, YYYY-MM-DD). */
export function weekKey(ts: number): string {
  return weekStart(ts).toISOString().slice(0, 10)
}

/** Human label for the Monday–Sunday week containing `ts`, e.g. "6 – 12 jul". */
export function weekLabel(ts: number): string {
  const start = weekStart(ts)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  return `${fmt(start)} – ${fmt(end)}`
}

export function isThisWeek(ts: number): boolean {
  return weekKey(ts) === weekKey(Date.now())
}

export function hexTint(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const m = (c: number) => Math.round(c + (255 - c) * 0.86)
  return '#' + [m(r), m(g), m(b)].map((c) => c.toString(16).padStart(2, '0')).join('')
}

/** Assigns baseline eisOrder per effective quadrant for tasks that lack one. */
export function withEisOrder(tasks: Task[]): Task[] {
  const byQ: Record<string, number> = {}
  return tasks.map((t) => {
    const q = eff(t)
    if (byQ[q] == null) byQ[q] = 0
    return t.eisOrder != null ? t : { ...t, eisOrder: byQ[q]++ }
  })
}

// ----- shared inline-style helpers (mirror the prototype) -----

export function assigneeStyle(name: string): CSSProperties {
  const mine = name === 'Yo'
  return css(
    `display:inline-block;font:600 11px 'JetBrains Mono';padding:2px 8px;border-radius:6px;${
      mine ? 'background:#2B2520;color:#F4EEE4' : 'background:#EFE7D8;color:#7A7060'
    }`,
  )
}

export function chip(col: string, tint: string): CSSProperties {
  return css(
    `display:inline-block;font:600 10.5px 'JetBrains Mono';letter-spacing:.3px;padding:2px 8px;border-radius:6px;background:${tint};color:${col};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px`,
  )
}

export function starBadge(): CSSProperties {
  return css(
    `width:22px;height:22px;border-radius:6px;background:#E0A82E;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;box-shadow:0 1px 4px rgba(217,154,28,.5);transform:rotate(-8deg);animation:stampIn .4s ease`,
  )
}
