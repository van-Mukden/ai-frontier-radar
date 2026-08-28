import Link from "next/link";
import { getRepoRows, type RepoSort } from "@/lib/queries";
import { Card, ScoreBadge, Tag, AuthenticityBadge, Bar } from "@/components/ui";
import { FlameIcon } from "@/components/icons";
import { chipFactory, FilterRow } from "@/components/filters";
import { TECH_DOMAINS, ORIGIN_LANGS } from "@/config/scoring";

export const dynamic = "force-dynamic";

type ProjectSP = {
  lang?: string;
  domain?: string;
  breakout?: string;
  sort?: string;
  minScore?: string;
  minStars?: string;
  corrob?: string;
  hidesus?: string;
  since?: string;
};

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<ProjectSP> }) {
  const sp = await searchParams;
  const rows = getRepoRows({
    origin_lang: sp.lang,
    domain: sp.domain,
    breakoutOnly: sp.breakout === "1",
    minScore: sp.minScore ? Number(sp.minScore) : undefined,
    minStars: sp.minStars ? Number(sp.minStars) : undefined,
    hasCorroboration: sp.corrob === "1",
    hideSuspicious: sp.hidesus === "1",
    sinceDays: sp.since ? Number(sp.since) : undefined,
    sort: (sp.sort as RepoSort) ?? "score",
    limit: 100,
  });

  const chip = chipFactory("/projects", sp);
  const anyActive = Object.values(sp).some(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">开源项目 Tracker</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            按潜力评分排序（potential 0.5 + momentum 0.35 + 跨源印证 0.15）。可疑·充数已惩罚。
          </p>
        </div>
        {anyActive && (
          <Link href="/projects" className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
            清空筛选 ✕
          </Link>
        )}
      </div>

      {/* 筛选 */}
      <Card className="space-y-2.5">
        <FilterRow label="排序">
          {chip("sort", "score", "综合分")}
          {chip("sort", "momentum", "势能")}
          {chip("sort", "velocity", "star 速度")}
          {chip("sort", "stars", "star 总数")}
        </FilterRow>
        <FilterRow label="语言">
          {ORIGIN_LANGS.map((l) => chip("lang", l, l))}
        </FilterRow>
        <FilterRow label="评分">
          {chip("minScore", "60", "≥60")}
          {chip("minScore", "75", "≥75")}
        </FilterRow>
        <FilterRow label="Star">
          {chip("minStars", "100", "≥100")}
          {chip("minStars", "500", "≥500")}
          {chip("minStars", "1000", "≥1k")}
        </FilterRow>
        <FilterRow label="新增">
          {chip("since", "30", "近 30 天")}
          {chip("since", "90", "近 90 天")}
        </FilterRow>
        <FilterRow label="信号">
          {chip("breakout", "1", "仅爆发", <FlameIcon key="f" />)}
          {chip("corrob", "1", "有跨源印证")}
          {chip("hidesus", "1", "隐藏可疑·充数")}
        </FilterRow>
        <FilterRow label="领域">
          {TECH_DOMAINS.map((d) => chip("domain", d, d))}
        </FilterRow>
      </Card>

      <div className="text-xs text-[var(--muted)]">共 {rows.length} 个项目</div>

      <div className="space-y-3">
        {rows.map((r) => {
          const sub = r.assessment?.subscores;
          return (
            <Link key={r.id} href={`/projects/${r.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <div className="flex items-start gap-4">
                  <ScoreBadge score={r.assessment?.final_score ?? 0} label="综合" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{r.full_name}</span>
                      <span className="text-xs text-[var(--muted)]">★{r.signals?.stars}</span>
                      {r.signals?.breakout_flag ? <Tag><FlameIcon /> 爆发</Tag> : null}
                      {r.authenticity && r.authenticity.label !== "未测" && (
                        <AuthenticityBadge label={r.authenticity.label} />
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-[var(--muted)]">
                      {r.assessment?.one_liner ?? r.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {r.primary_domain && <Tag tone="accent">{r.primary_domain}</Tag>}
                      <Tag tone="lang">{r.origin_lang}</Tag>
                      <span className="text-xs text-[var(--muted)]">
                        7日 {r.signals?.star_velocity_7d.toFixed(1)}/天 · 印证 {r.signals?.corroboration_count} 源
                      </span>
                    </div>
                  </div>
                  {sub && (
                    <div className="hidden w-40 shrink-0 space-y-1.5 sm:block">
                      {(["novelty", "momentum", "adoption"] as const).map((k) => (
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
            <p className="text-sm text-[var(--muted)]">没有匹配的项目。先运行 <code>npm run ingest</code>，或放宽筛选。</p>
          </Card>
        )}
      </div>
    </div>
  );
}
