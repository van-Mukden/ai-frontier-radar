"use client";

import { useEffect, useRef, useState } from "react";

let seq = 0;

/** 渲染一段 mermaid 图（客户端动态加载，深色主题贴合站点）。 */
export function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose", // 允许标签里的 <br/> 与特殊形状
          theme: "base",
          themeVariables: {
            fontFamily: "var(--font-space-grotesk), ui-sans-serif, sans-serif",
            fontSize: "13px",
            background: "transparent",
            primaryColor: "#161616",
            primaryBorderColor: "#333",
            primaryTextColor: "#ededed",
            lineColor: "#6b6b6b",
            secondaryColor: "#1c1c1c",
            tertiaryColor: "#141414",
            tertiaryTextColor: "#ededed",
            tertiaryBorderColor: "#333",
            clusterBkg: "rgba(255,255,255,0.03)",
            clusterBorder: "#333",
          },
        });
        const id = `mmd-${++seq}`;
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (!cancelled) setErr((e as Error).message.slice(0, 160));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (err) {
    return <div className="rounded-lg border border-[var(--border)] p-3 text-xs text-[#e06c75]">图渲染失败：{err}</div>;
  }
  return <div ref={ref} className="mermaid-host w-full overflow-x-auto [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full" />;
}
