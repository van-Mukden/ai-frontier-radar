"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { Flow } from "@/components/dataviz";

const BRAND = "#5ea9ff";
const GREEN = "#98c379";
const GOLD = "#e5c07b";
const RED = "#e06c75";
const PURPLE = "#c678dd";

type SectionId = "guide" | "research" | "copilot" | "sources" | "roadmap";

const NAV: { id: SectionId; label: string; hint: string; dot: string }[] = [
  { id: "guide", label: "如何使用本工具", hint: "功能 + 开发思路", dot: BRAND },
  { id: "research", label: "Research Agent", hint: "自动采集 + 评分", dot: BRAND },
  { id: "copilot", label: "Frontier Copilot", hint: "对话 · 联网 · 入库", dot: GREEN },
  { id: "sources", label: "数据源", hint: "从哪来 / 怎么连", dot: GOLD },
  { id: "roadmap", label: "Roadmap", hint: "已做 / 在做 / 规划", dot: PURPLE },
];

export function DocsShell() {
  const [active, setActive] = useState<SectionId>("guide");
  return (
    <div className="flex flex-col gap-8 md:flex-row md:gap-10">
      {/* 左侧导航 */}
      <aside className="md:w-56 md:shrink-0">
        <div className="md:sticky md:top-20">
          <div className="mb-3 px-1 text-[10px] uppercase tracking-wider text-[var(--faint)]">文档中心</div>
          {/* 移动端横向、桌面端纵向 */}
          <nav className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
            {NAV.map((n) => {
              const on = active === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setActive(n.id)}
                  className={`group flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors md:w-full ${
                    on ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--accent-soft)]"
                  }`}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: n.dot, opacity: on ? 1 : 0.4 }} />
                  <span className="min-w-0">
                    <span className={`block text-sm ${on ? "font-medium text-[var(--foreground)]" : "text-[var(--muted)]"}`}>
                      {n.label}
                    </span>
                    <span className="hidden text-[11px] text-[var(--faint)] md:block">{n.hint}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* 右侧内容 */}
      <div className="min-w-0 flex-1">
        {active === "guide" && <Guide />}
        {active === "research" && <Research />}
        {active === "copilot" && <Copilot />}
        {active === "sources" && <Sources />}
        {active === "roadmap" && <Roadmap />}
      </div>
    </div>
  );
}

/* ---------- 通用小组件 ---------- */
function H1({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight">{children}</h1>
      {sub && <p className="mt-1.5 text-sm text-[var(--muted)]">{sub}</p>}
    </div>
  );
}
function H2({ children, dot = BRAND }: { children: React.ReactNode; dot?: string }) {
  return (
    <h2 className="mb-3 mt-9 flex items-center gap-2 text-lg font-semibold first:mt-0">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} /> {children}
    </h2>
  );
}
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)]">{children}</span>
  );
}

