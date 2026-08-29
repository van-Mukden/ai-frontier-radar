"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** 首页对话入口：输入后跳转到 /copilot 并自动开始对话。 */
export function CopilotEntry() {
  const [value, setValue] = useState("");
  const router = useRouter();

  function go() {
    const q = value.trim();
    router.push(q ? `/copilot?q=${encodeURIComponent(q)}` : "/copilot");
  }

  return (
    <div
      className="rounded-2xl border px-5 py-5 transition-all focus-within:-translate-y-px"
      style={{
        background: "#2e343d",
        borderColor: "rgba(94,169,255,0.35)",
        boxShadow: "0 0 0 1px rgba(94,169,255,0.12), 0 10px 40px -10px rgba(94,169,255,0.22)",
      }}
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            go();
          }
        }}
        rows={2}
        placeholder="Ask anything, or task an agent…"
        className="w-full resize-none bg-transparent px-1 pt-1 text-sm text-white outline-none placeholder:text-white"
      />
      <div className="mt-1 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-[11px] text-[var(--faint)]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.7">
            <circle cx="12" cy="12" r="2.4" /><path d="M12 2a10 10 0 0 1 10 10" /><path d="M12 6a6 6 0 0 1 6 6" />
          </svg>
          Frontier Copilot · 基于雷达真实数据
        </span>
        <button
          onClick={go}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-95"
          style={{ background: "var(--brand)" }}
          aria-label="开始对话"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a0d12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
