"use client";

import { useState } from "react";

interface ProposeSpec {
  kind?: "repo" | "startup";
  name?: string;
  url?: string;
  description?: string;
  one_liner?: string;
  primary_domain?: string;
  origin_lang?: string;
  region?: string;
  agent_subcategory?: string;
  tech_stack?: string[];
  potential_score?: number;
  subscores?: Record<string, number>;
  fourc?: Record<string, string>;
  thesis?: string;
  risks?: string[];
  stars?: number;
}

export function ProposeCard({ spec }: { spec: ProposeSpec }) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "discarded" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [href, setHref] = useState<string | null>(null);

  async function commit() {
    setState("saving");
    try {
      const res = await fetch("/api/copilot/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: spec.kind, fields: spec }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "写入失败");
      setHref(data.href ?? null);
      setState("done");
    } catch (e) {
      setMsg((e as Error).message);
      setState("error");
    }
  }

  const score = Math.round(spec.potential_score ?? 0);
  const isRepo = spec.kind === "repo";

  return (
    <div className="my-3 rounded-xl border border-[var(--brand)] bg-[var(--card)]" style={{ borderColor: "rgba(94,169,255,0.4)" }}>
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
        <span className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--brand)" }}>
          拟入库 · {isRepo ? "开源项目" : "创业公司"} · 待你确认
        </span>
        <span className="text-[10px] text-[var(--faint)]">human-in-the-loop</span>
      </div>

      <div className="flex items-start gap-4 p-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-medium tabular-nums"
          style={{ border: "1.5px solid rgba(94,169,255,0.6)", color: "var(--brand)" }}
        >
          {score}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{spec.name}</span>
            {isRepo ? (
              spec.primary_domain && <Chip>{spec.primary_domain}</Chip>
            ) : (
              <>
                {spec.region && <Chip>{spec.region}</Chip>}
                {spec.agent_subcategory && <Chip>{spec.agent_subcategory}</Chip>}
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">{spec.one_liner ?? spec.description}</p>
          {spec.thesis && <p className="mt-2 text-xs leading-relaxed">{spec.thesis}</p>}
          {spec.subscores && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--muted)]">
              {Object.entries(spec.subscores).map(([k, v]) => (
                <span key={k}>
                  {k} <span className="text-[var(--foreground)]">{v}</span>
                </span>
              ))}
            </div>
          )}
          {spec.url && (
            <a href={spec.url} target="_blank" className="mt-2 inline-block text-xs text-[var(--brand)] underline">
              {spec.url}
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-[var(--border)] px-4 py-3">
        {state === "done" ? (
          <span className="text-sm text-[#98c379]">
            ✓ 已入库{href && (
              <a href={href} className="ml-2 text-[var(--brand)] underline">
                去查看
              </a>
            )}
          </span>
        ) : state === "discarded" ? (
          <span className="text-sm text-[var(--muted)]">已丢弃</span>
        ) : (
          <>
            <button
              onClick={commit}
              disabled={state === "saving"}
              className="rounded-lg px-4 py-1.5 text-sm font-semibold text-[#0a0d12] disabled:opacity-60"
              style={{ background: "var(--brand)" }}
            >
              {state === "saving" ? "写入中…" : "确认入库"}
            </button>
            <button
              onClick={() => setState("discarded")}
              className="rounded-lg border border-[var(--border)] px-4 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              丢弃
            </button>
            {state === "error" && <span className="text-xs text-[#e06c75]">{msg}</span>}
          </>
        )}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] text-[#cfcfcf]">{children}</span>;
}
