# AI 前沿雷达（AI Frontier Radar）

在热度爆发**之前**，发现有潜力的 AI 开源项目与 Agent 方向创业公司。看的是**领先信号**——增长加速度、跨源印证、团队背景、融资轮次速度——而非滞后的绝对 star / 已见报融资。判断层用 **Kimi (Moonshot)**，无 key 时自动降级为离线 mock，demo 可完全离线跑通。

> Kimi 面试 take-home。完整 PRD 见 Notion；本仓库是可运行、可一键部署的 Web App。

## 快速开始

```bash
npm install
cp .env.example .env        # 可选：填 LLM_API_KEY / GITHUB_TOKEN（见下）
npm run ingest              # 采集真实 GitHub + HN + YC + 中文融资新闻并评分
npm run dev                 # http://localhost:3000
```

无任何 key 也能跑：GitHub / HN / YC 用公开 API（GitHub 60 req/hr，配 `GITHUB_TOKEN` 提到 5000），LLM 判断层降级为离线 mock。

## 功能总览

- **双模块发现**：开源项目 Tracker（M1）+ Agent 创业公司 Tracker（M2），都是自动采集、非手写清单。
- **Research Agent**：定时跑的离线流水线——采集 → 算领先信号 → Kimi 分类/打分/真伪核查 → 落库 → 写周报。
- **Frontier Copilot**：站内研究副驾——基于真实数据问答、联网搜索、渲染图表/表格，还能对用户给的 repo/公司评估打分并（human-in-the-loop 确认后）入库。
- **潜力 Startup 关系图谱**：力导向网络图，**业务领域相同连实线、技术栈相同连虚线**，节点大小=综合分、颜色=地域；可按潜力得分阈值收敛。
- **AI 周报**：LLM 把本周 Top 榜单写成逐行快报 + 一段「本周研判」，可复制并跳转飞书 / 企业微信分享。
- **一键部署**：`render.yaml` Blueprint 部署到 Render；`.github/workflows` 每周定时采集。

## 两个模块

### Module 1 · 开源项目 Tracker
- **数据源（已直连）**：GitHub REST（含 stargazer 时间戳算**真实** star 速度/加速度）、Hacker News Algolia。
- **信号**：star 速度/加速度、相对增长、爆发标记（3 触发器）、跨源印证。为对齐「早期」定位，采集侧 `maxStars` 设上限、按新近排序，避免只捞到已经火过的巨型仓库。
- **分类**：中/英文来源 + 12 类技术领域（LLM）。
- **评分**：rubric 化 LLM-as-judge（potential + 5 子分 + thesis + 风险）。综合分 ≈ 潜力 0.5 + 势能 0.35 + 跨源印证 0.15。
- **真实性核查**：静态分析文件结构 / README / commit 元数据（**不执行陌生代码**，安全边界），识别「充数 / 夸大」并扣分标 `可疑·充数`。沙箱实跑为可选路径（`RADAR_SANDBOX_RUN`）。
- **排名**：全局 feed + 领域内排名；真爆发在榜单里用 🔥 标注。

### Module 2 · Startup Tracker
- 只看 Agent 方向，**地域限中国 / 美国 / 日本**。研报式 **4C**（Company/Customers/Competitors/Collaborators）+ 融资轨迹（轮次速度 + 投资方声誉层级）。综合分 ≈ 潜力 0.6 + 势能 0.4。
- **实时发现（每周更新，非手写清单）**：
  - **YC 公司库**（yc-oss/api，每周自动更新的 YC 全量 JSON）：AI 标签 → 地域过滤 → Agent 关键词 → 入库。结构化，识别不用 LLM。
  - **HN Launch/Show HN**：拉发布帖 → Kimi 抽取「是不是 Agent 公司 + 名称/地域/子类」。
  - **中文融资新闻**（Google News RSS，免费无 key）：补中国 / 日本早期公司（YC/HN 结构性只有美国）→ Kimi 抽取公司/轮次/金额/是否 Agent。
  - 旗舰种子（已知大厂）默认**关闭**（`RADAR_INCLUDE_SEED=1` 才纳入作参照）——与「早期雷达」定位相悖。
- **每周自动**：`.github/workflows` 定时跑 `npm run ingest`，把刷新后的数据提交回仓库（需配 secrets）。

