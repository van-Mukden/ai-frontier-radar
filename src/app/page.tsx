import Link from "next/link";
import { getRepoRows, getStartupRows, counts, getLatestDigest, getStartupGraph } from "@/lib/queries";
import { Card, ScoreBadge, Tag, AuthenticityBadge } from "@/components/ui";
import { WrenchIcon, RocketIcon, FlameIcon, SendIcon, NetworkIcon } from "@/components/icons";
import { StartupGraph } from "@/components/StartupGraph";
import { DotWave } from "@/components/DotWave";
import { DigestActions } from "@/components/DigestActions";
import { CopilotEntry } from "@/components/CopilotEntry";

export const dynamic = "force-dynamic";

export default function Home() {
  const c = counts();
  const topRepos = getRepoRows({ limit: 3 });
  const breakouts = getRepoRows({ breakoutOnly: true, limit: 4 });
  const topStartups = getStartupRows({ limit: 3 });
  const digest = getLatestDigest();
  const graph = getStartupGraph({ topN: 12 });

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

      {/* Copilot 对话入口（hero 下 / 周报上），70% 居中 */}
      <section className="mx-auto w-full sm:w-[70%]">
        <h2
          className="mb-3 text-center text-lg font-semibold"
          style={{ color: "var(--brand)" }}
        >
          Frontier Copilot
        </h2>
        <CopilotEntry />
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
              由 Frontier Radar Agent 自动汇总，评分方法详情请参考 <Link href="/methodology" className="text-[var(--brand)] hover:underline">README</Link>
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
                        {r.signals?.breakout_flag ? <Tag><FlameIcon /> 爆发</Tag> : null}
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

      {breakouts.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><FlameIcon size={16} /> 本周爆发</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {breakouts.map((r) => (
              <Link key={r.id} href={`/projects/${r.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <div className="truncate text-sm font-medium">{r.name}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    +{Math.round((r.signals?.growth_rate ?? 0) * 100)}% / 7天
                  </div>
                  <div className="mt-2 text-xs text-[var(--muted)]">
                    ★{r.signals?.stars} · {r.signals?.star_velocity_7d.toFixed(1)}/天
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DigestMarkdown({ md }: { md: string }) {
  // 轻量渲染：**加粗**、[text](url)、列表
  const lines = md.split("\n").filter((l) => l.trim());
  return (
    <div className="space-y-1 text-sm">
      {lines.map((l, i) => {
        const html = l
          .replace(/^#+\s*/, "")
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="text-[var(--accent)] underline">$1</a>')
          .replace(/^_(.+)_$/, '<em class="text-[var(--muted)]">$1</em>');
        return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );
}
