import { NextResponse } from "next/server";
import { getLatestDigest } from "@/lib/queries";
import { FeishuNotifier } from "@/lib/notify/feishu";
import { WecomNotifier } from "@/lib/notify/wecom";
import type { DigestPayload } from "@/lib/notify";

/** 分享当日周报到飞书 / 企业微信。webhook 未配置时返回提示（stub）。 */
export async function POST(req: Request) {
  const target = new URL(req.url).searchParams.get("target");
  const digest = getLatestDigest();
  if (!digest) return NextResponse.json({ ok: false, detail: "暂无周报，请先运行采集" }, { status: 400 });
  const payload = digest.payload as DigestPayload;

  if (target === "feishu") {
    if (!process.env.FEISHU_WEBHOOK)
      return NextResponse.json({ ok: false, detail: "未配置飞书 webhook（FEISHU_WEBHOOK），已复制可手动粘贴" });
    const r = await new FeishuNotifier(process.env.FEISHU_WEBHOOK).send(payload);
    return NextResponse.json(r);
  }
  if (target === "wecom") {
    if (!process.env.WECOM_WEBHOOK)
      return NextResponse.json({ ok: false, detail: "未配置企业微信 webhook（WECOM_WEBHOOK），已复制可手动粘贴" });
    const r = await new WecomNotifier(process.env.WECOM_WEBHOOK).send(payload);
    return NextResponse.json(r);
  }
  return NextResponse.json({ ok: false, detail: "未知目标" }, { status: 400 });
}
