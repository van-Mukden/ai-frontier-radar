import type { Metadata } from "next";
import { Space_Grotesk, DM_Serif_Display, Orbitron } from "next/font/google";
import Link from "next/link";
import "./globals.css";

// 科技感标题字体（英文 hero）
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-tech",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-space-grotesk",
  display: "swap",
});

// 分数专用衬线字体，金银铜圆框上更像奖章
const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-score",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI 前沿雷达",
  description: "在热度爆发之前，发现有潜力的 AI 开源项目与 Agent 创业公司",
};

const nav = [
  { href: "/", label: "首页" },
  { href: "/copilot", label: "Frontier Copilot" },
  { href: "/projects", label: "开源项目" },
  { href: "/startups", label: "Startup" },
  { href: "/docs", label: "文档中心" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${spaceGrotesk.variable} ${dmSerif.variable} ${orbitron.variable}`}>
      <body>
        <header
          style={{ background: "rgba(6,6,6,0.72)" }}
          className="sticky top-0 z-10 border-b border-[var(--border)] backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-6xl items-center gap-7 px-6 py-3.5">
            <Link href="/" className="flex items-center gap-2.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ededed" strokeWidth="1.6">
                <circle cx="12" cy="12" r="2.5" />
                <path d="M12 2a10 10 0 0 1 10 10" />
                <path d="M12 6a6 6 0 0 1 6 6" />
              </svg>
              <span className="font-medium tracking-tight">AI 前沿雷达</span>
            </Link>
            <nav className="flex gap-1 text-sm">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-md px-3 py-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-9">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-[var(--faint)]">
KIMI面试用DEMO - Created by 王晨宇和他租的AI们
        </footer>
      </body>
    </html>
  );
}
