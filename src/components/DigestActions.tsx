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

  async function copyText(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(markdown);
      return true;
    } catch {
      return false;
    }
  }

  async function copy() {
    toast((await copyText()) ? "已复制周报内容" : "复制失败，请手动选择");
  }

  // 飞书 / 企业微信没有开放的免登「预填分享」链接，这里走：复制内容 → 弹窗确认 → 跳转到对应 IM 粘贴分享
  const TARGETS: Record<"feishu" | "wecom", { name: string; url: string }> = {
    feishu: { name: "飞书", url: "https://www.feishu.cn/messenger/" },
    wecom: { name: "企业微信", url: "https://work.weixin.qq.com/" },
  };

  async function share(target: "feishu" | "wecom") {
    setBusy(target);
    const t = TARGETS[target];
    const copied = await copyText();
    setBusy(null);
    const ok = window.confirm(
      `${copied ? "已复制本周周报到剪贴板。" : "复制失败，请稍后手动复制内容。"}\n点击「确定」打开${t.name}，粘贴到会话/群即可分享。`
    );
    if (ok) {
      window.open(t.url, "_blank", "noopener");
      toast(`已打开${t.name}，粘贴即可发送`);
    }
  }

  const btn =
    "rounded-lg px-4 py-2 text-sm font-semibold text-[#15130f] transition-transform active:scale-[0.98] disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className={btn} style={{ background: silver }} onClick={() => share("feishu")} disabled={busy !== null}>
        分享到飞书
      </button>
      <button className={btn} style={{ background: silver }} onClick={() => share("wecom")} disabled={busy !== null}>
        分享到企业微信
      </button>
      <button className={btn} style={{ background: silver }} onClick={copy}>
        复制内容
      </button>
      {msg && <span className="text-xs text-[var(--muted)]">{msg}</span>}
    </div>
  );
}
