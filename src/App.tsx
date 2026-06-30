import { useState } from 'react'
import { useStore } from './store'
import { useIsMobile } from './useIsMobile'
import { css } from './logic'
import { Sidebar } from './components/Sidebar'
import { Alerts } from './components/Alerts'
import { Toast } from './components/Toast'
import { TaskEditPanel } from './components/TaskEditPanel'
import { Whiteboard } from './views/Whiteboard'
import { Portfolio } from './views/Portfolio'
import { ProjectDetail } from './views/ProjectDetail'
import { Eisenhower } from './views/Eisenhower'
import { FirstThing } from './views/FirstThing'
import { Capture } from './views/Capture'

export function App() {
  const s = useStore()
  const m = useIsMobile()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const shellStyle = m
    ? css("min-height:100vh;background:#EFE8DB;font-family:'Hanken Grotesk',sans-serif;padding-bottom:70px")
    : css("display:flex;min-height:100vh;background:#EFE8DB;font-family:'Hanken Grotesk',sans-serif")

  const mainStyle = m
    ? css('padding:20px 16px 28px')
    : { flex: 1, minWidth: 0, padding: '30px 36px 60px' }

  return (
    <div style={shellStyle}>
      <Sidebar
        isMobile={m}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Pill to re-show sidebar when collapsed */}
      {!m && sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          title="Mostrar menú"
          style={{
            position: 'fixed',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 200,
            width: 20,
            padding: '18px 0',
            background: '#fff',
            border: '1px solid #E3D9C8',
            borderLeft: 'none',
            borderRadius: '0 10px 10px 0',
            cursor: 'pointer',
            color: '#6B6358',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '2px 0 8px rgba(43,37,32,.08)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}

      <main style={mainStyle as React.CSSProperties}>
        <Alerts />
        {s.view === 'whiteboard' && <Whiteboard isMobile={m} />}
        {s.view === 'portfolio' && <Portfolio />}
        {s.view === 'project' && <ProjectDetail isMobile={m} />}
        {s.view === 'eisenhower' && <Eisenhower isMobile={m} />}
        {s.view === 'first' && <FirstThing />}
        {s.view === 'capture' && <Capture />}
      </main>
      <Toast />
      <TaskEditPanel />
    </div>
  )
}
