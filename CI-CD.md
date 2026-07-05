# CI/CD 流水线配置说明

本项目支持三种 CI/CD 部署方案，按优先级排列：

## 方案一：Gitea Actions（推荐 — 与当前仓库原生集成）

### 工作流文件
`.gitea/workflows/build-deploy.yml`

### 触发条件
- 推送到 `main` 分支
- 针对 `main` 的 Pull Request
- 手动触发（workflow_dispatch）

### 流水线阶段
```
检测变更 → 代码检查(ESLint + tsc) → 构建(npm run build) → 部署
```

### 启用步骤
1. **确认 Gitea 实例已开启 Actions**
   - 管理员设置 → 应用配置 → 启用 Gitea Actions
   - 或在 `app.ini` 中设置 `[actions].ENABLED = true`

2. **配置 Runner**
   ```bash
   # 在服务器上注册 runner
   act_runner register
   act_runner daemon
   ```
   - Runner 标签需包含 `ubuntu-latest`
   - 需安装 Docker（Gitea Actions 用 Docker 执行 job）

3. **配置部署密钥**（如部署到自有服务器）
   - 仓库设置 → Secrets → 添加：
     - `DEPLOY_SSH_KEY`：SSH 私钥
     - `DEPLOY_HOST`：服务器地址
     - `DEPLOY_USER`：SSH 用户
   - 取消 `build-deploy.yml` 中部署步骤的注释并替换实际命令

4. **路径过滤**
   - 仅 `src/`、`public/`、`package.json`、`vite.config.ts` 等变更才触发构建
   - 仅 `main` 分支触发部署，PR 只做检查不部署

---

## 方案二：Vercel 部署（零配置 — 已有 VERCEL_TOKEN）

### 配置文件
- `vercel.json`：Vercel 项目配置
- `.github/workflows/vercel-deploy.yml`：GitHub Actions 部署工作流

### 启用步骤
1. **导入项目到 Vercel**
   ```bash
   npm i -g vercel
   vercel link
   ```
   - 关联到现有 Vercel 项目或新建

2. **获取项目 ID**
   ```bash
   vercel project ls
   ```
   - 记录 `ORG_ID` 和 `PROJECT_ID`

3. **配置 GitHub Secrets**（如使用 GitHub Actions 部署）
   - `VERCEL_TOKEN`：Vercel 访问令牌
   - `VERCEL_ORG_ID`：组织 ID
   - `VERCEL_PROJECT_ID`：项目 ID

4. **或直接用 Vercel Git 集成**（更简单）
   - Vercel 控制台 → Import Git Repository
   - 连接 Gitea/GitHub 仓库
   - 每次推送自动部署，无需 Actions

### 特性
- SPA 路由回退（所有路径指向 index.html）
- 静态资源 1 年强缓存（immutable）
- 安全头（X-Frame-Options、X-Content-Type-Options 等）

---

## 方案三：GitHub Actions 镜像构建（代码检查 + 产物归档）

### 工作流文件
- `.github/workflows/build.yml`：构建检查
- `.github/workflows/vercel-deploy.yml`：Vercel 部署

### 适用场景
- 仓库镜像到 GitHub 时使用
- 仅做构建验证，不直接部署（部署由 Vercel Git 集成完成）

---

## 环境变量说明

| 变量 | 用途 | 必需 |
|---|---|---|
| `VITE_ENABLE_ROUTE_MESSAGING` | 启用路由消息（构建时注入） | 是 |
| `CDN_IMG_PREFIX` | 图片 CDN 前缀（可选） | 否 |
| `VERCEL_TOKEN` | Vercel 部署令牌 | 仅 Vercel 方案 |
| `VERCEL_ORG_ID` | Vercel 组织 ID | 仅 Vercel 方案 |
| `VERCEL_PROJECT_ID` | Vercel 项目 ID | 仅 Vercel 方案 |

---

## 部署目标对比

| 方案 | 成本 | 速度 | CN 可达性 | 推荐场景 |
|---|---|---|---|---|
| Gitea Actions + 自有服务器 | 服务器费用 | 中 | 自控 | 生产环境、数据敏感 |
| Vercel | 免费层足够 | 快 | 可能需梯子 | 快速上线、演示 |
| GitHub Actions + Vercel | 免费 | 快 | 需梯子 | 开源项目 |

---

## 本地验证 CI 流程

```bash
# 模拟 CI 构建过程
npm ci
npm run lint
npx tsc --noEmit
npm run build
ls -lh dist/
```

## 注意事项

1. **Gitea Actions 兼容性**：语法与 GitHub Actions 兼容，但部分 Action 可能需要替换为 Gitea 镜像
2. **node_modules 符号链接**：沙箱环境 node_modules 是符号链接，CI 环境用 `npm ci` 正常安装
3. **HashRouter**：项目使用 HashRouter，静态托管无需服务端路由配置，但仍建议配置 SPA 回退
4. **构建模式**：`package.json` 中 build 脚本使用 `--mode development`，如需生产优化可改为 `vite build`
