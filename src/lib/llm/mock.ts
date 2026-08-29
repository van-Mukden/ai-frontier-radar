import { z } from "zod";
import type { LLMProvider } from "./provider";

/**
 * 离线确定性 mock provider —— 无 API key 时兜底，让 demo 完全离线可跑。
 * 通过 system prompt 里的 <<TASK:xxx>> 标记路由，用内容哈希产生稳定但有区分度的分数。
 * 真实判断质量由 KimiProvider 提供；mock 只保证流水线端到端可跑、可复现。
 */
export class MockProvider implements LLMProvider {
  readonly name = "mock";

  async chat(args: { messages: { role: string; content: string }[] }): Promise<string> {
    const last = [...args.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const sys = args.messages.find((m) => m.role === "system")?.content ?? "";

    // 周报撰写（离线 mock 版）
    if (sys.includes("情报编辑") || sys.includes("周报")) {
      const names = [...last.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => `[${m[1]}](${m[2]})`);
      const line = (a: string[]) => a.map((n) => `**${n}**`).join("、");
      const repoNames = names.slice(0, 3);
      const startNames = names.slice(3, 6);
      const dateM = sys.match(/周报 · ([\d-]+)/)?.[1] ?? new Date().toISOString().slice(0, 10);
      return `## AI 前沿周报 · ${dateM}

本周开源侧仍以 Agent 框架与工程化工具为主线，创业侧编码/通用 Agent 持续吸金。（离线 mock 概述，接入 Kimi 后为真实成文）

**🔧 开源项目**：${repoNames.length ? line(repoNames) + " 领跑，增长与讨论度双高，值得盯。" : "本周暂无。"}

**🚀 创业公司**：${startNames.length ? line(startNames) + " 在各自赛道势能领先。" : "本周暂无。"}`;
    }

    // 拟入库模式：产出一个 radar-propose 卡片（离线演示 human-in-the-loop）
    if (sys.includes('"kind":"repo"') && sys.includes("拟入库卡片")) {
      const full = last.match(/github\.com\/([\w.-]+\/[\w.-]+)/i)?.[1]?.replace(/\.git$/, "") ?? "owner/repo";
      return `已评估 **${full}**（离线 mock，接入 Kimi 后为真实判断）。下面是拟入库卡片，确认后才写入榜单：

\`\`\`radar-propose
{"kind":"repo","name":"${full}","url":"https://github.com/${full}","primary_domain":"Agent 框架","origin_lang":"英文","description":"一个 AI 开源项目","one_liner":"（mock）一句话说明","stars":1200,"potential_score":72,"subscores":{"novelty":75,"momentum":70,"adoption":65,"team":68,"defensibility":60},"thesis":"（mock）增长信号尚可，若维护节奏保持有机会成为该方向选择之一。","risks":["赛道拥挤","维护可持续性待观察"]}
\`\`\``;
    }
    if (sys.includes('"kind":"startup"') && sys.includes("拟入库卡片")) {
      return `已评估该公司（离线 mock）。拟入库卡片如下，确认后写入：

\`\`\`radar-propose
{"kind":"startup","name":"示例公司","url":"https://example.com","region":"美国","agent_subcategory":"通用 agent","tech_stack":["开源模型上层"],"description":"（mock）一家 agent 方向公司","potential_score":68,"subscores":{"team":70,"funding_signal":60,"traction":55,"market_timing":72,"moat_vs_big_labs":50},"fourc":{"company":"做什么（mock）","customers":"目标客群（mock）","competitors":"竞争（mock）","collaborators":"投资方/生态（mock）"},"thesis":"（mock）团队与时机尚可，值得跟踪。","risks":["护城河偏弱","牵引力待更多证据"]}
\`\`\``;
    }

    // 尝试从 system 里的快照 JSON 拿点真实数字，展示图表/表格渲染
    let regions = `{"label":"美国","value":8},{"label":"中国","value":3},{"label":"日本","value":2}`;
    const m = sys.match(/"startup_regions":\s*(\[[^\]]*\])/);
    if (m) {
      try {
        const arr = JSON.parse(m[1]) as { key: string; n: number }[];
        regions = arr.map((x) => `{"label":"${x.key}","value":${x.n}}`).join(",");
      } catch {
        /* 用默认 */
      }
    }
    return `（离线 mock 回答，接入 Kimi 后为真实判断）关于「${last.slice(0, 40)}」——下面用图表和表格示意 Copilot 的可视化能力：

创业公司按地域分布如下：

\`\`\`radar-chart
{"type":"bar","title":"创业公司 · 地域分布","data":[${regions}]}
\`\`\`

评分口径可参考文档中心。示例表格：

\`\`\`radar-table
{"title":"示例","columns":["维度","权重"],"rows":[["潜力分",0.5],["势能",0.35],["跨源印证",0.15]]}
\`\`\`

配置 \`LLM_API_KEY\` 后即为真实数据问答。`;
  }

