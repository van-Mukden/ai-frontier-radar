import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";
const BRAND = "#5ea9ff";

export const metadata = { title: "文档 · AI 前沿雷达" };

export default function Docs() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">文档</h1>
        <p className="mt-1 text-[var(--muted)]">一页看懂这个工具怎么跑：两个 Agent + 数据从哪来。尽量说人话。</p>
      </div>

      {/* Research Agent */}
      <section>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: BRAND }} /> Research Agent（自动采集 + 评分）
        </h2>
        <p className="mb-4 text-sm text-[var(--muted)]">一个定时跑的后台 agent：自动扫全网，挑出有潜力的开源项目和 Agent 公司，打分排名，生成周报。</p>

        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <div className="text-sm font-medium">它每次做什么</div>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[var(--muted)]">
              <li>扫数据源，捞出新出现/在加速的项目和公司</li>
              <li>算"领先信号"（下面讲），再让 Kimi 读材料打分</li>
              <li>排名上榜、更新关系图谱</li>
              <li>把 Top3 汇总成一份<strong>周报</strong>，可推到飞书 / 企业微信</li>
            </ol>
            <div className="mt-3 text-xs text-[var(--faint)]">自动化：GitHub Actions 每周一定时跑一次，把刷新的数据提交回仓库。</div>
          </Card>

          <Card>
            <div className="text-sm font-medium">评分逻辑（说人话）</div>
            <div className="mt-2 space-y-2 text-sm text-[var(--muted)]">
              <p>
                <span className="text-[var(--foreground)]">核心：看"领先信号"，不看滞后指标。</span> 绝对 star 高、融资已见报——那都是已经火过了。
              </p>
              <p>
                <span className="text-[var(--foreground)]">开源项目</span> = 涨得快不快（增速/加速度）+ 多少平台同时在讨论 + Kimi 判断新颖度/团队/是否"充数"。综合分 ≈ 潜力 0.5 + 势能 0.35 + 跨源印证 0.15。
              </p>
              <p>
                <span className="text-[var(--foreground)]">创业公司</span> = 只留中/美/日 Agent 方向 + Kimi 写研报 4C + 看融资节奏和投资方声誉。综合分 ≈ 潜力 0.6 + 势能 0.4。
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Frontier Copilot */}
      <section>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#98c379" }} /> Frontier Copilot（对话助手）
        </h2>
        <p className="mb-4 text-sm text-[var(--muted)]">工具里的研究副驾。基于本工具的真实数据回答，需要时联网、画图、甚至帮你把新项目/公司评估后加进榜单。</p>

        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <div className="text-sm font-medium">它能调用的"工具"（function call）</div>
            <ul className="mt-2 space-y-1.5 text-sm text-[var(--muted)]">
              <li><code className="text-[var(--foreground)]">query_radar_db</code> — 读当前榜单 / 某项目的评分和信号</li>
              <li><code className="text-[var(--foreground)]">get_methodology</code> — 取评分口径，回答"为什么/怎么算"</li>
              <li><code className="text-[var(--foreground)]">web_search</code> — 联网搜索（Tavily / Bing）</li>
              <li><code className="text-[var(--foreground)]">fetch_github_repo</code> — 实时拉某个仓库的数据</li>
              <li><code className="text-[var(--foreground)]">render_chart / render_table</code> — 回答里直接画图表和表格</li>
              <li><code className="text-[var(--foreground)]">propose / commit_insert</code> — 评估后生成"拟入库卡片"，你确认才写库</li>
            </ul>
          </Card>

          <Card>
            <div className="text-sm font-medium">两种用法</div>
            <div className="mt-2 space-y-2 text-sm text-[var(--muted)]">
              <p><span className="text-[var(--foreground)]">问答</span>：问榜单、评分、某公司近况——它查库 + 按需联网，带来源回答，能出图表/表格。</p>
              <p><span className="text-[var(--foreground)]">评估入库</span>：贴一个 GitHub 链接或公司名 → 它拉数据 + 打分 → 出一张<strong>拟入库卡片</strong> → 你点"确认"才加进榜单（human-in-the-loop）。</p>
            </div>
            <div className="mt-3 border-t border-[var(--border)] pt-2 text-xs text-[var(--faint)]">
              安全：写库一定要你确认；联网内容只当资料、不当指令（防注入）；有本地历史记录，刷新不丢。
            </div>
          </Card>
        </div>
      </section>

      {/* 数据源 */}
      <section>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#e5c07b" }} /> 数据源
        </h2>
        <p className="mb-4 text-sm text-[var(--muted)]">每个源为什么选它、地址、怎么连。原则：只用公开、免费、可靠的源；拿不到/付费/违反条款的明确不做。</p>

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
            <div className="text-sm font-medium" style={{ color: "#e5c07b" }}>留了接口 · 后续接</div>
            <p className="mt-1 text-sm text-[var(--muted)]">Reddit（讨论度）、Product Hunt（产品发布）、融资新闻 RSS（TechCrunch/Google News）、VC portfolio 页 diff、飞书 / 企业微信 webhook（周报外发）。都写好了插拔点，配上 key/URL 即启用。</p>
          </Card>
          <Card>
            <div className="text-sm font-medium" style={{ color: "#e06c75" }}>明确不做</div>
            <p className="mt-1 text-sm text-[var(--muted)]">X/Twitter（API 贵且受限）、LinkedIn（无开放接口、条款敌对）、Crunchbase / PitchBook（付费）。不硬凑不可靠的源。</p>
          </Card>
        </div>
      </section>
    </div>
  );
}

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
    why: "只有它能算出增长速度/加速度——这正是「领先信号」的核心。REST（star+json 头）。",
  },
  {
    name: "Hacker News",
    use: "跨源印证、讨论度、发现新项目/公司（Show/Launch HN）",
    addr: "hn.algolia.com/api/v1",
    why: "免费、无需鉴权，开发者受众里信号极强。REST 直接查。",
  },
  {
    name: "YC 公司库",
    use: "发现 YC 的 Agent 方向创业公司",
    addr: "yc-oss.github.io/api",
    why: "社区维护、每周自动更新的 YC 全量 JSON，结构化到公司识别都不用 LLM。直接拉静态 JSON。",
  },
  {
    name: "Kimi（Moonshot）",
    use: "判断层：分类、打分、写 4C、Copilot 问答",
    addr: "api.moonshot.ai/v1",
    why: "长上下文能一次读多篇 README/讨论，中英双语强。OpenAI 兼容接口，做了 provider 抽象可一键切别的模型。",
  },
  {
    name: "Tavily / Bing",
    use: "Copilot 联网搜索",
    addr: "api.tavily.com（或 Bing v7）",
    why: "Tavily 注册即得 key、免 Azure、便宜；做成多 provider，Bing 兜底。REST。",
  },
];
