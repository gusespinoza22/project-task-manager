import { useEffect, useRef } from 'react'
import { css } from '../logic'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

function ToolBtn({
  title,
  onActivate,
  children,
}: {
  title: string
  onActivate: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault() // keep focus on contenteditable
        onActivate()
      }}
      style={css(
        "min-width:28px;height:26px;padding:0 6px;border:1px solid #DDD3C2;border-radius:6px;background:#fff;cursor:pointer;font:600 13px 'Hanken Grotesk';color:#5C544A;display:inline-flex;align-items:center;justify-content:center;gap:2px",
      )}
    >
      {children}
    </button>
  )
}

/** Strip tags + nbsp to check true emptiness */
function isHtmlEmpty(html: string) {
  return !html || html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim() === ''
}

export function RichEditor({
  value,
  onChange,
  placeholder = 'Detalles, contexto…',
  minHeight = 140,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const focusedRef = useRef(false)

  // On mount: tell the browser to use <br> for Enter (not <div>).
  // This makes the stored HTML consistent across Chrome / Firefox / Safari.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand('defaultParagraphSeparator', false, 'br')
  }, [])

  // Sync value into DOM only when the field is not focused (external/initial load)
  useEffect(() => {
    const el = editorRef.current
    if (!el || focusedRef.current) return
    if (el.innerHTML !== value) {
      el.innerHTML = value
    }
  }, [value])

  const exec = (cmd: string, arg?: string) => {
    editorRef.current?.focus()
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand(cmd, false, arg)
    onChange(editorRef.current?.innerHTML ?? '')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const mod = e.metaKey || e.ctrlKey

    if (mod && e.key === 'b') { e.preventDefault(); exec('bold'); return }
    if (mod && e.key === 'i') { e.preventDefault(); exec('italic'); return }
    if (mod && e.key === 'u') { e.preventDefault(); exec('underline'); return }

    // Normalise Enter → <br> outside of lists so the HTML is always <br>-based
    // (inside lists the browser creates <li> items — let it do that naturally)
    if (e.key === 'Enter' && !mod && !e.shiftKey) {
      const sel = window.getSelection()
      const inList = sel?.anchorNode?.parentElement?.closest('ul, ol')
      if (!inList) {
        e.preventDefault()
        // insertHTML puts a <br> at the caret. We add a zero-width space after so
        // the cursor visually lands on the new line when pressing Enter at end-of-content.
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        document.execCommand('insertHTML', false, '<br>​')
        onChange(editorRef.current?.innerHTML ?? '')
      }
    }
  }

  const empty = isHtmlEmpty(value)

  return (
    <div>
      {/* Toolbar */}
      <div style={css('display:flex;align-items:center;gap:3px;padding:5px 8px;background:#F6F1E9;border:1px solid #DDD3C2;border-bottom:none;border-radius:10px 10px 0 0')}>
        <ToolBtn title="Negrita (⌘B)" onActivate={() => exec('bold')}>
          <strong>B</strong>
        </ToolBtn>
        <ToolBtn title="Itálica (⌘I)" onActivate={() => exec('italic')}>
          <em style={{ fontStyle: 'italic' }}>I</em>
        </ToolBtn>
        <ToolBtn title="Subrayado (⌘U)" onActivate={() => exec('underline')}>
          <u>U</u>
        </ToolBtn>

        <div style={css('width:1px;height:18px;background:#DDD3C2;margin:0 3px;flex-shrink:0')} />

        {/* Unordered list */}
        <ToolBtn title="Lista con viñetas" onActivate={() => exec('insertUnorderedList')}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="2.5" cy="4"  r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="2.5" cy="8"  r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="2.5" cy="12" r="1.2" fill="currentColor" stroke="none"/>
            <line x1="6" y1="4"  x2="15" y2="4"/>
            <line x1="6" y1="8"  x2="15" y2="8"/>
            <line x1="6" y1="12" x2="15" y2="12"/>
          </svg>
        </ToolBtn>

        {/* Ordered list */}
        <ToolBtn title="Lista numerada" onActivate={() => exec('insertOrderedList')}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" stroke="none">
            <text x="0" y="5.5"  style={{ fontSize: '5.5px', fontWeight: 700, fontFamily: 'monospace' }}>1.</text>
            <text x="0" y="10"   style={{ fontSize: '5.5px', fontWeight: 700, fontFamily: 'monospace' }}>2.</text>
            <text x="0" y="14.5" style={{ fontSize: '5.5px', fontWeight: 700, fontFamily: 'monospace' }}>3.</text>
            <line x1="7" y1="4"    x2="16" y2="4"    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            <line x1="7" y1="8.5"  x2="16" y2="8.5"  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            <line x1="7" y1="13"   x2="16" y2="13"   stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </ToolBtn>

        <div style={css('width:1px;height:18px;background:#DDD3C2;margin:0 3px;flex-shrink:0')} />

        <ToolBtn title="Quitar formato" onActivate={() => exec('removeFormat')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7V4h16v3"/>
            <path d="M9 20h6"/>
            <path d="M12 4v16"/>
            <line x1="18" y1="18" x2="6" y2="6"/>
          </svg>
        </ToolBtn>

        <span style={css("margin-left:auto;font:500 11px 'JetBrains Mono';color:#BDB5A8;user-select:none")}>
          ⌘B · ⌘I · ⌘U
        </span>
      </div>

      {/* Editable area */}
      <div style={{ position: 'relative' }}>
        {empty && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 14,
              font: "400 14px/1.6 'Hanken Grotesk'",
              color: '#C4B89E',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="rich-editor"
          onKeyDown={handleKeyDown}
          onInput={() => onChange(editorRef.current?.innerHTML ?? '')}
          onFocus={() => { focusedRef.current = true }}
          onBlur={() => { focusedRef.current = false }}
          style={{
            minHeight,
            maxHeight: 480,
            padding: '11px 14px',
            border: '1px solid #DDD3C2',
            borderRadius: '0 0 10px 10px',
            background: '#FCFAF5',
            font: "400 14px/1.65 'Hanken Grotesk'",
            color: '#2B2520',
            outline: 'none',
            overflowY: 'auto',
            boxSizing: 'border-box',
            wordBreak: 'break-word',
          }}
        />
      </div>
    </div>
  )
}
