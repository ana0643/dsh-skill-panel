/** Styles: use host CSS variables (--dsw-alias-*), follow light/dark. */
const CSS = `
.dsh-sp-root{display:flex;flex-direction:column;height:100%;min-height:0;font:inherit;color:var(--dsw-alias-text-1,inherit)}
.dsh-sp-bar{padding:8px 10px;flex:0 0 auto;display:flex;flex-direction:column;gap:6px;border-bottom:1px solid var(--dsw-alias-border-1,rgba(128,128,128,.18))}
.dsh-sp-searchrow{display:flex;gap:6px;align-items:center}
.dsh-sp-input{flex:1 1 auto;min-width:0;box-sizing:border-box;padding:6px 8px;border-radius:6px;font:inherit;border:1px solid var(--dsw-alias-border-1,rgba(128,128,128,.3));background:var(--dsw-alias-bg-input,rgba(128,128,128,.08));color:inherit;outline:none}
.dsh-sp-input:focus{border-color:var(--dsw-alias-accent,#4d6bfe)}
.dsh-sp-refresh{flex:0 0 auto;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:15px;line-height:1;cursor:pointer;border:1px solid var(--dsw-alias-border-1,rgba(128,128,128,.3));background:transparent;color:inherit;padding:0}
.dsh-sp-refresh:hover:not(:disabled){background:var(--dsw-alias-bg-hover,rgba(128,128,128,.12))}
.dsh-sp-refresh:disabled{opacity:.45;cursor:default}
.dsh-sp-chips{display:flex;gap:5px;flex-wrap:wrap}
.dsh-sp-chip{padding:2px 8px;border-radius:10px;font-size:12px;line-height:18px;cursor:pointer;white-space:nowrap;border:1px solid var(--dsw-alias-border-1,rgba(128,128,128,.3));background:transparent;color:inherit}
.dsh-sp-chip.is-on{background:var(--dsw-alias-accent,#4d6bfe);color:#fff;border-color:transparent}
.dsh-sp-list{overflow-y:auto;flex:1 1 auto;min-height:0}
.dsh-sp-row{padding:7px 10px;display:flex;flex-direction:column;gap:2px;border-bottom:1px solid var(--dsw-alias-border-1,rgba(128,128,128,.1));cursor:pointer;transition:background .12s}
.dsh-sp-row:hover{background:var(--dsw-alias-bg-hover,rgba(128,128,128,.08))}
.dsh-sp-row:focus-visible{outline:2px solid var(--dsw-alias-accent,#4d6bfe);outline-offset:-2px}
.dsh-sp-head{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap}
.dsh-sp-dot{width:7px;height:7px;border-radius:4px;flex:0 0 auto;display:inline-block}
.dsh-sp-title{font-size:13px;font-weight:600}
.dsh-sp-tag{font-size:11px;opacity:.45}
.dsh-sp-summary{font-size:12px;line-height:17px;opacity:.72}
.dsh-sp-name{font-size:11px;opacity:.5;font-family:ui-monospace,monospace}
.dsh-sp-empty{padding:18px 12px;font-size:12px;opacity:.55;text-align:center}
.dsh-sp-error{padding:14px 12px;font-size:12px;color:#d9534f}
.dsh-sp-errors{padding:8px 12px;font-size:11px;opacity:.5;border-top:1px solid var(--dsw-alias-border-1,rgba(128,128,128,.12))}
`

export function adoptStyles(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById('dsh-skill-panel-css')) return
  const el = document.createElement('style')
  el.id = 'dsh-skill-panel-css'
  el.textContent = CSS
  document.head.appendChild(el)
}
