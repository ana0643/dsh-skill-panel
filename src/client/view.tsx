
/** Skill panel body. */
import { useEffect, useMemo, useState } from 'react'

interface Skill { name: string; title: string; summary: string; tag: string }

const TAG_COLOR: Record<string, string> = {
  '嵌入式': '#4d6bfe',
  '设计': '#c4629a',
  '写作': '#b8862f',
  '开发流程': '#3a8f5f',
  '办公科研': '#7a5cc4',
  '工具': '#5d7d8a',
  '协作': '#a0603c',
}

const T_ALL = '全部'
const T_LOADING = '读取中...'
const T_SEARCH = '搜索'
const T_EMPTY = '没有可用的技能'
const COPIED = '已复制'

function fallbackCopy(text: string, done: () => void) {
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

const T_NOMATCH = '没有匹配的技能'

export function SkillView() {
  const [skills, setSkills] = useState<Skill[] | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    let alive = true
    const base = typeof document !== 'undefined' && document.baseURI ? document.baseURI : 'http://localhost/'
    fetch(new URL('skill-panel/skills', base).href, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d: { skills?: Skill[] }) => { if (alive) setSkills(Array.isArray(d.skills) ? d.skills : []) })
      .catch((e: unknown) => { if (alive) setError(e instanceof Error ? e.message : String(e)) })
    return () => { alive = false }
  }, [])

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
    const done = () => { setCopied(name); window.setTimeout(() => setCopied(''), 1200) }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done))
    } else {
      fallbackCopy(text, done)
    }
  }

  return (
    <div className="dsh-sp-root">
      <div className="dsh-sp-bar">
        <input
          className="dsh-sp-input"
          placeholder={skills === null ? T_LOADING : T_SEARCH + ' ' + list.length}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {tags.length > 0 && (
          <div className="dsh-sp-chips">
            <button type="button" className={'dsh-sp-chip' + (tag === '' ? ' is-on' : '')} onClick={() => setTag('')}>{T_ALL}</button>
            {tags.map(([t, n]) => (
              <button key={t} type="button" className={'dsh-sp-chip' + (tag === t ? ' is-on' : '')} onClick={() => setTag(tag === t ? '' : t)}>
                {t} {n}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="dsh-sp-list">
        {shown.map((s) => (
          <div key={s.name} className="dsh-sp-row" role="button" tabIndex={0}
            title={'点击复制 /' + s.name}
            onClick={() => copy(s.name)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copy(s.name) } }}>
            <div className="dsh-sp-head">
              <span className="dsh-sp-dot" style={{ background: TAG_COLOR[s.tag] ?? '#888' }} />
              <strong className="dsh-sp-title">{s.title}</strong>
              <span className="dsh-sp-tag">{s.tag}</span>
            </div>
            {s.summary !== '' && <div className="dsh-sp-summary">{s.summary}</div>}
            <div className="dsh-sp-name">{s.name}{copied === s.name ? '  ✓ ' + COPIED : ''}</div>
          </div>
        ))}
        {skills !== null && shown.length === 0 && (
          <div className="dsh-sp-empty">{list.length === 0 ? T_EMPTY : T_NOMATCH}</div>
        )}
        {error !== '' && <div className="dsh-sp-error">{error}</div>}
      </div>
    </div>
  )
}
