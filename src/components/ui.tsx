import Link from "next/link";
import type { AuthenticityLabel } from "@/config/scoring";
import { CheckIcon, AlertIcon, CrossIcon, CircleIcon } from "./icons";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 ${className}`}>
      {children}
    </div>
  );
}

/** 评分环：奖章式金/银/铜（低饱和），衬线数字。高分金、中分银、低分铜。 */
export function ScoreBadge({ score, label }: { score: number; label?: string }) {
  const s = Math.round(score);
  const tone =
    s >= 75
      ? { bg: "linear-gradient(140deg,#d8c488 0%,#b49a5c 100%)", ring: "rgba(216,196,136,0.35)" } // 金
      : s >= 55
      ? { bg: "linear-gradient(140deg,#cfd3d9 0%,#a7abb2 100%)", ring: "rgba(207,211,217,0.30)" } // 银
      : { bg: "linear-gradient(140deg,#c49a72 0%,#9c7550 100%)", ring: "rgba(196,154,114,0.30)" }; // 铜
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full text-[19px] leading-none tabular-nums"
        style={{
          background: tone.bg,
          color: "#141210",
          fontFamily: "var(--font-score), Georgia, serif",
          boxShadow: `0 0 0 1px ${tone.ring}, inset 0 1px 1px rgba(255,255,255,0.35)`,
        }}
      >
        {s}
      </div>
      {label && <span className="mt-1.5 text-[10px] text-[var(--faint)]">{label}</span>}
    </div>
  );
}

export function Tag({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "accent" | "lang" }) {
  const cls =
    tone === "lang"
      ? "border border-[var(--border)] text-[var(--muted)]"
      : "bg-[var(--accent-soft)] text-[#cfcfcf]";
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${cls}`}>{children}</span>;
}

/** 真实性徽章：全灰阶，靠图标 + 明度区分，可疑最亮以吸睛。 */
export function AuthenticityBadge({ label }: { label: AuthenticityLabel }) {
  const map: Record<
    AuthenticityLabel,
    { bg: string; text: string; icon: React.ReactNode; border?: string }
  > = {
    跑通: { bg: "rgba(255,255,255,0.06)", text: "#cfcfcf", icon: <CheckIcon /> },
    "可疑·充数": {
      bg: "rgba(255,255,255,0.1)",
      text: "#ededed",
      icon: <AlertIcon />,
      border: "1px solid rgba(255,255,255,0.16)",
    },
    跑不通: { bg: "rgba(255,255,255,0.05)", text: "#9a9a9a", icon: <CrossIcon /> },
    未测: { bg: "transparent", text: "#6b6b6b", icon: <CircleIcon /> },
  };
  const m = map[label];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
      style={{ background: m.bg, color: m.text, border: m.border }}
    >
      {m.icon} {label}
    </span>
  );
}

export function Bar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(2, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#d0d0d0" }} />
    </div>
  );
}

export function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2">
      <div className="text-[11px] text-[var(--muted)]">{label}</div>
      <div className="text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">
      ← {children}
    </Link>
  );
}
