import { NextResponse } from "next/server";
import { getLLM } from "@/lib/llm";
import type { ChatMessage } from "@/lib/llm/provider";
import { buildRadarSnapshot } from "@/lib/copilot/context";
import { copilotSystem } from "@/lib/copilot/prompt";
import { retrieve } from "@/lib/copilot/agent";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const METHODOLOGY = `本工具押注"领先信号"而非滞后指标（绝对 star / 已见报融资都是滞后的）。
开源项目综合分 = 潜力(LLM) 0.5 + 势能(相对增长·加速度·跨源印证) 0.35 + 跨源印证 0.15；命中"充数"会被扣分。
创业公司综合分 = 潜力(LLM) 0.6 + 势能(轮次速度·投资方声誉) 0.4；带研报 4C。
数据源：GitHub、Hacker News、YC 公司库（每周更新）；判断层用 Kimi。`;

export async function POST(req: Request) {
  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const history = (body.messages ?? []).filter((m) => m.role === "user" || m.role === "assistant").slice(-10);
  if (history.length === 0) return NextResponse.json({ error: "no messages" }, { status: 400 });

  try {
    const lastUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
    const r = await retrieve(lastUser);
    const snapshot = buildRadarSnapshot();
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: copilotSystem({ snapshot, methodology: METHODOLOGY, retrieved: r.context, mode: r.mode }),
      },
      ...history,
    ];
    const llm = getLLM();
    const answer = await llm.chat({ messages });
    return NextResponse.json({ answer, provider: llm.name, mode: r.mode, webAvailable: r.webAvailable });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
