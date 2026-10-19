# dsh-skill-panel

把本机技能列进 **DSH 官方右侧栏**的插件：中文名、分类、简介一目了然，点一下复制 `/技能名`。

[English](README.md) | 中文

## 功能

- **右侧栏标签页** —— 走 DSH 官方右侧栏（`@deepseek-ai/dsh-client-ui-sidebar-right`）的两段式注册，不依赖第三方侧边栏。
- **读取本机技能** —— 扫描 `~/.agents/skills` 与 `~/.dsh/skills`，读每个技能的 `meta.yaml`。
- **中文显示** —— `meta.yaml` 里的 `display-name-zh` / `summary-cn` / `tag`，缺失时退回目录名。
- **搜索与筛选** —— 搜索框 + 分类标签。
- **一键复制** —— 点击任意一行把 `/技能名` 复制到剪贴板（`navigator.clipboard`，失败时退回 `execCommand`）。

## 安装

```powershell
dsh plugin --profile desktop add link:<本仓库路径>
```

装完重启桌面客户端。Web 环境把 `--profile desktop` 换成 `--profile web`。

## meta.yaml

每个技能目录可以在 `SKILL.md` 旁边放一份 `meta.yaml`：

```yaml
display-name-zh: ESP32 固件工程
summary-cn: ESP-IDF 全流程 —— 任务队列、外设、CAN、Wi-Fi/BLE、OTA、LVGL…
tag: 嵌入式
```

三个键都是可选的。

## 目录结构

```text
package.json          dsh.bundle + dsh.client 清单
cordis.patch.yml      把 host 插件挂进 profile
dsh.plugin.json       注册清单
build.mjs             esbuild：lib/index.js（ESM host）+ lib/client.js（CJS，ModuleLoader）
src/index.ts          host：webServer 路由 GET /skill-panel/skills
src/client/index.tsx  client：两段式注册进右侧栏
src/client/view.tsx   面板 UI
src/client/styles.ts  挂载时注入的 CSS
```

## 实现要点

**Host 半边**（`src/index.ts`）在 `ctx.webServer` 上注册一条路由：

```ts
ctx.webServer.register({
  kind: 'exact',
  path: '/skill-panel/skills',
  handler: (req, res) => { /* 扫描 + JSON */ },
})
```

**Client 半边**（`src/client/index.tsx`）注册标签类型与主体：

```ts
ctx.sidebarRightTabs.register({ id, kind, priority: 'extension', title, guide })
ctx.slots.inject('sidebar.right.pane.tab', () =>
  ctx.slots.register({ name: 'sidebar.right.pane.tab', key: id }, Body))
```

客户端产物必须包在 `window.__ModuleLoader__.load(...)` 里——`build.mjs` 用 esbuild 的 `banner`/`footer` 做到这点。

## 兼容性

- DSH **>= 0.2.0-rc.2**（peer 范围已写进 `package.json`）。
- Node >= 22.19。
- 实测环境：Windows 11 + DSH Desktop 0.2.1-rc.2。

## 许可

MIT
