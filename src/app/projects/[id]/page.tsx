import { notFound } from "next/navigation";
import { getRepo, getRepoSnapshots } from "@/lib/queries";
import { Card, ScoreBadge, Tag, AuthenticityBadge, Bar, StatPill, BackLink } from "@/components/ui";
import { Sparkline } from "@/components/Sparkline";
import { RecheckButton } from "@/components/RecheckButton";
import { FlameIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = getRepo(Number(id));
  if (!r) notFound();
  const snaps = getRepoSnapshots(r.id);
  const a = r.assessment;
  const s = r.signals;

  return (
    <div className="space-y-6">
      <BackLink href="/projects">返回项目列表</BackLink>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{r.full_name}</h1>
          <p className="mt-1 max-w-2xl text-[var(--muted)]">{r.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {r.primary_domain && <Tag tone="accent">{r.primary_domain}</Tag>}
            {r.secondary_domains.map((d) => (
              <Tag key={d} tone="lang">{d}</Tag>
            ))}
            <Tag tone="lang">{r.origin_lang}</Tag>
            {s?.breakout_flag ? <Tag><FlameIcon /> 爆发</Tag> : null}
            {r.authenticity && <AuthenticityBadge label={r.authenticity.label} />}
          </div>
          <a
            href={r.url}
            target="_blank"
            className="mt-3 inline-block text-sm text-[var(--accent)] underline"
          >
            GitHub ↗
          </a>
        </div>
        {a && <ScoreBadge score={a.final_score} label="综合评分" />}
      </div>

      {/* 信号 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill label="Stars" value={s?.stars ?? "-"} />
        <StatPill label="7日速度" value={`${s?.star_velocity_7d.toFixed(1) ?? 0}/天`} />
        <StatPill label="相对增长" value={`${Math.round((s?.growth_rate ?? 0) * 100)}%`} />
        <StatPill label="跨源印证" value={`${s?.corroboration_count ?? 0} 源`} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* LLM 评估 */}
        <Card className="md:col-span-2">
          <h2 className="mb-3 font-semibold">LLM 潜力评估</h2>
          {a ? (
            <>
              <p className="text-sm">{a.thesis}</p>
              <div className="mt-2 text-xs text-[var(--muted)]">类比：{a.comparable_to}</div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {(Object.keys(a.subscores) as (keyof typeof a.subscores)[]).map((k) => (
                  <div key={k}>
                    <div className="flex justify-between text-[11px] text-[var(--muted)]">
                      <span>{k}</span>
                      <span>{a.subscores[k]}</span>
                    </div>
                    <Bar value={a.subscores[k]} />
                  </div>
                ))}
              </div>
              {a.risks.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-medium text-[var(--muted)]">风险</div>
                  <ul className="mt-1 list-disc pl-5 text-sm">
                    {a.risks.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-4 text-[11px] text-[var(--muted)]">
                provider={a.provider} · prompt={a.prompt_version}
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">尚未评估。</p>
          )}
        </Card>

        {/* star 趋势 */}
        <Card>
          <h2 className="mb-3 font-semibold">Star 趋势</h2>
          <Sparkline points={snaps.map((x) => x.stars)} />
          <div className="mt-2 text-xs text-[var(--muted)]">{snaps.length} 个快照</div>
        </Card>
      </div>

      {/* 真实性核查 */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">L2 真实性核查</h2>
          {r.authenticity && <AuthenticityBadge label={r.authenticity.label} />}
        </div>
        {r.authenticity ? (
          <>
            {r.authenticity.flags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {r.authenticity.flags.map((f) => (
                  <span key={f} className="rounded border border-[var(--border)] bg-[var(--accent-soft)] px-2 py-0.5 text-xs text-[var(--muted)]">
                    {f}
                  </span>
                ))}
              </div>
            )}
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {r.authenticity.evidence.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-[var(--muted)]">未核查。</p>
        )}
        <div className="mt-4">
          <RecheckButton repoId={r.id} />
        </div>
        <p className="mt-2 text-[11px] text-[var(--muted)]">
          静态核查（分析文件结构 / README / commit 元数据，不执行代码）。沙箱实跑为可选路径（RADAR_SANDBOX_RUN）。
        </p>
      </Card>

      {/* 跨源提及 */}
      <Card>
        <h2 className="mb-3 font-semibold">跨源提及（{r.mentions.length}）</h2>
        {r.mentions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">暂无 HN / Reddit / PH 提及记录。</p>
        ) : (
          <ul className="space-y-2">
            {r.mentions.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
                <a href={m.url} target="_blank" className="truncate text-[var(--accent)] hover:underline">
                  {m.title}
                </a>
                <span className="shrink-0 text-xs text-[var(--muted)]">
                  {m.source} · {m.score}分 · {m.num_comments}评论
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
