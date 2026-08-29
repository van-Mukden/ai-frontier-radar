import { ChartBlock } from "./ChartBlock";
import { TableBlock } from "./TableBlock";
import { ProposeCard } from "./ProposeCard";

/** 把回答里的 markdown + ```radar-chart / ```radar-table 块解析并渲染。 */
export function MessageContent({ text }: { text: string }) {
  const parts = segment(text);
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {parts.map((p, i) => {
        if (p.kind === "chart" || p.kind === "table" || p.kind === "propose") {
          try {
            const spec = JSON.parse(p.raw);
            if (p.kind === "chart") return <ChartBlock key={i} spec={spec} />;
            if (p.kind === "table") return <TableBlock key={i} spec={spec} />;
            return <ProposeCard key={i} spec={spec} />;
          } catch {
            return (
              <pre key={i} className="overflow-x-auto rounded bg-[var(--accent-soft)] p-2 text-xs">
                {p.raw}
              </pre>
            );
          }
        }
        return <Markdown key={i} text={p.raw} />;
      })}
    </div>
  );
}

type Seg = { kind: "md" | "chart" | "table" | "propose"; raw: string };

function segment(text: string): Seg[] {
  const parts: Seg[] = [];
  const re = /```radar-(chart|table|propose)\s*([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ kind: "md", raw: text.slice(last, m.index) });
    parts.push({ kind: m[1] as "chart" | "table" | "propose", raw: m[2].trim() });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({ kind: "md", raw: text.slice(last) });
  return parts;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inline(s: string) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="rounded bg-[var(--accent-soft)] px-1 py-0.5 text-[0.85em]">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="text-[var(--brand)] underline">$1</a>');
}

const isTableRow = (s: string) => /^\s*\|.*\|\s*$/.test(s);
const isTableSep = (s: string) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(s) && s.includes("-");
const splitCells = (s: string) =>
  s.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      out.push(
        <ul key={out.length} className="list-disc space-y-0.5 pl-5">
          {list.map((li, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: inline(li) }} />
          ))}
        </ul>
      );
      list = [];
    }
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();

    // 标准 markdown 管道表格：表头行 + 分隔行 + 若干数据行
    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      flush();
      const header = splitCells(line);
      const rows: string[][] = [];
      let j = i + 2;
      for (; j < lines.length && isTableRow(lines[j]); j++) rows.push(splitCells(lines[j]));
      out.push(
        <div key={out.length} className="overflow-x-auto">
          <table className="my-1 w-full border-collapse text-xs">
            <thead>
              <tr>
                {header.map((h, k) => (
                  <th
                    key={k}
                    className="border-b border-[var(--border-strong)] px-2 py-1 text-left font-semibold"
                    dangerouslySetInnerHTML={{ __html: inline(h) }}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td
                      key={ci}
                      className="border-b border-[var(--border)] px-2 py-1 align-top"
                      dangerouslySetInnerHTML={{ __html: inline(c) }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      i = j - 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ""));
      continue;
    }
    flush();
    if (!line.trim()) continue;
    const hm = line.match(/^(#{1,4})\s+(.*)/);
    if (hm) {
      out.push(
        <div key={out.length} className="mt-1 font-semibold" dangerouslySetInnerHTML={{ __html: inline(hm[2]) }} />
      );
    } else {
      out.push(<p key={out.length} dangerouslySetInnerHTML={{ __html: inline(line) }} />);
    }
  }
  flush();
  return <>{out}</>;
}