/* ---------- 如何使用本工具（默认页） ---------- */
function Guide() {
  return (
    <div>
      <H1 sub="在热度爆发之前，发现有潜力的 AI 开源项目与 Agent 创业公司。这一页讲清楚：它能做什么、怎么用、以及背后的开发思路。">
        如何使用本工具
      </H1>

      <Card>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          <span className="font-medium text-[var(--foreground)]">AI 前沿雷达</span> 是一个「领先信号」发现工具。别人看
          star 榜和融资新闻时，那些项目其实<span className="text-[var(--foreground)]">已经火过了</span>。这个工具反过来 —— 只看
          <span className="text-[var(--foreground)]">增长加速度、跨源讨论、融资节奏</span>这些还没被大众注意到的早期信号，把可能在下一个季度爆发的项目和公司提前捞出来。
        </p>
      </Card>

      <H2>三步上手</H2>
      <div className="grid gap-3 md:grid-cols-3">
        <StepCard n={1} title="首页看结论" color={BRAND}>
          本周数据面板 + AI 周报（每项一行 + 研判分析）+ Top 开源/Startup 榜单（🔥 标本周爆发）+ 潜力 Startup 关系图谱。想快速了解本周态势，只看首页就够。
        </StepCard>
        <StepCard n={2} title="进榜单钻取" color={GREEN}>
          「开源项目」「Startup」两页可按领域 / 地域 / 分数 / 来源等组合筛选，点进详情看评分拆解、信号、4C 研报；关系图谱按业务(实线)/技术栈(虚线)看公司集群。
        </StepCard>
        <StepCard n={3} title="用 Copilot 追问" color={GOLD}>
          有具体问题就问 Frontier Copilot：基于真实数据回答、按需联网、画图表；也能贴一个 GitHub 链接或公司名，让它评估打分后（你确认）加进榜单。
        </StepCard>
      </div>

      <H2 dot={GREEN}>功能地图</H2>
      <div className="grid gap-3 sm:grid-cols-2">
        <FeatureCard title="AI 周报" where="首页">
          LLM 把本周 Top 榜单写成通顺快报：逐项点评 + 一段「本周研判」（哪些走向 AGI 的 bricks 被补上、还缺什么、有潜力的公司代表哪些未满足的需求），可一键复制并跳转飞书 / 企业微信分享。
        </FeatureCard>
        <FeatureCard title="双榜单 + 组合筛选" where="开源项目 / Startup">
          开源项目按技术领域、创业公司按 Agent 子方向 + 中/美/日地域，评分可拆到子维度；筛选器可叠加组合。
        </FeatureCard>
        <FeatureCard title="潜力 Startup 关系图谱" where="首页 / Startup">
          力导向网络图：业务领域相同连实线、技术栈相同连虚线，一眼看出赛道集群；可按潜力得分阈值过滤节点。
        </FeatureCard>
        <FeatureCard title="Frontier Copilot" where="导航 / 首页入口">
          工具内研究副驾：查库问答、联网搜索、渲染图表/表格、human-in-the-loop 评估入库；对话历史本地留存。
        </FeatureCard>
      </div>

      <H2 dot={GOLD}>架构与开发思路</H2>
      <p className="mb-4 text-sm text-[var(--muted)]">
        整体是「一个离线批处理 Agent 攒数据 + 一个在线交互 Agent 用数据」的双 Agent 结构，中间隔一个本地数据库解耦。
      </p>
      <Card>
        <div className="mb-3 text-sm font-medium">数据流</div>
        <Flow
          accent={BRAND}
          steps={[
            "公开数据源（GitHub / HN / YC / 中文融资新闻）",
            "Research Agent：算领先信号 + Kimi 打分（离线 / 定时）",
            "SQLite 本地库（榜单 · 信号 · 评估 · 周报）",
            "前端：榜单 / 关系图谱 / 周报",
            "Frontier Copilot：读库 + 联网 + 评估入库（在线 / 交互）",
          ]}
        />
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <PrincipleCard title="领先信号优先" color={GREEN}>
          评分核心是增长加速度、跨源印证、融资节奏，而非绝对 star / 已见报融资。目标是「早」，不是「准得漂亮」。
        </PrincipleCard>
        <PrincipleCard title="Human-in-the-loop" color={BRAND}>
          Copilot 评估新项目/公司只产出「拟入库卡片」，必须用户点确认才写库。AI 负责判断，人负责拍板。
        </PrincipleCard>
        <PrincipleCard title="Provider 抽象" color={GOLD}>
          所有 LLM 调用走统一接口 + 结构化 Schema，换模型只改 .env；带节流、重试、JSON 截断修复，适配低/高 RPM 账号。
        </PrincipleCard>
        <PrincipleCard title="数据诚实" color={RED}>
          离线可跑 mock，但 mock 数据禁止污染生产库；抓不到/付费/违反条款的源明确不做，不硬凑假信号。
        </PrincipleCard>
      </div>

      <H2 dot={PURPLE}>技术栈</H2>
      <div className="flex flex-wrap gap-2">
        {[
          "Next.js 16 (App Router)",
          "TypeScript",
          "Tailwind CSS v4",
          "React 19",
          "SQLite (better-sqlite3)",
          "Zod 结构化输出",
          "Kimi / Moonshot (OpenAI 兼容)",
          "force-graph (d3 力导向)",
          "GitHub Actions (定时采集)",
          "Render (一键部署)",
        ].map((t) => (
          <Chip key={t}>{t}</Chip>
        ))}
      </div>
    </div>
  );
}

function StepCard({ n, title, color, children }: { n: number; title: string; color: string; children: React.ReactNode }) {
  return (
    <Card>
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: color, color: "#0a0d12" }}
        >
          {n}
        </span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted)]">{children}</p>
    </Card>
  );
}
function FeatureCard({ title, where, children }: { title: string; where: string; children: React.ReactNode }) {
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{title}</span>
        <span className="shrink-0 text-[11px] text-[var(--faint)]">{where}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{children}</p>
    </Card>
  );
}
function PrincipleCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <Card>
      <div className="text-sm font-medium" style={{ color }}>
        {title}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{children}</p>
    </Card>
  );
}

