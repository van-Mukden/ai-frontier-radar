import type { Notifier, DigestPayload } from "./notifier";

/**
 * 飞书自定义机器人 webhook（PRD §8，P1）。
 * URL 从 env FEISHU_WEBHOOK 读；留空则由 factory 降级为 stub。
 * 这里已写好真实 POST 逻辑，接入时只需填 webhook。
 */
export class FeishuNotifier implements Notifier {
  readonly name = "feishu";
  constructor(private webhook: string) {}

  async send(payload: DigestPayload) {
    const res = await fetch(this.webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msg_type: "interactive",
        card: {
          header: {
            title: { tag: "plain_text", content: `AI 前沿雷达 · ${payload.date}` },
            template: "blue",
          },
          elements: [
            { tag: "markdown", content: payload.markdown.slice(0, 4000) },
          ],
        },
      }),
    });
    const detail = res.ok ? "feishu: 已推送" : `feishu: ${res.status} ${await res.text()}`;
    return { ok: res.ok, detail };
  }
}