  async completeJSON<T>(args: { system: string; user: string; schema: z.ZodType<T> }): Promise<T> {
    const task = args.system.match(/<<TASK:([a-z_]+)>>/)?.[1] ?? "unknown";
    const h = hash(args.user);
    const pick = <A>(arr: A[], seed: number) => arr[seed % arr.length];
    const span = (min: number, max: number, seed: number) =>
      min + (seed % (max - min + 1));

    const text = args.user.toLowerCase();
    const has = (...kw: string[]) => kw.some((k) => text.includes(k));

    let out: unknown;
    switch (task) {
      case "repo_classify": {
        out = {
          origin_lang: has("中文", "chinese", "简体", "。") ? "中文" : "英文",
          primary_domain: has("agent", "智能体")
            ? "Agent 框架"
            : has("rag", "retrieval", "检索")
            ? "RAG·检索·记忆"
            : has("infer", "serving", "vllm", "推理", "部署")
            ? "推理·部署 infra"
            : has("train", "fine-tun", "rl", "训练", "微调")
            ? "训练·微调·RL"
            : has("eval", "benchmark", "评测")
            ? "评测·benchmark·可观测"
            : "编码·开发工具",
          secondary_domains: [],
        };
        break;
      }
      case "repo_assess": {
        const suspicious = has("suspicious", "充数", "boilerplate", "placeholder");
        const base = suspicious ? span(20, 40, h) : span(50, 88, h);
        out = {
          potential_score: base,
          subscores: {
            novelty: span(40, 90, h + 1),
            momentum: span(45, 95, h + 2),
            adoption: span(30, 85, h + 3),
            team: span(35, 90, h + 4),
            defensibility: span(30, 80, h + 5),
          },
          one_liner: firstSentence(args.user) || "一个 AI 开源项目",
          thesis:
            "增长信号在加速、有真实使用讨论，若维护节奏保持，有机会成为该方向的默认选择之一。（mock 生成，接入 Kimi 后为真实判断）",
          risks: [
            "赛道拥挤，差异化需靠执行速度维持",
            "早期项目维护可持续性待观察",
          ],
          comparable_to: pick(
            ["类似 LangGraph 的编排层", "类似 vLLM 的推理栈", "类似 Dify 的应用层"],
            h
          ),
        };
        break;
      }
      case "authenticity": {
        // 静态核查主要在代码里做；mock 只在文本里出现明显充数信号时给标签
        const suspicious = has("充数", "thousands of", "几千个", "generalize", "占位");
        out = suspicious
          ? {
              label: "可疑·充数",
              evidence: ["文件数量异常且抽样多为模板/占位（mock）"],
              flags: ["bulk_padding"],
            }
          : { label: "未测", evidence: ["静态核查未见明显异常（mock）"], flags: [] };
        break;
      }
      case "news_extract": {
        const title = args.user.match(/标题：(.+)/)?.[1] ?? "";
        const nm = title.match(/^([一-龥A-Za-z0-9]{2,12})(?:科技|智能|完成|获)/)?.[1] ?? title.slice(0, 8);
        out = {
          is_agent_startup: has("agent", "智能体", "融资"),
          name: nm,
          region: "中国",
          agent_subcategory: pick(["通用 agent", "编码 agent", "agent infra", "RPA 替代"], h),
          description: title.slice(0, 40),
          stage: has("天使") ? "天使轮" : has("a轮", "a+") ? "A轮" : "融资",
          amount_usd_million: has("亿") ? 15 : has("千万") ? 5 : 0,
          lead_investors: [],
        };
        break;
      }
      case "hn_extract": {
        const isAgent = has("agent", "autonomous", "copilot", "assistant");
        const nameGuess = (args.user.match(/标题：(?:Launch HN|Show HN)[:：]?\s*([^\n(（—-]+)/i)?.[1] ?? "HN 项目").trim();
        out = {
          is_agent_startup: isAgent,
          name: nameGuess.slice(0, 40),
          url: args.user.match(/链接：(\S+)/)?.[1] ?? "",
          region: has("china", "中国", "beijing", "shanghai") ? "中国" : has("japan", "tokyo", "日本") ? "日本" : "美国",
          agent_subcategory: pick(["通用 agent", "编码 agent", "浏览器 agent", "agent infra"], h),
          description: firstSentence(args.user) || "一家 agent 方向公司（mock）",
        };
        break;
      }
      case "startup_assess": {
        // 从固定技术栈枚举确定性挑 1-2 个（保证图谱有团簇）
        const stacks = [
          "自研基础模型",
          "开源模型上层",
          "闭源API封装",
          "RAG·检索栈",
          "浏览器·计算机自动化",
          "多Agent编排",
          "强化学习·后训练",
          "语音·多模态栈",
          "代码执行沙箱",
          "向量库·记忆",
        ];
        const t1 = pick(stacks, h);
        const t2 = pick(stacks, h + 3);
        const tech_stack = t1 === t2 ? [t1] : [t1, t2];
        out = {
          potential_score: span(45, 90, h),
          agent_subcategory: pick(
            ["通用 agent", "编码 agent", "浏览器 agent", "agent infra", "多 agent 编排"],
            h
          ),
          tech_stack,
          subscores: {
            team: span(40, 95, h + 1),
            funding_signal: span(35, 90, h + 2),
            traction: span(30, 85, h + 3),
            market_timing: span(45, 90, h + 4),
            moat_vs_big_labs: span(25, 75, h + 5),
          },
          fourc: {
            company: "做 Agent 方向的早期公司；产品与阶段见来源。（mock）",
            customers: "开发者 / 企业为主，用例围绕自动化工作流。（mock）",
            competitors: "面临大厂顺手 ship 同类功能的风险，及若干开源替代。（mock）",
            collaborators: "投资方与生态渠道见融资信息。（mock）",
          },
          thesis: "团队与融资信号尚可、赛道时机成熟，值得持续跟踪。（mock，接入 Kimi 后为真实判断）",
          risks: ["护城河相对大厂偏弱", "牵引力仍需更多公开证据"],
        };
        break;
      }
      default:
        out = {};
    }
    return args.schema.parse(out);
  }
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function firstSentence(s: string): string {
  const lines = s.split("\n");
  // 优先取「描述：」行的内容
  const descLine = lines.find((l) => /^描述[:：]/.test(l.trim()));
  if (descLine) {
    const body = descLine.replace(/^描述[:：]\s*/, "").trim();
    if (body.length > 4) return body.slice(0, 60);
  }
  // 否则取 README 摘录首个实义行
  const idx = lines.findIndex((l) => /README/.test(l));
  if (idx >= 0) {
    const body = lines
      .slice(idx + 1)
      .map((l) => l.replace(/^#+\s*/, "").trim())
      .find((l) => l.length > 8 && !/^[-=*]+$/.test(l));
    if (body) return body.slice(0, 60);
  }
  return "一个 AI 开源项目";
}
