# Frontend

`Frontend/` 是 AppPlatform 的前端工作区，采用 `pnpm workspace + Turbo` 的 monorepo 组织方式。当前目录主要承载主业务应用、文档站、一组共享包和工程脚本。

项目整体基于 Vue 3 技术栈，并延续 `Vue Vben Admin v5` 的分层方式做业务化扩展。

## 1. 技术栈概览

- Vue 3
- Vite
- TypeScript
- Pinia
- Vue Router
- Turbo
- pnpm workspace
- VitePress
- Ant Design Vue / antdv-next

## 2. 工作区结构

```text
Frontend/
├── apps/                主业务应用（数据平台）
├── docs/                VitePress 文档站
├── packages/            业务与框架共享包
├── internal/            内部工程配置与构建基础设施
├── scripts/             CLI 与部署脚本
├── turbo.json           Turbo 任务编排
├── pnpm-workspace.yaml  Workspace 包范围定义
└── package.json         根脚本与统一依赖入口
```

## 3. 关键目录说明

### 3.1 apps

主业务前端应用，包名为 `@vben/web-antdv-next`。

- 应用标题默认配置为“数据平台”
- 开发端口来自 `apps/.env.development`，默认是 `5999`
- 开发态通过 Vite 代理将 `/console` 转发到 `http://127.0.0.1:2700`
- 入口在 `apps/src/main.ts`
- 启动装配逻辑在 `apps/src/bootstrap.ts`

`apps/src` 主要分层如下：

- `api/core`：较新的核心接口封装
- `api/legacy`：历史业务接口封装
- `router`：路由与权限守卫
- `store`：状态管理
- `layouts`：布局入口
- `views/*`：按业务域组织的页面模块
- `components`：应用级组件
- `adapter`：表单、组件等适配层
- `locales`：国际化资源

### 3.2 docs

文档站应用，包名为 `@vben/docs`，基于 VitePress。

- 配置入口在 `docs/.vitepress/config/index.mts`
- 同时提供中文与英文站点
- 首页内容位于 `docs/src/index.md` 和 `docs/src/en/index.md`

### 3.3 packages

共享包分为几层：

- `packages/@core/base/*`
  - 底层基础能力，如 `design`、`icons`、`shared`、`typings`
  - 约束：`base` 层“请勿引入 workspace 依赖”
- `packages/@core/ui-kit/*`
  - 通用 UI 原子/组合能力，如 `form-ui`、`layout-ui`、`menu-ui`、`popup-ui`、`tabs-ui`、`shadcn-ui`
- `packages/@core/composables`
  - 通用组合式能力
- `packages/@core/preferences`
  - 偏好设置相关底层能力
- `packages/effects/*`
  - 偏应用层的组合能力，如 `access`、`common-ui`、`hooks`、`layouts`、`plugins`、`request`
- `packages/constants|icons|locales|preferences|stores|styles|types|utils`
  - 面向应用的共享常量、样式、类型、工具与状态能力

### 3.4 internal

内部工程基础设施，不直接承载业务页面：

- `internal/lint-configs/*`：ESLint / Stylelint 共享配置
- `internal/tsconfig`：TS 配置基线
- `internal/vite-config`：Vite 配置封装
- `internal/tailwind-config`：Tailwind 配置
- `internal/node-utils`：Node 侧工具能力

### 3.5 scripts

工程脚本目录：

- `scripts/turbo-run`
  - 交互式运行 monorepo 中具备相同脚本的包
- `scripts/vsh`
  - 工程巡检工具，包含依赖检查、循环依赖扫描、发布检查、lint 封装等能力
- `scripts/deploy`
  - Docker / Nginx 部署相关脚本

## 4. 安装与启动

### 4.1 环境要求

- Node.js: `^20.19.0 || ^22.18.0 || ^24.0.0`
- pnpm: `>=10.0.0`

推荐先启用 Corepack：

```bash
corepack enable
pnpm install
```

项目根目录限制使用 `pnpm`，`npm/yarn` 不作为默认包管理器。

### 4.2 常用开发命令

在 `Frontend/` 目录执行：

```bash
# 交互式选择带 dev 脚本的包启动
pnpm dev

# 启动主业务应用
pnpm dev:antdv-next

# 启动文档站
pnpm dev:docs
```

### 4.3 构建命令

```bash
# 构建整个 workspace
pnpm build

# 构建主应用
pnpm build:antdv-next

# 构建文档站
pnpm build:docs

# 本地构建 Docker 镜像
pnpm build:docker
```

### 4.4 质量与测试命令

```bash
# lint / format
pnpm lint
pnpm format

# 类型检查、依赖检查、循环依赖检查、拼写检查
pnpm check

# 单元测试
pnpm test:unit

```

## 5. 环境变量与运行时约定

### 5.1 apps

`apps/.env` 与 `apps/.env.*` 中常见变量：

- `VITE_APP_TITLE`：应用标题
- `VITE_APP_NAMESPACE`：本地缓存、store 等命名空间前缀
- `VITE_APP_STORE_SECURE_KEY`：持久化加密密钥
- `VITE_PORT`：开发端口
- `VITE_GLOB_API_URL`：接口基地址

当前开发环境关键值：

- 端口：`5999`
- 接口：`http://127.0.0.1:2700/console`

## 6. 全局工程约定

- 根命令统一从 `Frontend/package.json` 发起，避免在子包内各自维护重复脚本
- `pnpm dev` 与 `pnpm preview` 通过 `turbo-run` 做交互式过滤，不是“启动所有应用”
- Turbo 任务编排定义在 `turbo.json`
- workspace 范围定义在 `pnpm-workspace.yaml`
- `.npmrc` 已配置镜像源与 peer 依赖策略，默认使用 `https://registry.npmmirror.com`
- `@vben-core/base` 层保持最底层，不应反向依赖其它 workspace 包
- 主应用通过偏好设置系统按 `namespace + version + env` 隔离本地缓存与持久化数据

## 7. 建议的阅读顺序

第一次接手该目录，建议按下面顺序阅读：

1. `package.json`
2. `pnpm-workspace.yaml`
3. `turbo.json`
4. `apps/package.json`
5. `apps/src/main.ts`
6. `apps/src/bootstrap.ts`
7. `docs/.vitepress/config/index.mts`
8. `internal/vite-config/src/config/application.ts`

## 8. 补充说明

- 现有 `README.zh-CN.md` 仅保留了最基础的安装与运行说明
- 本文件用于补充 `Frontend/` 的全局结构、运行方式与分层约定，便于后续开发、交接与排障
