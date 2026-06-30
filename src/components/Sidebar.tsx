import type { ReactNode } from 'react'
import { useStore } from '../store'
import { css } from '../logic'
import type { View } from '../types'
import { SaveButton } from './SaveButton'

interface NavItem {
  view: View
  label: string
  icon: ReactNode
}

const ICON = {
  stroke: { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' },
} as const

const NAV: NavItem[] = [
  {
    view: 'whiteboard',
    label: 'Pizarra',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ICON.stroke}>
        <rect x="3" y="4" width="18" height="15" rx="2" />
        <rect x="6" y="7.5" width="6" height="4" rx="1" />
        <line x1="14.5" y1="9" x2="18" y2="9" />
        <line x1="14.5" y1="13" x2="18" y2="13" />
      </svg>
    ),
  },
  {
    view: 'portfolio',
    label: 'Cartera',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ICON.stroke}>
        <line x1="5" y1="20" x2="5" y2="13" />
        <line x1="12" y1="20" x2="12" y2="8" />
        <line x1="19" y1="20" x2="19" y2="4" />
      </svg>
    ),
  },
  {
    view: 'project',
    label: 'Proyecto',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ICON.stroke}>
        <rect x="4" y="3.5" width="16" height="17" rx="2" />
        <line x1="8" y1="8" x2="16" y2="8" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="8" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
  {
    view: 'eisenhower',
    label: 'Prioridades',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ICON.stroke}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
      </svg>
    ),
  },
  {
    view: 'first',
    label: 'Primero',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ICON.stroke}>
        <circle cx="12" cy="13" r="4.2" />
        <line x1="12" y1="3.5" x2="12" y2="6" />
        <line x1="4.5" y1="20" x2="19.5" y2="20" />
        <line x1="5.2" y1="6.2" x2="6.8" y2="7.8" />
        <line x1="18.8" y1="6.2" x2="17.2" y2="7.8" />
      </svg>
    ),
  },
  {
    view: 'capture',
    label: 'Capturar',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ICON.stroke}>
        <circle cx="12" cy="12" r="8.4" />
        <line x1="12" y1="8.5" x2="12" y2="15.5" />
        <line x1="8.5" y1="12" x2="15.5" y2="12" />
      </svg>
    ),
  },
]

interface SidebarProps {
  isMobile: boolean
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ isMobile, collapsed = false, onToggle }: SidebarProps) {
  const s = useStore()

  if (isMobile) {
    return (
      <>
        <aside style={css('position:fixed;bottom:0;left:0;right:0;height:64px;background:#fff;border-top:1px solid #E3D9C8;display:flex;align-items:center;padding:0 8px;z-index:100')}>
          <nav style={css('display:flex;width:100%;gap:2px')}>
            {NAV.map((item) => (
              <button
                key={item.view}
                onClick={() => s.setView(item.view)}
                style={css(`display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;padding:7px 2px;border:none;background:transparent;cursor:pointer;color:${
                  s.view === item.view ? '#C75D3C' : '#9A9084'
                };border-radius:9px`)}
              >
                {item.icon}
                <span style={css("font:600 10px 'Hanken Grotesk'")}>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>
        <SaveButton floating />
      </>
    )
  }

  // Desktop sidebar with collapse support
  const sidebarW = collapsed ? 0 : 230

  return (
    <aside
      style={{
        width: sidebarW,
        flexShrink: 0,
        background: '#fff',
        borderRight: collapsed ? 'none' : '1px solid #E3D9C8',
        position: 'sticky',
        top: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.22s ease, border-color 0.22s ease',
        boxSizing: 'border-box',
      }}
    >
      {/* Sidebar inner — fixed width so content doesn't wrap during animation */}
      <div style={{ width: 230, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={css('display:flex;align-items:center;justify-content:space-between;gap:8px;padding:22px 16px 18px;border-bottom:1px solid #F0E8DA;flex-shrink:0')}>
          <div style={css('display:flex;align-items:center;gap:10px;min-width:0')}>
            <div style={css('width:30px;height:30px;flex-shrink:0;border-radius:9px;background:#2B2520;display:flex;align-items:center;justify-content:center;color:#E0A82E;font-size:17px')}>
              ★
            </div>
            <span style={css("font:800 19px 'Hanken Grotesk';color:#2B2520;letter-spacing:-.4px;white-space:nowrap")}>
              Proyectos
            </span>
          </div>
          {onToggle && (
            <button
              onClick={onToggle}
              title="Ocultar menú"
              style={{
                flexShrink: 0,
                width: 28,
                height: 28,
                border: '1px solid #E3D9C8',
                borderRadius: 8,
                background: '#FAF6EE',
                color: '#8C8275',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={css('display:flex;flex-direction:column;gap:4px;padding:14px 12px 0;flex:1;overflow-y:auto')}>
          {NAV.map((item) => {
            const active = s.view === item.view
            return (
              <button
                key={item.view}
                onClick={() => s.setView(item.view)}
                style={css(`display:flex;align-items:center;gap:11px;width:100%;padding:10px 13px;border:none;border-radius:11px;font:600 14.5px 'Hanken Grotesk';cursor:pointer;text-align:left;white-space:nowrap;background:${
                  active ? '#2B2520' : 'transparent'
                };color:${active ? '#F4EEE4' : '#6B6358'}`)}
              >
                {item.icon}
                <span style={{ font: 'inherit' }}>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={css('padding:16px 12px;border-top:1px solid #F0E8DA;flex-shrink:0')}>
          <SaveButton />
        </div>
      </div>
    </aside>
  )
}