/* ---------- Research Agent ---------- */
function Research() {
  return (
    <div>
      <H1 sub="一个定时跑的后台 agent：自动扫全网，挑出有潜力的开源项目和 Agent 公司，打分排名，生成周报。">
        Research Agent
      </H1>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <div className="text-sm font-medium">它每次做什么</div>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[var(--muted)]">
            <li>扫数据源，捞出新出现 / 在加速的项目和公司</li>
            <li>算「领先信号」，再让 Kimi 读材料打分</li>
            <li>排名上榜、更新关系图谱</li>
            <li>把 Top 榜单汇总成一份<strong>周报</strong>，可推到飞书 / 企业微信</li>
          </ol>
          <div className="mt-3 text-xs text-[var(--faint)]">自动化：GitHub Actions 每周定时跑一次，把刷新的数据提交回仓库。</div>
        </Card>
        <Card>
          <div className="text-sm font-medium">评分逻辑（说人话）</div>
          <div className="mt-2 space-y-2 text-sm text-[var(--muted)]">
            <p>
              <span className="text-[var(--foreground)]">核心：看「领先信号」，不看滞后指标。</span> 绝对 star 高、融资已见报——那都是已经火过了。
            </p>
            <p>
              <span className="text-[var(--foreground)]">开源项目</span> = 涨得快不快（增速 / 加速度）+ 多少平台同时在讨论 + Kimi 判断新颖度 / 团队 / 是否「充数」。综合分 ≈ 潜力 0.5 + 势能 0.35 + 跨源印证 0.15。
            </p>
            <p>
              <span className="text-[var(--foreground)]">创业公司</span> = 只留中 / 美 / 日 Agent 方向 + Kimi 写研报 4C + 看融资节奏和投资方声誉。综合分 ≈ 潜力 0.6 + 势能 0.4。
            </p>
          </div>
        </Card>
      </div>

      <H2>开源项目打分流程</H2>
      <Card>
        <Flow
          accent={BRAND}
          steps={[
            "每天扫 GitHub + Hacker News 的新项目",
            "算「涨得快不快」：看增速和加速度，不看总 star",
            "看被多少个平台同时讨论（跨源印证）",
            "AI 读 README，自动分中英文 + 技术领域",
            "AI 打潜力分：新颖度 / 势头 / 有没有人真用 / 团队 / 护城河",
            "AI 拉代码核查真假，识别「充数」仓库并扣分",
            "综合排名上榜 + 标注本周爆发",
          ]}
        />
      </Card>

      <H2 dot={GREEN}>创业公司打分流程</H2>
      <Card>
        <Flow
          accent={GREEN}
          steps={[
            "每周扫 YC 公司库 + HN 发布帖 + 中文融资新闻",
            "只留中 / 美 / 日的 Agent 方向公司",
            "AI 写研报式 4C：公司 / 客户 / 竞争 / 协作方",
            "结合融资轮次速度 + 投资方声誉打分",
            "综合排名上榜 + 关系图谱",
          ]}
        />
      </Card>

      <H2 dot={GOLD}>怎么算「有潜力」</H2>
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <div className="text-sm font-medium" style={{ color: GREEN }}>看的是「领先信号」</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
            <li>涨得快不快（增长<span className="text-[var(--foreground)]">加速度</span>，不是绝对数量）</li>
            <li>是不是同时在好几个地方被讨论</li>
            <li>做的人 / 创始人背景硬不硬</li>
            <li>融资一轮接一轮的节奏</li>
          </ul>
        </Card>
        <Card>
          <div className="text-sm font-medium" style={{ color: RED }}>不迷信「滞后指标」</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
            <li>绝对 star 高 —— 那是已经火过了</li>
            <li>已经见报的大额融资 —— 早就不便宜了</li>
            <li>名字响 / README 华丽 —— 可能是「充数」，会被核查扣分</li>
          </ul>
        </Card>
      </div>

      <H2 dot={RED}>怎么证明它真的有用</H2>
      <Card>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          每个被标为「高潜」的项目 / 公司都记下日期，过几周再回头核对是不是真的起来了（star 增速、拿到新一轮融资、被收购、进入主流视野）。和「只按 star 增量排序」的朴素做法比命中率 —— 这才是这个工具的价值证明，而不是当下的分数好看。
        </p>
      </Card>
    </div>
  );
}

