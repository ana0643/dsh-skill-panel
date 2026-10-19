/**
 * dsh-skill-panel -- host half (Node).
 *
 * Route: GET /skill-panel/skills -> { skills, scannedAt, roots, errors }
 *
 * Skill roots (in order, later roots win on duplicate names):
 *   1. $DSH_SKILL_DIRS  (':' or ';' separated, optional)
 *   2. ~/.agents/skills
 *   3. ~/.dsh/skills
 *
 * Each skill may carry a meta.yaml next to SKILL.md:
 *   display-name-zh / summary-cn / tag
 *
 * Results are cached for CACHE_TTL_MS; GET /skill-panel/skills?refresh=1 forces a rescan.
 */
import { readdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { delimiter, join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'

export const name = 'dsh-skill-panel'
export const inject = ['webServer']

interface Skill {
  name: string
  title: string
  summary: string
  tag: string
}

interface Snapshot {
  skills: Skill[]
  scannedAt: number
  roots: string[]
  errors: string[]
}

const KEY_TITLE = 'display-name-zh'
const KEY_SUMMARY = 'summary-cn'
const KEY_TAG = 'tag'
const DEFAULT_TAG = '\u672a\u5206\u7c7b'
const CACHE_TTL_MS = 10_000

function resolveRoots(): string[] {
  const roots: string[] = []
  const extra = process.env.DSH_SKILL_DIRS
  if (extra) {
    for (const part of extra.split(delimiter)) {
      const trimmed = part.trim()
      if (trimmed !== '') roots.push(trimmed)
    }
  }
  roots.push(join(homedir(), '.agents', 'skills'))
  roots.push(join(homedir(), '.dsh', 'skills'))
  return roots
}

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

interface Entry {
  name: string
  isDirectory(): boolean
}

async function readOne(root: string, name: string, errors: string[]): Promise<Skill | null> {
  let meta: Record<string, string> = {}
  try {
    meta = parseMeta(await readFile(join(root, name, 'meta.yaml'), 'utf8'))
  } catch {
    /* meta.yaml optional */
  }
  return {
    name,
    title: meta[KEY_TITLE] ?? name,
    summary: meta[KEY_SUMMARY] ?? '',
    tag: meta[KEY_TAG] ?? DEFAULT_TAG,
  }
}

async function scan(): Promise<Snapshot> {
  const roots = resolveRoots()
  const errors: string[] = []
  const byName = new Map<string, Skill>()

  for (const root of roots) {
    let entries: Entry[] = []
    try {
      entries = (await readdir(root, { withFileTypes: true })) as Entry[]
    } catch (error) {
      errors.push(root + ': ' + (error instanceof Error ? error.message : String(error)))
      continue
    }
    const dirs = entries.filter((e) => e.isDirectory())
    const loaded = await Promise.all(dirs.map((e) => readOne(root, e.name, errors)))
    for (const skill of loaded) {
      if (skill !== null) byName.set(skill.name, skill)
    }
  }

  const skills = [...byName.values()].sort((a, b) =>
    a.tag === b.tag ? a.title.localeCompare(b.title, 'zh') : a.tag.localeCompare(b.tag, 'zh'),
  )

  return { skills, scannedAt: Date.now(), roots, errors }
}

export function apply(ctx: Context): void {
  const server = (ctx as unknown as {
    webServer?: {
      register?: (route: {
        kind: 'exact' | 'prefix'
        path: string
        handler: (req: { url?: string }, res: any) => void
      }) => () => void
    }
  }).webServer

  if (!server?.register) {
    console.error('[dsh-skill-panel] webServer service unavailable')
    return
  }

  let cache: Snapshot | null = null

  ctx.effect(() => {
    const off = server.register!({
      kind: 'exact',
      path: '/skill-panel/skills',
      handler: async (req, res) => {
        try {
          const force = typeof req.url === 'string' && req.url.includes('refresh=1')
          const fresh = cache !== null && Date.now() - cache.scannedAt < CACHE_TTL_MS
          if (force || !fresh) cache = await scan()
          res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify(cache))
        } catch (error) {
          res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
        }
      },
    })
    return () => {
      off()
    }
  }, 'dsh-skill-panel: route')
}
