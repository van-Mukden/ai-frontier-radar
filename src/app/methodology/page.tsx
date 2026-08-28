import { Card } from "@/components/ui";
import {
  counts,
  repoDomainCounts,
  startupRegionCounts,
  startupSourceCounts,
} from "@/lib/queries";
import { REGION_COLORS } from "@/config/scoring";

export const dynamic = "force-dynamic";

const BRAND = "#5ea9ff";

function Stat({ n, label, color = BRAND }: { n: number; label: string; color?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <div className="text-2xl font-bold tabular-nums" style={{ color }}>
        {n}
      </div>
      <div className="mt-0.5 text-xs text-[var(--muted)]">{label}</div>
    </div>
  );
}

function BarList({
  data,
  colorOf,
}: {
  data: { key: string; n: number }[];
  colorOf?: (k: string) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.n));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.key} className="flex items-center gap-3">
          <div className="w-28 shrink-0 truncate text-xs text-[var(--muted)]">{d.key}</div>
          <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${(d.n / max) * 100}%`, background: colorOf?.(d.key) ?? BRAND }}
            />
          </div>
          <div className="w-6 text-right text-xs tabular-nums text-[var(--foreground)]">{d.n}</div>
        </div>
      ))}
      {data.length === 0 && <div className="text-xs text-[var(--muted)]">暂无数据，先运行采集。</div>}
    </div>
  );
}

function Flow({ steps, accent }: { steps: string[]; accent: string }) {
  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex max-w-[220px] items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ background: accent, color: "#0a0d12" }}
            >
              {i + 1}
            </span>
            <span className="text-xs leading-snug text-[var(--foreground)]">{s}</span>
          </div>
          {i < steps.length - 1 && (
            <svg width="18" height="12" viewBox="0 0 18 12" className="shrink-0">
              <path d="M0 6h13M13 6l-4-4M13 6l-4 4" fill="none" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

const DOMAIN_PALETTE = ["#5ea9ff", "#e5c07b", "#98c379", "#c678dd", "#56b6c2", "#e06c75", "#8a8a8a"];

export default function Readme() {
  const c = counts();
  const domains = repoDomainCounts();
  const regions = startupRegionCounts();
  const sources = startupSourceCounts();
  const domainColor = (k: string) => DOMAIN_PALETTE[Math.abs(hash(k)) % DOMAIN_PALETTE.length];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">README</h1>
        <p className="mt-1 text-[var(--muted)]">
          这是什么、怎么工作、数据从哪来 —— 一页说清楚。核心一句话：<span className="text-[var(--foreground)]">在爆火之前，先一步发现有潜力的 AI 开源项目和 Agent 创业公司。</span>
        </p>
      </div>

      {/* 本周数据 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">本周数据</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat n={c.repos} label="开源项目" />
          <Stat n={c.startups} label="创业公司" color="#98c379" />
          <Stat n={c.breakouts} label="本周爆发" color="#e5c07b" />
          <Stat n={c.mentions} label="跨源提及" color="#c678dd" />
          <Stat n={c.assessed} label="已 AI 评估" color="#56b6c2" />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card>
            <div className="mb-3 text-sm font-medium">开源项目 · 领域分布</div>
            <BarList data={domains.slice(0, 6)} colorOf={domainColor} />
          </Card>
          <Card>
            <div className="mb-3 text-sm font-medium">创业公司 · 地域分布</div>
            <BarList data={regions} colorOf={(k) => REGION_COLORS[k] ?? BRAND} />
          </Card>
          <Card>
            <div className="mb-3 text-sm font-medium">创业公司 · 来源</div>
            <BarList
              data={sources.map((s) => ({ key: sourceName(s.key), n: s.n }))}
              colorOf={(k) => (k.includes("YC") ? "#e5c07b" : k.includes("Hacker") ? "#e06c75" : "#8a8a8a")}
            />
          </Card>
        </div>
      </section>

      {/* 怎么打分 —— flow chart */}
      <section>
        <h2 className="mb-1 text-lg font-semibold">两条产品线是怎么打分的</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">全流程自动，AI 全程参与判断，人只做最后取舍。</p>

        <Card className="mb-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: BRAND }} /> 开源项目
          </div>
          <Flow
            accent={BRAND}
            steps={[
              "每天扫 GitHub + Hacker News 的新项目",
              "算「涨得快不快」：看增速和加速度，不看总 star",
              "看被多少个平台同时讨论（跨源印证）",
              "AI 读 README，自动分中英文 + 技术领域",
              "AI 打潜力分：新颖度 / 势头 / 有没有人真用 / 团队 / 护城河",
              "AI 拉代码核查真假，识别「充数」仓库并扣分",
              "综合排名上榜 + 单列本周爆发",
            ]}
          />
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#98c379" }} /> 创业公司
          </div>
          <Flow
            accent="#98c379"
            steps={[
              "每周扫 YC 公司库 + Hacker News 发布帖",
              "只留中 / 美 / 日的 Agent 方向公司",
              "AI 写研报式 4C：公司 / 客户 / 竞争 / 协作方",
              "结合融资轮次速度 + 投资方声誉打分",
              "综合排名上榜 + 关系图谱",
            ]}
          />
        </Card>
      </section>

      {/* 核心判断逻辑 —— 通俗 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">怎么算「有潜力」</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <div className="text-sm font-medium" style={{ color: "#98c379" }}>看的是「领先信号」</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
              <li>涨得快不快（增长<span className="text-[var(--foreground)]">加速度</span>，不是绝对数量）</li>
              <li>是不是同时在好几个地方被讨论</li>
              <li>做的人 / 创始人背景硬不硬</li>
              <li>融资一轮接一轮的节奏</li>
            </ul>
          </Card>
          <Card>
            <div className="text-sm font-medium" style={{ color: "#e06c75" }}>不迷信「滞后指标」</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
              <li>绝对 star 高 —— 那是已经火过了</li>
              <li>已经见报的大额融资 —— 早就不便宜了</li>
              <li>名字响 / README 华丽 —— 可能是「充数」，会被核查扣分</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* 怎么证明有效 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">怎么证明它真的有用</h2>
        <Card>
          <p className="text-sm text-[var(--muted)]">
            每个被标为「高潜」的项目 / 公司都记下日期，过几周再回头核对是不是真的起来了（star 增速、拿到新一轮融资、被收购、进入主流视野）。和「只按 star 增量排序」的朴素做法比命中率 —— 这才是这个工具的价值证明，而不是当下的分数好看。
          </p>
        </Card>
      </section>

      {/* 数据来源 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">数据从哪来（诚实边界）</h2>
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <Card>
            <div className="font-medium" style={{ color: "#98c379" }}>已直连（免费公开）</div>
            <p className="mt-1 text-[var(--muted)]">GitHub、Hacker News、YC 公司库（每周更新）。</p>
          </Card>
          <Card>
            <div className="font-medium" style={{ color: "#e5c07b" }}>留了接口 / 后续接</div>
            <p className="mt-1 text-[var(--muted)]">Reddit、Product Hunt、融资新闻 RSS、飞书 / 企业微信推送。</p>
          </Card>
          <Card>
            <div className="font-medium" style={{ color: "#e06c75" }}>明确不做</div>
            <p className="mt-1 text-[var(--muted)]">X/Twitter（贵）、LinkedIn（无接口）、Crunchbase（付费）。</p>
          </Card>
        </div>
        <p className="mt-3 text-xs text-[var(--faint)]">
          判断层用 Kimi（k2.6），无 key 时自动离线降级，保证流程随时能跑。融资金额为公开报道口径，以官方 / 权威媒体为准。
        </p>
      </section>
    </div>
  );
}

function sourceName(key: string): string {
  if (key === "yc") return "YC 公司库";
  if (key === "hn") return "Hacker News";
  if (key === "curated") return "旗舰锚点";
  return key;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
