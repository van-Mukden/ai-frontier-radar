"use client";

import { useState } from "react";

const silver = "linear-gradient(140deg,#cfd3d9 0%,#a7abb2 100%)";

export function DigestActions({ markdown }: { markdown: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  function toast(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(null), 2600);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      toast("已复制周报内容");
    } catch {
      toast("复制失败，请手动选择");
    }
  }

  async function share(target: "feishu" | "wecom") {
    setBusy(target);
    try {
      const res = await fetch(`/api/share?target=${target}`, { method: "POST" });
      const data = await res.json();
      toast(data.detail ?? (res.ok ? "已推送" : "推送失败"));
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const btn =
    "rounded-lg px-4 py-2 text-sm font-semibold text-[#15130f] transition-transform active:scale-[0.98] disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className={btn} style={{ background: silver }} onClick={() => share("feishu")} disabled={busy === "feishu"}>
        {busy === "feishu" ? "推送中…" : "分享到飞书"}
      </button>
      <button className={btn} style={{ background: silver }} onClick={() => share("wecom")} disabled={busy === "wecom"}>
        {busy === "wecom" ? "推送中…" : "分享到企业微信"}
      </button>
      <button className={btn} style={{ background: silver }} onClick={copy}>
        复制内容
      </button>
      {msg && <span className="text-xs text-[var(--muted)]">{msg}</span>}
    </div>
  );
}
