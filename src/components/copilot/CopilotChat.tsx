"use client";

import { useEffect, useRef, useState } from "react";
import { MessageContent } from "./MessageContent";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "本周 Top3 开源项目为什么上榜？",
  "创业公司按地域分布画个图",
  "评分是怎么算的？",
  "现在库里有多少公司，来源分布如何？",
];

export function CopilotChat({ initialQuery }: { initialQuery?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "请求失败");
      setMessages((m) => [...m, { role: "assistant", content: data.answer ?? "" }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQuery && !sentInitial.current) {
      sentInitial.current = true;
      send(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const empty = messages.length === 0 && !loading;

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="flex-1 space-y-5">
        {empty && (
          <div className="pt-6">
            <p className="text-sm text-[var(--muted)]">问点关于榜单、评分、某个项目/公司的问题，我会基于本工具的真实数据回答，需要时给图表和表格。</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--accent-soft)] px-4 py-2.5 text-sm">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--brand-soft)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.7">
                  <circle cx="12" cy="12" r="2.4" /><path d="M12 2a10 10 0 0 1 10 10" /><path d="M12 6a6 6 0 0 1 6 6" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <MessageContent text={m.content} />
              </div>
            </div>
          )
        )}

        {loading && (
          <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
            <span className="inline-block h-2 w-2 animate-ping rounded-full bg-[var(--brand)]" />
            Copilot 正在思考…（低 RPM 账号可能稍慢）
          </div>
        )}
        {error && <div className="text-sm text-[#e06c75]">出错了：{error}</div>}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-4 mt-6">
        <ChatInput value={input} onChange={setInput} onSend={() => send(input)} disabled={loading} />
      </div>
    </div>
  );
}

function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-lg">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        rows={2}
        placeholder="Ask anything, or task an agent…"
        className="w-full resize-none bg-transparent px-1 text-sm outline-none placeholder:text-[var(--faint)]"
      />
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-[var(--faint)]">Kimi · 基于雷达真实数据</span>
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity disabled:opacity-40"
          style={{ background: "var(--brand)" }}
          aria-label="发送"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a0d12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
