export type Role = "user" | "assistant";
export interface Msg {
  role: Role;
  content: string;
}
export interface Conversation {
  id: string;
  title: string;
  messages: Msg[];
  updatedAt: number;
}

const KEY = "radar_copilot_conversations";
const MAX = 50;

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as Conversation[];
    return Array.isArray(list) ? list.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch {
    return [];
  }
}

export function saveConversations(list: Conversation[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* 隐私模式/容量满：忽略 */
  }
}

export function newId(): string {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function titleFrom(messages: Msg[]): string {
  const first = messages.find((m) => m.role === "user")?.content ?? "新对话";
  return first.replace(/\s+/g, " ").slice(0, 24) || "新对话";
}
