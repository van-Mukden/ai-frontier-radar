export const BRAND = "#5ea9ff";
export const DOMAIN_PALETTE = ["#5ea9ff", "#e5c07b", "#98c379", "#c678dd", "#56b6c2", "#e06c75", "#8a8a8a"];

export function hashColor(k: string): string {
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0;
  return DOMAIN_PALETTE[Math.abs(h) % DOMAIN_PALETTE.length];
}

export function Stat({ n, label, color = BRAND }: { n: number; label: string; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 text-center">
      <div className="text-5xl font-bold leading-none tabular-nums" style={{ color }}>
        {n}
      </div>
      <div className="mt-2 text-xs text-[var(--muted)]">{label}</div>
    </div>
  );
}

export function BarList({
  data,
  colorOf,
}: {
  data: { key: string; n: number }[];
  colorOf?: (k: string) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.n));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.key} className="flex items-center gap-3">
          <div className="w-28 shrink-0 truncate text-xs text-[var(--muted)]">{d.key}</div>
          <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div className="h-full rounded-full" style={{ width: `${(d.n / max) * 100}%`, background: colorOf?.(d.key) ?? BRAND }} />
          </div>
          <div className="w-6 text-right text-xs tabular-nums text-[var(--foreground)]">{d.n}</div>
        </div>
      ))}
      {data.length === 0 && <div className="text-xs text-[var(--muted)]">暂无数据，先运行采集。</div>}
    </div>
  );
}

export function Flow({ steps, accent }: { steps: string[]; accent: string }) {
  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex max-w-[220px] items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ background: accent, color: "#0a0d12" }}
            >
              {i + 1}
            </span>
            <span className="text-xs leading-snug text-[var(--foreground)]">{s}</span>
          </div>
          {i < steps.length - 1 && (
            <svg width="18" height="12" viewBox="0 0 18 12" className="shrink-0">
              <path d="M0 6h13M13 6l-4-4M13 6l-4 4" fill="none" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