/* ---------- Frontier Copilot ---------- */
function Copilot() {
  return (
    <div>
      <H1 sub="工具里的研究副驾。基于本工具的真实数据回答，需要时联网、画图、甚至帮你把新项目 / 公司评估后加进榜单。">
        Frontier Copilot
      </H1>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <div className="text-sm font-medium">它能调用的「工具」（function call）</div>
          <ul className="mt-2 space-y-1.5 text-sm text-[var(--muted)]">
            <li><code className="text-[var(--foreground)]">query_radar_db</code> — 读当前榜单 / 某项目的评分和信号</li>
            <li><code className="text-[var(--foreground)]">get_methodology</code> — 取评分口径，回答「为什么 / 怎么算」</li>
            <li><code className="text-[var(--foreground)]">web_search</code> — 联网搜索（Tavily / Bing / 免费 Google News 兜底）</li>
            <li><code className="text-[var(--foreground)]">fetch_github_repo</code> — 实时拉某个仓库的数据</li>
            <li><code className="text-[var(--foreground)]">render_chart / render_table</code> — 回答里直接画图表和表格</li>
            <li><code className="text-[var(--foreground)]">propose / commit_insert</code> — 评估后生成「拟入库卡片」，你确认才写库</li>
          </ul>
        </Card>
        <Card>
          <div className="text-sm font-medium">两种用法</div>
          <div className="mt-2 space-y-2 text-sm text-[var(--muted)]">
            <p><span className="text-[var(--foreground)]">问答</span>：问榜单、评分、某公司近况——它查库 + 按需联网，带来源回答，能出图表 / 表格。</p>
            <p><span className="text-[var(--foreground)]">评估入库</span>：贴一个 GitHub 链接或公司名 → 它拉数据 + 打分 → 出一张<strong>拟入库卡片</strong> → 你点「确认」才加进榜单（human-in-the-loop）。</p>
          </div>
          <div className="mt-3 border-t border-[var(--border)] pt-2 text-xs text-[var(--faint)]">
            安全：写库一定要你确认；联网内容只当资料、不当指令（防注入）；有本地历史记录，刷新不丢。
          </div>
        </Card>
      </div>

      <H2 dot={GREEN}>一次问答的内部流程</H2>
      <Card>
        <Flow
          accent={GREEN}
          steps={[
            "轻量路由：判断是问答 / 评估 repo / 评估公司",
            "确定性检索：按需拉库、拉 GitHub、联网搜索",
            "把真实数据 + 评分口径注入 system prompt",
            "Kimi 生成回答（含 radar-chart / radar-table / radar-propose 块）",
            "前端渲染图表 / 表格 / 拟入库卡片，等你确认",
          ]}
        />
      </Card>
    </div>
  );
}

