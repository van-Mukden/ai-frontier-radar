export interface DigestPayload {
  date: string;
  markdown: string;
  repos: { name: string; url: string; reason: string }[];
  startups: { name: string; url: string; reason: string }[];
}

/** 推送抽象（PRD §8）。真实 connection 由后续接入，本期默认 stub。 */
export interface Notifier {
  readonly name: string;
  send(payload: DigestPayload): Promise<{ ok: boolean; detail: string }>;
}
