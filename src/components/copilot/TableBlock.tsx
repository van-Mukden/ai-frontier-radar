interface TableSpec {
  title?: string;
  columns?: string[];
  rows?: (string | number)[][];
}

export function TableBlock({ spec }: { spec: TableSpec }) {
  const cols = spec.columns ?? [];
  const rows = spec.rows ?? [];
  if (cols.length === 0 && rows.length === 0) return null;
  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)]">
      {spec.title && (
        <div className="border-b border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--muted)]">
          {spec.title}
        </div>
      )}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th key={i} className="px-4 py-2 text-left text-xs font-medium text-[var(--muted)]">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-[var(--border)]">
              {r.map((cell, ci) => (
                <td key={ci} className="px-4 py-2 tabular-nums text-[var(--foreground)]">
                  {String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
