interface ChartSpec {
  type?: "bar" | "line" | "donut";
  title?: string;
  data?: { label: string; value: number }[];
}

const PALETTE = ["#5ea9ff", "#98c379", "#e5c07b", "#c678dd", "#56b6c2", "#e06c75", "#d19a66", "#8a8a8a"];

export function ChartBlock({ spec }: { spec: ChartSpec }) {
  const data = (spec.data ?? []).filter((d) => typeof d.value === "number");
  if (data.length === 0) return null;
  const type = spec.type ?? "bar";

  return (
    <div className="my-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      {spec.title && <div className="mb-3 text-xs font-medium text-[var(--muted)]">{spec.title}</div>}
      {type === "donut" ? <Donut data={data} /> : type === "line" ? <LineChart data={data} /> : <BarChart data={data} />}
    </div>
  );
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-24 shrink-0 truncate text-xs text-[var(--muted)]">{d.label}</div>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${(d.value / max) * 100}%`, background: PALETTE[i % PALETTE.length] }}
            />
          </div>
          <div className="w-10 shrink-0 text-right text-xs tabular-nums text-[var(--foreground)]">{d.value}</div>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  const w = 460;
  const h = 140;
  const pad = 24;
  const max = Math.max(1, ...data.map((d) => d.value));
  const min = Math.min(0, ...data.map((d) => d.value));
  const range = max - min || 1;
  const step = (w - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => [pad + i * step, h - pad - ((d.value - min) / range) * (h - pad * 2)]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minWidth: 320 }}>
        <path d={`${path} L ${pts[pts.length - 1][0]} ${h - pad} L ${pts[0][0]} ${h - pad} Z`} fill="rgba(94,169,255,0.08)" />
        <path d={path} fill="none" stroke="#5ea9ff" strokeWidth="2" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r="2.5" fill="#5ea9ff" />
            <text x={p[0]} y={h - 8} textAnchor="middle" fontSize="9" fill="#7d8590">
              {data[i].label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Donut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" width="120" height="120">
        <g transform="translate(70,70) rotate(-90)">
          {data.map((d, i) => {
            const frac = d.value / total;
            const dash = frac * C;
            const el = (
              <circle
                key={i}
                r={R}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth="16"
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return el;
          })}
        </g>
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="text-[var(--muted)]">{d.label}</span>
            <span className="tabular-nums text-[var(--foreground)]">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
