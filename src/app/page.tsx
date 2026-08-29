import Link from "next/link";
import {
  getRepoRows,
  getStartupRows,
  counts,
  getLatestDigest,
  getStartupGraph,
  repoDomainCounts,
  startupRegionCounts,
  startupSourceCounts,
} from "@/lib/queries";
import { Card, ScoreBadge, Tag, AuthenticityBadge } from "@/components/ui";
import { Stat, BarList, hashColor } from "@/components/dataviz";
import { REGION_COLORS } from "@/config/scoring";
import { WrenchIcon, RocketIcon, SendIcon, NetworkIcon } from "@/components/icons";
import { StartupGraph } from "@/components/StartupGraph";
import { DotWave } from "@/components/DotWave";
import { DigestActions } from "@/components/DigestActions";
import { CopilotEntry } from "@/components/CopilotEntry";

export const dynamic = "force-dynamic";

export default function Home() {
  const c = counts();
  const topRepos = getRepoRows({ limit: 3 });
  const topStartups = getStartupRows({ limit: 3 });
  const digest = getLatestDigest();
  const graph = getStartupGraph();

  const empty = c.repos === 0;

  return (
    <div className="space-y-8">
      {/* Hero：全宽点状波浪动画 + 科技感英文大标题 */}
      <section className="relative -mx-6 overflow-hidden border-y border-[var(--border)]" style={{ background: "#080a0e" }}>
        <DotWave />
        <div className="relative flex min-h-[190px] flex-col items-center justify-center px-6 py-14 text-center">
          <h1
            className="text-4xl font-extrabold tracking-[0.14em] sm:text-6xl"
            style={{
              fontFamily: "var(--font-tech), var(--font-space-grotesk), sans-serif",
              background: "linear-gradient(180deg,#ffffff 0%,#9fc4ff 120%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AI FRONTIER RADAR
          </h1>
        </div>
      </section>

      {/* Copilot 对话入口（hero 下），70% 居中 */}
      <section className="mx-auto w-full sm:w-[70%]">
        <h2 className="mb-3 text-center text-lg font-semibold" style={{ color: "var(--brand)" }}>
          Frontier Copilot
        </h2>
        <CopilotEntry />
      </section>

      {/* 本周数据面板（Copilot 下方） */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">本周数据</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat n={c.repos} label="开源项目" />
          <Stat n={c.startups} label="创业公司" color="#98c379" />
          <Stat n={c.breakouts} label="本周爆发" color="#e5c07b" />
          <Stat n={c.mentions} label="跨源提及" color="#c678dd" />
          <Stat n={c.assessed} label="已 AI 评估" color="#56b6c2" />
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <Card>
            <div className="mb-3 text-sm font-medium">开源项目 · 领域分布</div>
            <BarList data={repoDomainCounts().slice(0, 6)} colorOf={hashColor} />
          </Card>
          <Card>
            <div className="mb-3 text-sm font-medium">创业公司 · 地域分布</div>
            <BarList data={startupRegionCounts()} colorOf={(k) => REGION_COLORS[k] ?? "#5ea9ff"} />
          </Card>
          <Card>
            <div className="mb-3 text-sm font-medium">创业公司 · 来源</div>
            <BarList
              data={startupSourceCounts().map((s) => ({ key: srcName(s.key), n: s.n }))}
              colorOf={(k) => (k.includes("YC") ? "#e5c07b" : k.includes("Hacker") ? "#e06c75" : "#8a8a8a")}
            />
          </Card>
        </div>
      </section>

      {empty && (
        <Card>
          <p className="font-medium">还没有数据。</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            运行 <code className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5">npm run ingest</code> 采集真实 GitHub / HN 数据。无 Kimi key 时自动用离线 mock 完成评分。
          </p>
        </Card>
      )}

      {digest && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <SendIcon size={16} style={{ color: "var(--brand)" }} /> AI 前沿周报
            <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-normal text-[var(--muted)]">每周更新</span>
          </h2>
          <Card>
            <DigestMarkdown md={(digest.payload as { markdown?: string }).markdown ?? ""} />
            <p className="mt-3 text-[11px] text-[var(--faint)]">
              由 Frontier Radar Agent 自动汇总，评分方法详情请参考 <Link href="/docs" className="text-[var(--brand)] hover:underline">文档中心</Link>
            </p>
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <DigestActions markdown={(digest.payload as { markdown?: string }).markdown ?? ""} />
            </div>
          </Card>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <div className="relative mb-4 flex items-center justify-center">
            <h2 className="flex items-center gap-3 text-4xl font-bold"><WrenchIcon size={30} strokeWidth={1.5} /> Top 开源项目</h2>
            <Link href="/projects" className="absolute right-0 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">全部 →</Link>
          </div>
          <div className="space-y-3">
            {topRepos.map((r) => (
              <Link key={r.id} href={`/projects/${r.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <ScoreBadge score={r.assessment?.final_score ?? 0} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{r.full_name}</span>
                        {r.signals?.breakout_flag ? <span title="本周爆发" className="text-base leading-none">🔥</span> : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                        {r.assessment?.one_liner ?? r.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {r.primary_domain && <Tag tone="accent">{r.primary_domain}</Tag>}
                        <Tag tone="lang">{r.origin_lang}</Tag>
                        {r.authenticity && r.authenticity.label !== "未测" && (
                          <AuthenticityBadge label={r.authenticity.label} />
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="relative mb-4 flex items-center justify-center">
            <h2 className="flex items-center gap-3 text-4xl font-bold"><RocketIcon size={30} strokeWidth={1.5} /> Top Startup</h2>
            <Link href="/startups" className="absolute right-0 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">全部 →</Link>
          </div>
          <div className="space-y-3">
            {topStartups.map((s) => (
              <Link key={s.id} href={`/startups/${s.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <ScoreBadge score={s.assessment?.final_score ?? 0} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{s.name}</span>
                        <Tag tone="lang">{s.region}</Tag>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                        {s.assessment?.thesis ?? s.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {s.agent_subcategory && <Tag tone="accent">{s.agent_subcategory}</Tag>}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {graph.nodes.length > 0 && (
        <section>
          <div className="relative mb-4 flex items-center justify-center">
            <h2 className="flex items-center gap-3 text-4xl font-bold"><NetworkIcon size={28} strokeWidth={1.5} /> 潜力 Startup 关系图谱</h2>
            <Link href="/startups/graph" className="absolute right-0 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">展开 →</Link>
          </div>
          <StartupGraph data={graph} />
        </section>
      )}

    </div>
  );
}

function srcName(key: string): string {
  if (key === "yc") return "YC 公司库";
  if (key === "hn") return "Hacker News";
  if (key === "curated") return "旗舰锚点";
  if (key === "copilot") return "Copilot 新增";
  if (key === "news") return "融资新闻";
  return key;
}

function DigestMarkdown({ md }: { md: string }) {
  // 轻量渲染：标题、**加粗** 小节头、"- "/"1." 列表逐行、正文段落；每个项目/公司各占一行
  const inline = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="text-[var(--accent)] underline">$1</a>');
  const lines = md.split("\n").filter((l) => l.trim());
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((l, i) => {
        const line = l.trim();
        // 主标题
        if (/^#{1,6}\s/.test(line)) {
          return (
            <p key={i} className="text-[13px] font-semibold text-[var(--muted)]" dangerouslySetInnerHTML={{ __html: inline(line.replace(/^#+\s*/, "")) }} />
          );
        }
        // 小节标题（整行 **...**）
        if (/^\*\*.+\*\*$/.test(line)) {
          return (
            <p key={i} className="mt-2 font-semibold" dangerouslySetInnerHTML={{ __html: inline(line) }} />
          );
        }
        // 列表项："- x" 或 "1. x"
        const li = line.match(/^(?:[-*]|\d+\.)\s+(.*)/);
        if (li) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--brand)]" />
              <span className="min-w-0" dangerouslySetInnerHTML={{ __html: inline(li[1]) }} />
            </div>
          );
        }
        // 普通段落（研判等）
        return <p key={i} className="text-[var(--foreground)]" dangerouslySetInnerHTML={{ __html: inline(line) }} />;
      })}
    </div>
  );
}
