import Link from "next/link";
import { getStartupRows, type StartupSort } from "@/lib/queries";
import { Card, ScoreBadge, Tag, Bar } from "@/components/ui";
import { NetworkIcon } from "@/components/icons";
import { chipFactory, FilterRow } from "@/components/filters";
import { ALLOWED_REGIONS, AGENT_SUBCATEGORIES } from "@/config/scoring";

export const dynamic = "force-dynamic";

function sourceLabel(source: string | null, batch: string | null): string {
  if (source === "yc") return `来源 · YC${batch ? " " + batch : ""}`;
  if (source === "hn") return "来源 · Hacker News";
  if (source === "curated") return "来源 · 旗舰锚点";
  return source ? `来源 · ${source}` : "";
}

type StartupSP = {
  region?: string;
  sub?: string;
  stage?: string;
  tier?: string;
  sort?: string;
};

export default async function StartupsPage({ searchParams }: { searchParams: Promise<StartupSP> }) {
  const sp = await searchParams;
  const rows = getStartupRows({
    region: sp.region,
    subcategory: sp.sub,
    stage: sp.stage,
    topTierOnly: sp.tier === "1",
    sort: (sp.sort as StartupSort) ?? "score",
    limit: 100,
  });

  const chip = chipFactory("/startups", sp);
  const anyActive = Object.values(sp).some(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Startup Tracker</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            只看 Agent 方向、地域限中国 / 美国 / 日本。评分 = 潜力 0.6 + 势能(轮次速度·投资方层级) 0.4。研报 4C 见详情。
          </p>
        </div>
        <Link
          href="/startups/graph"
          className="inline-flex shrink-0 items-center gap-2 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--accent-soft)]"
        >
          <NetworkIcon size={15} /> 关系图谱 →
        </Link>
      </div>

      <Card className="space-y-2.5">
        {anyActive && (
          <div className="flex justify-end">
            <Link href="/startups" className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
              清空筛选 ✕
            </Link>
          </div>
        )}
        <FilterRow label="排序">
          {chip("sort", "score", "综合分")}
          {chip("sort", "momentum", "势能")}
          {chip("sort", "funding", "融资额")}
        </FilterRow>
        <FilterRow label="地域">
          {ALLOWED_REGIONS.map((r) => chip("region", r, r))}
        </FilterRow>
        <FilterRow label="轮次">
          {chip("stage", "Seed", "Seed")}
          {chip("stage", "Series A", "A 轮")}
          {chip("stage", "Series B", "B 轮")}
        </FilterRow>
        <FilterRow label="投资">
          {chip("tier", "1", "顶级基金领投")}
        </FilterRow>
        <FilterRow label="子类">
          {AGENT_SUBCATEGORIES.map((s) => chip("sub", s, s))}
        </FilterRow>
      </Card>

      <div className="space-y-3">
        {rows.map((s) => {
          const latest = s.rounds[s.rounds.length - 1];
          const sub = s.assessment?.subscores;
          return (
            <Link key={s.id} href={`/startups/${s.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <div className="flex items-start gap-4">
                  <ScoreBadge score={s.assessment?.final_score ?? 0} label="综合" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{s.name}</span>
                      <Tag tone="lang">{s.region}</Tag>
                      {s.agent_subcategory && <Tag tone="accent">{s.agent_subcategory}</Tag>}
                      <span className="text-[10px] text-[var(--faint)]">{sourceLabel(s.source, s.batch)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                      {s.assessment?.thesis ?? s.description}
                    </p>
                    {latest && (
                      <div className="mt-2 text-xs text-[var(--muted)]">
                        最近：{latest.stage}
                        {latest.amount_usd ? ` $${(latest.amount_usd / 1e6).toFixed(0)}M` : ""} · 领投 {latest.lead_investors.join("/")}
                      </div>
                    )}
                  </div>
                  {sub && (
                    <div className="hidden w-40 shrink-0 space-y-1.5 sm:block">
                      {(["team", "funding_signal", "moat_vs_big_labs"] as const).map((k) => (
                        <div key={k}>
                          <div className="flex justify-between text-[10px] text-[var(--muted)]">
                            <span>{k}</span>
                            <span>{sub[k]}</span>
                          </div>
                          <Bar value={sub[k]} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
        {rows.length === 0 && (
          <Card>
            <p className="text-sm text-[var(--muted)]">没有匹配的公司。</p>
          </Card>
        )}
      </div>
    </div>
  );
}
