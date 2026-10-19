/**
 * dsh-skill-panel -- client half. Two-stage right-sidebar registration.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import { SkillView } from './view.tsx'
import { adoptStyles } from './styles.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'sidebar.right.pane.tab': { kind: 'keyed'; scope: 'session' }
    'sidebar.right.pane.tab.title': { kind: 'keyed'; scope: 'session' }
  }
}

export const inject = ['slots', 'sidebarRightTabs']

const TAB_ID = 'dsh-skill-panel'
const TAB_KIND = 'skill-panel'
const LABEL = '技能'
const DESC = '本机全部 skill'

function Glyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="3" cy="4" r="1.2" fill="currentColor" />
      <circle cx="3" cy="8" r="1.2" fill="currentColor" />
      <circle cx="3" cy="12" r="1.2" fill="currentColor" />
      <rect x="6" y="3.4" width="8" height="1.3" rx="0.65" fill="currentColor" />
      <rect x="6" y="7.4" width="8" height="1.3" rx="0.65" fill="currentColor" />
      <rect x="6" y="11.4" width="5.5" height="1.3" rx="0.65" fill="currentColor" />
    </svg>
  )
}

export function apply(ctx: ClientContext): void {
  adoptStyles()

  ctx.effect(
    () =>
      ctx.sidebarRightTabs.register({
        id: TAB_ID,
        kind: TAB_KIND,
        priority: 'extension',
        title: () => LABEL,
        guide: [{ order: 20, title: () => LABEL, description: () => DESC, icon: Glyph }],
      }),
    'dsh-skill-panel: type',
  )

  ctx.effect(
    () =>
      ctx.slots.inject('sidebar.right.pane.tab', () =>
        ctx.slots.register({ name: 'sidebar.right.pane.tab', key: TAB_ID }, () => <SkillView />),
      ),
    'dsh-skill-panel: body',
  )

  ctx.effect(
    () =>
      ctx.slots.inject('sidebar.right.pane.tab.title', () =>
        ctx.slots.register({ name: 'sidebar.right.pane.tab.title', key: TAB_ID }, Glyph),
      ),
    'dsh-skill-panel: chip',
  )
}