### 评分口径与公允性
- 所有分数为 **0-100 量表**；ingest 侧带 `normalizeScale()` 兜底，修正模型偶发的 0-10 打分（否则会把公司低估约 10 倍）。
- LLM 结构化输出走 Zod schema（带逐字段 `.catch`）；provider 层做节流、429/5xx 重试、以及推理模型 JSON 截断的自动修复。

## Frontier Copilot

站内 Agent（`/copilot`，首页也有入口）。两种用法：
- **问答**：读库 + 按需联网（`web_search`：Tavily / Bing / **免费 Google News 兜底**）→ 带来源回答，可输出图表/表格（```radar-chart``` / ```radar-table``` 围栏块前端渲染）。
- **评估入库**：贴 GitHub 链接或公司名 → 拉数据 + 跑评分 → 出「拟入库卡片」（```radar-propose```）→ 用户点确认才写库（human-in-the-loop）。
- 安全：写库必须确认；联网内容只当资料不当指令（防注入）；对话历史存 localStorage，刷新不丢。

## 部署

- **Render**：`render.yaml` Blueprint 一键部署，在 dashboard 配 `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL` / `GITHUB_TOKEN`（可选 `TAVILY_API_KEY`）即可。
- 联网搜索在境外服务器（Render）用免费 Google News 兜底即可工作；国内本地测联网可配 `TAVILY_API_KEY` 或 `CHINA_NEWS_RSS` 换源。

## 架构

```
src/
  config/scoring.ts        权重 / 阈值 / 枚举 / 声誉表 / 地域配色（改配置不改代码）
  lib/
    db.ts                  better-sqlite3 + schema（WAL）
    sources/               github.ts, hackernews.ts, yc.ts, chinaNews.ts, websearch.ts
    signals/               repoSignals.ts, authenticity.ts（充数检测）
    llm/                   provider 抽象：kimi.ts + mock.ts + prompts.ts + provider.ts(Zod)
    copilot/               agent.ts（意图路由/检索）, prompt.ts, history.ts
    notify/                Notifier：stub / feishu / wecom
    pipeline/              ingestRepos, ingestStartups, digest
    queries.ts             数据访问层（含 getStartupGraph）
  components/
    StartupGraph.tsx       force-graph 关系图谱（实线业务 / 虚线技术 / edge 浮窗）
    docs/                  DocsShell（左导航文档）+ Mermaid（架构图）
    copilot/               CopilotChat, MessageContent（含 markdown 表格渲染）, ProposeCard …
  app/                     Next.js App Router（见下「页面」）
scripts/ingest.ts          采集入口（npm run ingest [-- --only startups]）
scripts/gen-digest.ts      单独重刷周报
```

## 技术栈
Next.js 16（App Router）· React 19 · TypeScript · Tailwind v4 · better-sqlite3 · Zod · Kimi (Moonshot, OpenAI 兼容) · force-graph · mermaid · Tavily/Bing/Google News（联网）

## 页面
- `/` 首页 —— hero + Copilot 入口 + 本周数据 + AI 周报（逐行 + 研判）+ Top 开源/startup 榜（🔥 标爆发）+ 关系图谱
- `/copilot` —— Frontier Copilot 对话（历史侧栏、图表/表格/拟入库卡片渲染）
- `/projects` `/projects/[id]` —— 列表（中英/领域筛选）+ 详情（评分、趋势、真实性核查、跨源提及）
- `/startups` `/startups/[id]` —— 列表（地域/子类/分数/来源筛选）+ 详情（4C、融资时间线）
- `/startups/graph` —— 关系图谱（全部公司，潜力得分滑竿收敛）
- `/docs` —— 文档中心（左导航：如何使用本工具 / Research Agent / Copilot / 数据源 / Roadmap，含架构 flowchart）

## 诚实边界
- **已直连**：GitHub、Hacker News、YC 公司库、中文融资新闻（Google News RSS）。
- **留接口后续接**：Reddit、Product Hunt、融资新闻结构化、VC portfolio diff、飞书/企业微信 webhook（周报外发）。
- **明确不做**：X/Twitter（贵）、LinkedIn（无 API）、Crunchbase/PitchBook（付费）。
- **数据诚实**：离线可跑 mock，但 mock 数据禁止污染生产库。
- 「潜力」无法即时验证 → 用回测框架延迟验证（见 `/docs`）。
