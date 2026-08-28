import Link from "next/link";

type SP = Record<string, string | undefined>;

/** 生成可组合的筛选 chip：点击在当前 URL 参数基础上切换某个键，保留其它筛选。 */
export function chipFactory(basePath: string, current: SP) {
  return function chip(key: string, value: string, label: string, icon?: React.ReactNode) {
    const active = (current[key] ?? "") === value;
    const merged: SP = { ...current, [key]: active ? undefined : value };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, String(v));
    const href = `${basePath}${p.toString() ? "?" + p.toString() : ""}`;
    return (
      <Link
        key={`${key}:${value}`}
        href={href}
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs transition-colors ${
          active
            ? "bg-[var(--accent)] text-[#060606]"
            : "border border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
        }`}
      >
        {icon}
        {label}
      </Link>
    );
  };
}

export function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-12 shrink-0 text-xs text-[var(--faint)]">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
