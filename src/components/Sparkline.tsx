export function Sparkline({
  points,
  width = 260,
  height = 60,
}: {
  points: number[];
  width?: number;
  height?: number;
}) {
  if (points.length < 2) {
    return (
      <div className="text-xs text-[var(--muted)]">
        仅 1 个快照 —— star 趋势将在后续每日采集中累积（这也是 PRD 里「历史回填窗口」这个待定项要解决的）。
      </div>
    );
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${height - ((p - min) / range) * height}`)
    .join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} />
    </svg>
  );
}
