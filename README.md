# dsh-skill-panel

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that lists your local skills in the **official right sidebar**, with Chinese names, categories, and a summary for each. Click a skill to copy `/skill-name` to the clipboard.

English | [中文](README.zh.md)

## What it does

- **Right sidebar tab** -- registers into DSH's official right Sidebar (`@deepseek-ai/dsh-client-ui-sidebar-right`) via the two-stage tab API. No third-party sidebar dependency.
- **Reads local skills** -- scans `~/.agents/skills` and `~/.dsh/skills`, reading each skill's `meta.yaml`.
- **Chinese names** -- `display-name-zh` / `summary-cn` / `tag` from `meta.yaml`; falls back to the directory name.
- **Search and filter** -- a text box plus category chips.
- **One-click copy** -- clicking a row copies `/skill-name`; `navigator.clipboard` with a `execCommand` fallback.

## Install

```powershell
dsh plugin --profile desktop add link:<path-to-this-repo>
```

Then restart the desktop client. For the web profile use `--profile web`.

## meta.yaml

Each skill directory may carry a `meta.yaml` next to its `SKILL.md`:

```yaml
display-name-zh: ESP32 固件工程
summary-cn: ESP-IDF 全流程 —— 任务队列、外设、CAN、Wi-Fi/BLE、OTA、LVGL…
tag: 嵌入式
```

All three keys are optional.

## Layout

```text
package.json          dsh.bundle + dsh.client manifests
cordis.patch.yml      mounts the host plugin row
dsh.plugin.json       registry manifest
build.mjs             esbuild: lib/index.js (ESM host) + lib/client.js (CJS, ModuleLoader)
src/index.ts          host: webServer route GET /skill-panel/skills
src/client/index.tsx  client: two-stage right-sidebar registration
src/client/view.tsx   the panel UI
src/client/styles.ts  CSS injected at mount
```

## How it works

**Host half** (`src/index.ts`) registers one route on `ctx.webServer`:

```ts
ctx.webServer.register({
  kind: 'exact',
  path: '/skill-panel/skills',
  handler: (req, res) => { /* scan + JSON */ },
})
```

**Client half** (`src/client/index.tsx`) registers a tab type and its body:

```ts
ctx.sidebarRightTabs.register({ id, kind, priority: 'extension', title, guide })
ctx.slots.inject('sidebar.right.pane.tab', () =>
  ctx.slots.register({ name: 'sidebar.right.pane.tab', key: id }, Body))
```

The client bundle must be wrapped in `window.__ModuleLoader__.load(...)` -- `build.mjs` does that with esbuild's `banner`/`footer`.

## Compatibility

- DSH **>= 0.2.0-rc.2** (peer range pinned in `package.json`).
- Node >= 22.19.
- Tested on Windows 11 + DSH Desktop 0.2.1-rc.2.

## License

MIT
