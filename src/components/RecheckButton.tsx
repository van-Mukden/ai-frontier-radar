"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayIcon } from "./icons";

export function RecheckButton({ repoId }: { repoId: number }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/recheck/${repoId}`, { method: "POST" });
      const data = await res.json();
      setMsg(data.label ? `核查完成：${data.label}` : data.error ?? "完成");
      router.refresh();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={run}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm text-[#060606] disabled:opacity-50"
      >
        {loading ? "核查中…" : <><PlayIcon size={13} strokeWidth={2} /> 重新做真实性核查</>}
      </button>
      {msg && <span className="text-xs text-[var(--muted)]">{msg}</span>}
    </div>
  );
}
