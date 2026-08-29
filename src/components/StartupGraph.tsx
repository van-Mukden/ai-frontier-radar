"use client";

import { useEffect, useRef, useState } from "react";
import type { NodeObject, LinkObject } from "force-graph";
import type { StartupGraphData, GraphNode } from "@/lib/queries";
import { REGION_COLORS, ALLOWED_REGIONS } from "@/config/scoring";

type GNode = NodeObject & GraphNode;
type GLink = LinkObject<GNode> & { kind: "business" | "tech"; label: string };

const BUSINESS_COLOR = "rgba(255,255,255,0.30)"; // 白细线，实线（业务）
const TECH_COLOR = "rgba(255,255,255,0.16)"; // 白细线，虚线（技术）

export function StartupGraph({ data }: { data: StartupGraphData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [showTech, setShowTech] = useState(true);
  const [minScore, setMinScore] = useState(0); // 只看潜力得分 ≥ 此值的公司

  const hiddenKey = Object.keys(hidden)
    .filter((k) => hidden[k])
    .sort()
    .join(",");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let graph: {
      _destructor: () => void;
      width: (n: number) => unknown;
      d3Force: (name: string) => { strength: (v: number) => void } | undefined;
      d3ReheatSimulation: () => void;
    } | null = null;
    let ro: ResizeObserver | null = null;
    let cancelled = false;

    (async () => {
      const { default: ForceGraph } = await import("force-graph");
      if (cancelled || !containerRef.current) return;

      // 按当前控件过滤：地域隐藏 + 潜力得分门槛 → 连带删边；技术连线开关
      const nodes = data.nodes.filter((n) => !hidden[n.region ?? ""] && n.score >= minScore);
      const ids = new Set(nodes.map((n) => n.id));
      const links = data.links.filter(
        (l) =>
          ids.has(l.source as number) &&
          ids.has(l.target as number) &&
          (showTech || l.kind !== "tech")
      );
      const graphData = {
        nodes: nodes.map((n) => ({ ...n })),
        links: links.map((l) => ({ ...l })),
      };

      const g = new ForceGraph<GNode, GLink>(containerRef.current)
        .graphData(graphData)
        .backgroundColor("transparent")
        .width(containerRef.current.clientWidth)
        .height(560)
        .nodeRelSize(1)
        .nodeLabel(
          (n: GNode) =>
            `<div style="font-size:12px;line-height:1.5">
               <b>${n.name}</b><br/>
               业务：${n.business ?? "-"}<br/>
               技术栈：${n.tech.length ? n.tech.join("、") : "-"}<br/>
               评分：${Math.round(n.score)}
             </div>`
        )
        .linkColor((l: GLink) => (l.kind === "business" ? BUSINESS_COLOR : TECH_COLOR))
        .linkLineDash((l: GLink) => (l.kind === "tech" ? [3, 3] : null))
        .linkWidth((l: GLink) => (l.kind === "business" ? 1.8 : 1))
        .linkLabel(
          (l: GLink) =>
            `<div style="font-size:12px;line-height:1.5;max-width:220px">
               <b>${l.kind === "business" ? "业务领域相同" : "技术栈相同"}</b><br/>
               <span style="color:#9aa">${l.kind === "business" ? "领域" : "共享技术栈"}：</span>${l.label || "-"}
             </div>`
        )
        .linkDirectionalParticles(0)
        .nodeCanvasObject((node: GNode, ctx: CanvasRenderingContext2D, scale: number) => {
          const r = 2 + node.score / 22;
          const color = REGION_COLORS[node.region ?? ""] ?? "#8c8c8c";
          const cx = node.x ?? 0;
          const cy = node.y ?? 0;

          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
          // 白色节点在黑底上加一圈极淡描边提亮
          if (color === "#f0f0f0") {
            ctx.lineWidth = 1 / scale;
            ctx.strokeStyle = "rgba(255,255,255,0.35)";
            ctx.stroke();
          }

          const fontSize = Math.max(11 / scale, 3);
          ctx.font = `${fontSize}px var(--font-space-grotesk), ui-sans-serif, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = "#6b6b6b";
          ctx.fillText(node.name, cx, cy + r + 2);
        })
        .linkHoverPrecision(6)
        .cooldownTicks(120);

      // 力度写死为最大（最疏朗布局）
      const chargeForce = g.d3Force("charge");
      if (chargeForce) chargeForce.strength(-130);
      // 边拉长：加大 link 距离，节点更疏朗
      const linkForce = g.d3Force("link") as { distance?: (v: number) => void } | undefined;
      if (linkForce?.distance) linkForce.distance(95);

      g.onEngineStop(() => g.zoomToFit(400, 60));
      graph = g as unknown as typeof graph;

      ro = new ResizeObserver(() => {
        if (containerRef.current && graph) graph.width(containerRef.current.clientWidth);
      });
      ro.observe(containerRef.current);
    })();

    return () => {
      cancelled = true;
      if (ro) ro.disconnect();
      if (graph) graph._destructor();
    };
  }, [data, hiddenKey, showTech, minScore]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* 控件 */}
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--faint)]">地域</span>
          {ALLOWED_REGIONS.map((r) => {
            const on = !hidden[r];
            return (
              <button
                key={r}
                onClick={() => setHidden((h) => ({ ...h, [r]: on }))}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors ${
                  on
                    ? "border-[var(--border-strong)] text-[var(--foreground)]"
                    : "border-[var(--border)] text-[var(--faint)]"
                }`}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: REGION_COLORS[r], opacity: on ? 1 : 0.35 }}
                />
                {r}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowTech((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 transition-colors ${
            showTech
              ? "border-[var(--border-strong)] text-[var(--foreground)]"
              : "border-[var(--border)] text-[var(--faint)]"
          }`}
        >
          <svg width="24" height="6">
            <line x1="0" y1="3" x2="24" y2="3" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 3" />
          </svg>
          技术连线
        </button>

        <label className="flex items-center gap-2 text-[var(--faint)]">
          潜力得分 ≥ <span className="w-5 tabular-nums text-[var(--foreground)]">{minScore}</span>
          <input
            type="range"
            min={0}
            max={65}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="h-1 w-28 cursor-pointer accent-[var(--brand)]"
          />
        </label>
      </div>

      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-xl border border-[var(--border)]"
        style={{
          height: 560,
          background: "radial-gradient(circle at 50% 44%, #151515 0%, #0b0b0b 55%, #060606 100%)",
        }}
      />
      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--muted)]">
      <span className="flex items-center gap-2">
        <svg width="34" height="8">
          <line x1="0" y1="4" x2="34" y2="4" stroke={BUSINESS_COLOR} strokeWidth="2" />
        </svg>
        业务领域相同
      </span>
      <span className="flex items-center gap-2">
        <svg width="34" height="8">
          <line x1="0" y1="4" x2="34" y2="4" stroke={TECH_COLOR} strokeWidth="2" strokeDasharray="3 3" />
        </svg>
        技术栈相同
      </span>
      <span className="mx-1 h-3 w-px bg-[var(--border)]" />
      {Object.entries(REGION_COLORS).map(([region, color]) => (
        <span key={region} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
          {region}
        </span>
      ))}
      <span className="text-[var(--faint)]">· 节点大小 = 综合评分</span>
    </div>
  );
}
