import { notFound } from "next/navigation";
import { getStartup } from "@/lib/queries";
import { Card, ScoreBadge, Tag, Bar, StatPill, BackLink } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StartupDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = getStartup(Number(id));
  if (!s) notFound();
  const a = s.assessment;
  const totalRaised = s.rounds.reduce((t, r) => t + (r.amount_usd ?? 0), 0);

  const fourc = a?.fourc as
    | { company: string; customers: string; competitors: string; collaborators: string }
    | undefined;

  return (
    <div className="space-y-6">
      <BackLink href="/startups">返回公司列表</BackLink>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{s.name}</h1>
          <p className="mt-1 max-w-2xl text-[var(--muted)]">{s.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Tag tone="lang">{s.region}</Tag>
            {s.agent_subcategory && <Tag tone="accent">{s.agent_subcategory}</Tag>}
          </div>
          {s.url && (
            <a href={s.url} target="_blank" className="mt-3 inline-block text-sm text-[var(--accent)] underline">
              官网 ↗
            </a>
          )}
        </div>
        {a && <ScoreBadge score={a.final_score} label="综合评分" />}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill label="累计融资" value={totalRaised ? `$${(totalRaised / 1e6).toFixed(0)}M` : "-"} />
        <StatPill label="轮次数" value={s.rounds.length} />
        <StatPill label="潜力分" value={a?.potential_score ?? "-"} />
        <StatPill label="势能分" value={a?.momentum_score ?? "-"} />
      </div>

      {/* 4C */}
      {fourc && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">研报 4C 分析</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["Company 公司", fourc.company],
                ["Customers 客户", fourc.customers],
                ["Competitors 竞争", fourc.competitors],
                ["Collaborators 协作方", fourc.collaborators],
              ] as const
            ).map(([title, body]) => (
              <Card key={title}>
                <div className="text-sm font-semibold text-[var(--accent)]">{title}</div>
                <p className="mt-1 text-sm">{body}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <h2 className="mb-3 font-semibold">投资判断</h2>
          {a ? (
            <>
              <p className="text-sm">{a.thesis}</p>
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
              <div className="mt-4 text-[11px] text-[var(--muted)]">provider={a.provider}</div>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">尚未评估。</p>
          )}
        </Card>

        {/* 融资时间线 */}
        <Card>
          <h2 className="mb-3 font-semibold">融资时间线</h2>
          <ol className="relative space-y-4 border-l border-[var(--border)] pl-4">
            {s.rounds.map((r, i) => (
              <li key={i}>
                <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-[var(--accent)]" />
                <div className="text-sm font-medium">
                  {r.stage} {r.amount_usd ? `· $${(r.amount_usd / 1e6).toFixed(0)}M` : ""}
                </div>
                <div className="text-xs text-[var(--muted)]">{r.date}</div>
                <div className="text-xs text-[var(--muted)]">领投 {r.lead_investors.join(" / ")}</div>
                {r.source_url && (
                  <a href={r.source_url} target="_blank" className="text-xs text-[var(--accent)] underline">
                    来源 ↗
                  </a>
                )}
              </li>
            ))}
            {s.rounds.length === 0 && <li className="text-sm text-[var(--muted)]">暂无融资记录</li>}
          </ol>
        </Card>
      </div>

      <p className="text-[11px] text-[var(--muted)]">
        公司发现来自 YC 公司库（每周更新）+ HN Launch/Show HN + 少量旗舰锚点；评分/4C 由 Kimi 生成。融资数字为公开报道口径，以官方 / 权威媒体为准。
      </p>
    </div>
  );
}