/* ---------- 数据源 ---------- */
function Sources() {
  return (
    <div>
      <H1 sub="每个源为什么选它、地址、怎么连。原则：只用公开、免费、可靠的源；拿不到 / 付费 / 违反条款的明确不做。">
        数据源
      </H1>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full border-collapse text-sm" style={{ minWidth: 720 }}>
          <thead>
            <tr className="text-left text-xs text-[var(--muted)]">
              <th className="px-4 py-2.5 font-medium">数据源</th>
              <th className="px-4 py-2.5 font-medium">用途</th>
              <th className="px-4 py-2.5 font-medium">地址</th>
              <th className="px-4 py-2.5 font-medium">为什么选它 / 怎么连</th>
            </tr>
          </thead>
          <tbody>
            {SOURCES.map((s) => (
              <tr key={s.name} className="border-t border-[var(--border)] align-top">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{s.use}</td>
                <td className="px-4 py-3">
                  <code className="text-xs text-[var(--brand)]">{s.addr}</code>
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">{s.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card>
          <div className="text-sm font-medium" style={{ color: GOLD }}>留了接口 · 后续接</div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Reddit（讨论度）、Product Hunt（产品发布）、融资新闻 RSS（TechCrunch / Google News）、VC portfolio 页 diff、飞书 / 企业微信 webhook（周报外发）。都写好了插拔点，配上 key / URL 即启用。
          </p>
        </Card>
        <Card>
          <div className="text-sm font-medium" style={{ color: RED }}>明确不做</div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            X / Twitter（API 贵且受限）、LinkedIn（无开放接口、条款敌对）、Crunchbase / PitchBook（付费）。不硬凑不可靠的源。
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Roadmap ---------- */
function Roadmap() {
  return (
    <div>
      <H1 sub="这个 Demo 已经跑通的、正在打磨的、以及如果继续做会往哪走。">Roadmap</H1>
      <div className="grid gap-3 md:grid-cols-3">
        <RoadCol title="已完成" color={GREEN} tag="Shipped" items={PHASES.done} />
        <RoadCol title="进行中" color={GOLD} tag="In progress" items={PHASES.doing} />
        <RoadCol title="规划中" color={PURPLE} tag="Planned" items={PHASES.next} />
      </div>
    </div>
  );
}
function RoadCol({ title, color, tag, items }: { title: string; color: string; tag: string; items: string[] }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color }}>{title}</span>
        <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--faint)]">{tag}</span>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li key={it} className="flex gap-2 text-sm text-[var(--muted)]">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: color }} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const PHASES = {
  done: [
    "双模块：开源项目 + Agent 创业公司发现",
    "领先信号评分（增速 / 加速度 / 跨源印证）",
    "Kimi 打分 + 4C 研报 + 真伪核查",
    "潜力 Startup 关系图谱（业务实线 / 技术虚线）",
    "Frontier Copilot：问答 / 联网 / 图表 / 评估入库",
    "LLM 撰写周报 + 复制分享到飞书 / 企业微信",
    "中文融资新闻源补中 / 日公司",
    "GitHub Actions 定时采集 + Render 一键部署",
  ],
  doing: [
    "补厚中国 / 日本早期公司覆盖",
    "周报研判段落的深度与可读性打磨",
    "评分回测：高潜命中率 vs 朴素排序",
    "Copilot 联网在国内本地的可用性（换源）",
  ],
  next: [
    "接 Reddit / Product Hunt 提升跨源印证",
    "VC portfolio 页 diff 抢更早的信号",
    "融资新闻结构化入库 + 轮次时间线",
    "周报自动外发（飞书 / 企业微信 webhook）",
    "多用户 / 收藏 / 订阅特定赛道",
    "Copilot function-calling 化 + 引用可点开验证",
  ],
};

const SOURCES: { name: string; use: string; addr: string; why: string }[] = [
  {
    name: "GitHub API",
    use: "拉新仓库、star / fork、贡献者、README、topics",
    addr: "api.github.com",
    why: "官方接口最可靠，是开源项目的主力源。REST 调用，配 PAT token 把额度从 60 提到 5000/小时。",
  },
  {
    name: "GitHub Stargazers",
    use: "用每个 star 的时间戳算真实「涨速」",
    addr: "api.github.com/repos/…/stargazers",
    why: "只有它能算出增长速度 / 加速度——这正是「领先信号」的核心。REST（star+json 头）。",
  },
  {
    name: "Hacker News",
    use: "跨源印证、讨论度、发现新项目 / 公司（Show / Launch HN）",
    addr: "hn.algolia.com/api/v1",
    why: "免费、无需鉴权，开发者受众里信号极强。REST 直接查。",
  },
  {
    name: "YC 公司库",
    use: "发现 YC 的 Agent 方向创业公司（美国为主）",
    addr: "yc-oss.github.io/api",
    why: "社区维护、每周自动更新的 YC 全量 JSON，结构化到公司识别都不用 LLM。直接拉静态 JSON。",
  },
  {
    name: "中文融资新闻",
    use: "补中国 / 日本早期 Agent 公司（YC / HN 结构性只有美国）",
    addr: "news.google.com/rss（中文查询）",
    why: "免费无 key 的融资快讯 RSS → Kimi 抽取「公司 / 轮次 / 金额 / 是否 Agent」。境外服务器稳定；国内本地受限时可用 CHINA_NEWS_RSS 换源。",
  },
  {
    name: "Kimi（Moonshot）",
    use: "判断层：分类、打分、写 4C、Copilot 问答",
    addr: "api.moonshot.ai/v1",
    why: "长上下文能一次读多篇 README / 讨论，中英双语强。OpenAI 兼容接口，做了 provider 抽象可一键切别的模型。",
  },
  {
    name: "Tavily / Bing",
    use: "Copilot 联网搜索",
    addr: "api.tavily.com（或 Bing v7）",
    why: "Tavily 注册即得 key、免 Azure、便宜；做成多 provider，Bing + 免费 Google News 兜底。REST。",
  },
];
