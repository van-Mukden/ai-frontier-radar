# AI 前沿雷达（AI Frontier Radar）

在热度爆发**之前**，发现有潜力的 AI 开源项目与 Agent 方向创业公司。看的是**领先信号**——增长加速度、跨源印证、团队背景、融资轮次速度——而非滞后的绝对 star / 已见报融资。判断层用 **Kimi (Moonshot)**，无 key 时自动降级为离线 mock，demo 可完全离线跑通。

> Kimi 笔试 take-home。完整 PRD 见 Notion；本仓库是可运行的 Web App。

## 快速开始

```bash
npm install
cp .env.example .env        # 可选：填 MOONSHOT_API_KEY / GITHUB_TOKEN
npm run ingest              # 采集真实 GitHub + HN 数据并评分（约 15 个仓库 + 6 家公司）
npm run dev                 # http://localhost:3000
```

无任何 key 也能跑：GitHub / HN 用公开 API（GitHub 60 req/hr，配 `GITHUB_TOKEN` 提到 5000），LLM 判断层降级为离线 mock。

## 两个模块

### Module 1 · 开源项目 Tracker
- **数据源（已直连）**：GitHub REST（含 stargazer 时间戳算**真实** 7 日 star 速度）、Hacker News Algolia。
- **信号**：star 速度/加速度、相对增长、爆发标记、跨源印证。
- **分类**：中/英文来源 + 12 类技术领域（LLM）。
- **评分**：L1 = rubric 化 LLM-as-judge（potential + 5 子分 + thesis + 风险 + 类比）。
- **L2 真实性核查**：静态分析文件结构 / README / commit 元数据（**不执行陌生代码**，安全边界），识别「充数 / 夸大」——号称名校背书却无佐证、塞成百上千个无法泛化的 skill、README 华丽但跑不起来等。命中标 `可疑·充数` 并对评分扣分。沙箱实跑为可选路径（`RADAR_SANDBOX_RUN`）。
- **排名**：全局 feed + 领域内排名 + 本周爆发。

### Module 2 · Startup Tracker
- 只看 Agent 方向，**地域限中国 / 美国 / 日本**。
- 融资轨迹（轮次速度 + 投资方声誉层级）、团队背景、**研报 4C**（Company/Customers/Competitors/Collaborators）。
- **实时发现（每周更新，非手写清单）**：
  - **YC 公司库**（yc-oss/api，社区维护、每周自动更新的 YC 全量 JSON）：按 AI 标签拉取 → 地域(中/美/日)过滤 → Agent 关键词筛选 → 入库。结构化数据，识别不用 LLM。
  - **HN Launch/Show HN**：拉发布帖 → Kimi 抽取「是不是 Agent 公司 + 名称/地域/子类」。
  - **旗舰锚点**：少量非 YC 的知名公司（Cursor / Cognition / Manus / Sakana / Dify …）手工补，保证地域与知名度平衡；每家卡片标注来源（YC batch / HN / 旗舰）。
- **每周自动**：`.github/workflows/weekly-radar.yml` 每周一定时跑 `npm run ingest`，把刷新后的数据提交回仓库（需在 repo 配 `LLM_API_KEY` 等 secrets）。

### 每日推送
`Notifier` 接口 + stub。飞书 / 企业微信 webhook 实现已写好（`src/lib/notify/`），配 `FEISHU_WEBHOOK` / `WECOM_WEBHOOK` 即从 stub 切换为真实外发。

## 架构

```
src/
  config/scoring.ts        权重 / 阈值 / 枚举 / 声誉表（改配置不改代码）
  lib/
    db.ts                  better-sqlite3 + schema
    sources/               github.ts, hackernews.ts（真实 adapter）
    signals/               repoSignals.ts, authenticity.ts（充数检测）
    llm/                   provider 抽象：kimi.ts + mock.ts + prompts.ts
    notify/                Notifier：stub / feishu / wecom
    pipeline/              ingestRepos, ingestStartups, digest
    queries.ts             数据访问层
  app/                     Next.js App Router：今日 / 项目 / 公司 / 方法论
scripts/ingest.ts          采集入口（npm run ingest）
```

## 技术栈
Next.js 16（App Router）· TypeScript · Tailwind · better-sqlite3 · Zod · Kimi (Moonshot, OpenAI 兼容)

## 页面
- `/` 今日 —— Top3 开源 + Top3 startup + 本周爆发 + 推送简报
- `/projects` `/projects/[id]` —— 列表（中英/领域/爆发筛选）+ 详情（评分、趋势、真实性核查、跨源提及）
- `/startups` `/startups/[id]` —— 列表 + 详情（4C、融资时间线）
- `/methodology` —— 评分方法 + 回测框架 + 数据源诚实边界

## 诚实边界
- **已直连**：GitHub、Hacker News。
- **留接口后续接**：Reddit、Product Hunt、GitHub Trending、YC 目录、VC portfolio、飞书/企业微信 webhook。
- **明确不做**：X/Twitter（贵）、LinkedIn（无 API）、Crunchbase/PitchBook（付费）。
- 「潜力」无法即时验证 → 用回测框架延迟验证（见 `/methodology`）。
