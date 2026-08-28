import type { Notifier } from "./notifier";
import { StubNotifier } from "./stub";
import { FeishuNotifier } from "./feishu";
import { WecomNotifier } from "./wecom";

/** 有配 webhook 就用真实实现，否则 stub。可同时启用多个。 */
export function getNotifiers(): Notifier[] {
  const list: Notifier[] = [];
  if (process.env.FEISHU_WEBHOOK) list.push(new FeishuNotifier(process.env.FEISHU_WEBHOOK));
  if (process.env.WECOM_WEBHOOK) list.push(new WecomNotifier(process.env.WECOM_WEBHOOK));
  if (list.length === 0) list.push(new StubNotifier());
  return list;
}

export * from "./notifier";
