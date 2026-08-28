import type { Notifier, DigestPayload } from "./notifier";

/**
 * 企业微信群机器人 webhook（PRD §8，P1）。
 * URL 从 env WECOM_WEBHOOK 读；留空则降级为 stub。
 */
export class WecomNotifier implements Notifier {
  readonly name = "wecom";
  constructor(private webhook: string) {}

  async send(payload: DigestPayload) {
    const res = await fetch(this.webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msgtype: "markdown",
        markdown: { content: payload.markdown.slice(0, 4000) },
      }),
    });
    const detail = res.ok ? "wecom: 已推送" : `wecom: ${res.status} ${await res.text()}`;
    return { ok: res.ok, detail };
  }
}
