import type { Notifier, DigestPayload } from "./notifier";

/** 默认实现：写日志 + 依赖 /digest 页面展示，不外发。 */
export class StubNotifier implements Notifier {
  readonly name = "stub";
  async send(payload: DigestPayload) {
    console.log(`[notify:stub] digest ${payload.date} 已生成，Top ${payload.repos.length} 开源 / ${payload.startups.length} startup。仅落库到 /digest，未外发。`);
    return { ok: true, detail: "stub: 已落库到 /digest，未外发（webhook 未配置）" };
  }
}
