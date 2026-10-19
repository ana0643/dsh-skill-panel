/**
 * dsh-skill-panel -- host half (Node).
 * GET /skill-panel/skills -> { skills: Skill[] }
 * Scans ~/.agents/skills, reads each meta.yaml.
 */
import { readdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'

export const name = 'dsh-skill-panel'
export const inject = ['webServer']

interface Skill {
  name: string
  title: string
  summary: string
  tag: string
}

const ROOTS = [join(homedir(), '.agents', 'skills'), join(homedir(), '.dsh', 'skills')]

const KEY_TITLE = 'display-name-zh'
const KEY_SUMMARY = 'summary-cn'
const KEY_TAG = 'tag'
const DEFAULT_TAG = '\u672a\u5206\u7c7b'

function parseMeta(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of text.split(/\r?\n/)) {
    const m = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line)
    if (!m) continue
    let v = m[2].trim()
    if (v.length >= 2) {
      const a = v[0]
      const b = v[v.length - 1]
      if ((a === '"' && b === '"') || (a === "'" && b === "'")) v = v.slice(1, -1)
    }
    out[m[1]] = v
  }
  return out
}

async function scan(): Promise<Skill[]> {
  const seen = new Set<string>()
  const skills: Skill[] = []
  for (const root of ROOTS) {
    let entries: Array<{ name: string; isDirectory(): boolean }> = []
    try {
      entries = await readdir(root, { withFileTypes: true })
    } catch {
      continue
    }
    for (const e of entries) {
      if (!e.isDirectory() || seen.has(e.name)) continue
      seen.add(e.name)
      let meta: Record<string, string> = {}
      try {
        meta = parseMeta(await readFile(join(root, e.name, 'meta.yaml'), 'utf8'))
      } catch {
        /* no meta.yaml */
      }
      skills.push({
        name: e.name,
        title: meta[KEY_TITLE] ?? e.name,
        summary: meta[KEY_SUMMARY] ?? '',
        tag: meta[KEY_TAG] ?? DEFAULT_TAG,
      })
    }
  }
  return skills.sort((a, b) =>
    a.tag === b.tag ? a.title.localeCompare(b.title, 'zh') : a.tag.localeCompare(b.tag, 'zh'),
  )
}

export function apply(ctx: Context): void {
  const server = (ctx as unknown as {
    webServer?: { register?: (route: { kind: 'exact' | 'prefix'; path: string; handler: (req: unknown, res: any) => void }) => () => void }
  }).webServer

  if (!server?.register) {
    console.error('[dsh-skill-panel] webServer service unavailable')
    return
  }

  ctx.effect(() => {
    const off = server.register!({ kind: 'exact', path: '/skill-panel/skills', handler: async (_req, res) => {
      try {
        const skills = await scan()
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ skills }))
      } catch (error) {
        res.writeHead(500, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: String(error) }))
      }
    } })
    return () => { off() }
  }, 'dsh-skill-panel: route')
}
