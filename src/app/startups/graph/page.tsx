import Link from "next/link";
import { getStartupGraph } from "@/lib/queries";
import { StartupGraph } from "@/components/StartupGraph";
import { Card, BackLink } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StartupGraphPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const sp = await searchParams;
  const data = getStartupGraph({ region: sp.region });

  return (
    <div className="space-y-6">
      <BackLink href="/startups">返回公司列表</BackLink>

      <div>
        <h1 className="text-2xl font-bold">潜力 Startup 关系图谱</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          纳入全部已收录的 Agent 公司（可用「潜力得分 ≥」滑竿收敛）。<strong>业务领域相同连实线</strong>、
          <strong>技术栈相同连虚线</strong>——一眼看出谁跟谁在同一战场、谁共用同一套技术路线。
        </p>
      </div>

      {data.nodes.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">
            还没有公司数据。先运行 <code className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5">npm run ingest -- --only startups</code>。
          </p>
        </Card>
      ) : (
        <>
          <StartupGraph data={data} />
          <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
            <span>共 {data.nodes.length} 家公司</span>
            <span>· 业务连线 {data.links.filter((l) => l.kind === "business").length} 条</span>
            <span>· 技术连线 {data.links.filter((l) => l.kind === "tech").length} 条</span>
            <Link href="/startups" className="text-[var(--accent)]">
              查看列表 →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
