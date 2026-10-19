/**
 * Skill panel body: fetch the skill list from the host route and render it.
 * Click a row to copy /skill-name.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'

interface Skill { name: string; title: string; summary: string; tag: string }

interface Payload {
  skills?: Skill[]
  scannedAt?: number
  errors?: string[]
}

const TAG_COLOR: Record<string, string> = {
  '\u5d4c\u5165\u5f0f': '#4d6bfe',
  '\u8bbe\u8ba1': '#c4629a',
  '\u5199\u4f5c': '#b8862f',
  '\u5f00\u53d1\u6d41\u7a0b': '#3a8f5f',
  '\u529e\u516c\u79d1\u7814': '#7a5cc4',
  '\u5de5\u5177': '#5d7d8a',
  '\u534f\u4f5c': '#a0603c',
}

const T_ALL = '\u5168\u90e8'
const T_LOADING = '\u8bfb\u53d6\u4e2d...'
const T_SEARCH = '\u641c\u7d22'
const T_EMPTY = '\u6ca1\u6709\u53ef\u7528\u7684\u6280\u80fd'
const T_NOMATCH = '\u6ca1\u6709\u5339\u914d\u7684\u6280\u80fd'
const T_COPIED = '\u5df2\u63d2\u5165'
const T_REFRESH = '\u5237\u65b0'
const T_CLICK_HINT = '\u70b9\u51fb\u5f15\u7528'

function fallbackCopy(text: string, done: () => void): void {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    done()
  } catch {
    /* ignore */
  }
}

/**
 * Insert /skill-name into the DSH composer (Lexical contenteditable).
 * Uses execCommand('insertText') so Lexical's beforeinput handler sees it.
 * Returns false when no composer is on screen (caller falls back to copying).
 */
function composerRoot(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.querySelector('[contenteditable="true"][data-lexical-editor]') as HTMLElement | null
}

/**
 * Move the caret to the very end of the composer without selecting anything,
 * so a second insert APPENDS instead of replacing what is already typed.
 */
function caretToEnd(root: HTMLElement): void {
  const sel = window.getSelection()
  if (sel === null) return
  const range = document.createRange()
  range.selectNodeContents(root)
  range.collapse(false)          // false = collapse to END
  sel.removeAllRanges()
  sel.addRange(range)
}

/**
 * Insert /skill-name into the DSH composer (Lexical contenteditable).
 * Uses execCommand('insertText') so Lexical's beforeinput handler sees it.
 * Falls back to copying when no composer is on screen.
 */
function insertToComposer(text: string): boolean {
  const root = composerRoot()
  if (root === null) return false
  try {
    root.focus()
    caretToEnd(root)
    return document.execCommand('insertText', false, text + ' ')
  } catch {
    return false
  }
}

export function SkillView() {
  const [skills, setSkills] = useState<Skill[] | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('')
  const [copied, setCopied] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async (force: boolean) => {
    setBusy(true)
    try {
      const base = typeof document !== 'undefined' && document.baseURI ? document.baseURI : 'http://localhost/'
      const rel = force ? 'skill-panel/skills?refresh=1' : 'skill-panel/skills'
      const res = await fetch(new URL(rel, base).href, { credentials: 'same-origin' })
      const data = (await res.json()) as Payload
      setSkills(Array.isArray(data.skills) ? data.skills : [])
      setErrors(Array.isArray(data.errors) ? data.errors : [])
      setError('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    void load(false)
  }, [load])

  const list = skills ?? []

  const tags = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of list) m.set(s.tag, (m.get(s.tag) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [list])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return list.filter((s) => {
      if (tag && s.tag !== tag) return false
      if (!q) return true
      return (s.name + ' ' + s.title + ' ' + s.summary + ' ' + s.tag).toLowerCase().includes(q)
    })
  }, [list, query, tag])

  const copy = (name: string) => {
    const text = '/' + name
    const done = () => {
      setCopied(name)
      window.setTimeout(() => setCopied(''), 1200)
    }
    if (insertToComposer(text)) {
      done()
      return
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done))
    } else {
      fallbackCopy(text, done)
    }
  }

  return (
    <div className="dsh-sp-root">
      <div className="dsh-sp-bar">
        <div className="dsh-sp-searchrow">
          <input
            className="dsh-sp-input"
            placeholder={skills === null ? T_LOADING : T_SEARCH + ' (' + list.length + ')'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="dsh-sp-refresh"
            title={T_REFRESH}
            disabled={busy}
            onClick={() => void load(true)}
          >
            {'\u21bb'}
          </button>
        </div>
        {tags.length > 0 && (
          <div className="dsh-sp-chips">
            <button type="button" className={'dsh-sp-chip' + (tag === '' ? ' is-on' : '')} onClick={() => setTag('')}>{T_ALL}</button>
            {tags.map(([t, n]) => (
              <button
                key={t}
                type="button"
                className={'dsh-sp-chip' + (tag === t ? ' is-on' : '')}
                onClick={() => setTag(tag === t ? '' : t)}
              >
                {t} {n}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="dsh-sp-list">
        {shown.map((s) => (
          <div
            key={s.name}
            className="dsh-sp-row"
            role="button"
            tabIndex={0}
            title={T_CLICK_HINT + ' /' + s.name}
            onClick={() => copy(s.name)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                copy(s.name)
              }
            }}
          >
            <div className="dsh-sp-head">
              <span className="dsh-sp-dot" style={{ background: TAG_COLOR[s.tag] ?? '#888' }} />
              <strong className="dsh-sp-title">{s.title}</strong>
              <span className="dsh-sp-tag">{s.tag}</span>
            </div>
            {s.summary !== '' && <div className="dsh-sp-summary">{s.summary}</div>}
            <div className="dsh-sp-name">
              {s.name}
              {copied === s.name ? '  ' + T_COPIED : ''}
            </div>
          </div>
        ))}
        {skills !== null && shown.length === 0 && (
          <div className="dsh-sp-empty">{list.length === 0 ? T_EMPTY : T_NOMATCH}</div>
        )}
        {error !== '' && <div className="dsh-sp-error">{error}</div>}
        {errors.length > 0 && (
          <div className="dsh-sp-errors">{errors.join('; ')}</div>
        )}
      </div>
    </div>
  )
}
