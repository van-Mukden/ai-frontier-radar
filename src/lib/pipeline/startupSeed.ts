/**
 * 旗舰 Agent 公司种子（中/美/日），公开报道口径，作为 M2 演示底座。
 * 融资金额为公开报道的概数，source 指向可核实入口；精确数字以官方/权威媒体为准。
 * 真实增量发现来自 HN Launch/Show HN adapter（ingestStartups.ts）。
 */
export interface SeedStartup {
  name: string;
  url: string;
  region: "中国" | "美国" | "日本";
  agent_subcategory: string;
  description: string;
  rounds: {
    stage: string;
    amount_usd: number | null;
    date: string;
    lead_investors: string[];
    source_url: string;
  }[];
}

export const STARTUP_SEED: SeedStartup[] = [
  {
    name: "Cognition (Devin)",
    url: "https://cognition.ai",
    region: "美国",
    agent_subcategory: "编码 agent",
    description: "自主软件工程 agent Devin 的开发商，主打端到端完成编码任务。",
    rounds: [
      {
        stage: "Series A",
        amount_usd: 175_000_000,
        date: "2024-04-01",
        lead_investors: ["Founders Fund"],
        source_url: "https://www.google.com/search?q=Cognition+Devin+funding",
      },
    ],
  },
  {
    name: "Sierra",
    url: "https://sierra.ai",
    region: "美国",
    agent_subcategory: "通用 agent",
    description: "面向企业的对话式客服 agent 平台，Bret Taylor 创立。",
    rounds: [
      {
        stage: "Series B",
        amount_usd: 175_000_000,
        date: "2024-10-01",
        lead_investors: ["Greenoaks"],
        source_url: "https://www.google.com/search?q=Sierra.ai+funding",
      },
    ],
  },
  {
    name: "Anysphere (Cursor)",
    url: "https://cursor.com",
    region: "美国",
    agent_subcategory: "编码 agent",
    description: "AI 编程编辑器 Cursor 的母公司，agent 化的代码编辑体验。",
    rounds: [
      {
        stage: "Series B",
        amount_usd: 100_000_000,
        date: "2024-12-01",
        lead_investors: ["Thrive Capital", "Andreessen Horowitz"],
        source_url: "https://www.google.com/search?q=Anysphere+Cursor+funding",
      },
    ],
  },
  {
    name: "Decagon",
    url: "https://decagon.ai",
    region: "美国",
    agent_subcategory: "通用 agent",
    description: "企业级 AI 客服 agent，主打自动化支持工单。",
    rounds: [
      {
        stage: "Series B",
        amount_usd: 65_000_000,
        date: "2024-11-01",
        lead_investors: ["Bain Capital Ventures"],
        source_url: "https://www.google.com/search?q=Decagon+ai+funding",
      },
    ],
  },
  {
    name: "Manus (Butterfly Effect)",
    url: "https://manus.im",
    region: "中国",
    agent_subcategory: "通用 agent",
    description: "通用型自主 agent 产品 Manus，能规划并执行多步任务。",
    rounds: [
      {
        stage: "Funding",
        amount_usd: 75_000_000,
        date: "2025-04-01",
        lead_investors: ["Benchmark"],
        source_url: "https://www.google.com/search?q=Manus+Butterfly+Effect+funding",
      },
    ],
  },
  {
    name: "Sakana AI",
    url: "https://sakana.ai",
    region: "日本",
    agent_subcategory: "agent infra",
    description: "东京的 AI 研究公司，探索进化式/多模型协作方法与 agent 化研究流程。",
    rounds: [
      {
        stage: "Series A",
        amount_usd: 200_000_000,
        date: "2024-09-01",
        lead_investors: ["NEA", "Khosla Ventures", "Lux Capital"],
        source_url: "https://www.google.com/search?q=Sakana+AI+funding",
      },
    ],
  },

  // —— 中/日锚点（YC 偏美国，这几家非 YC 的中日旗舰手工补，保证地域平衡）——
  mk("Dify (LangGenius)", "https://dify.ai", "中国", "agent infra", "开源 LLM 应用与 agent 编排平台。"),
  mk("秘塔 Metaso", "https://metaso.cn", "中国", "通用 agent", "AI 搜索与研究 agent。"),
  mk("Kotoba Technologies", "https://kotoba.tech", "日本", "agent infra", "日本的语音/LLM 基础设施与 agent。"),
  mk("Algomatic", "https://algomatic.jp", "日本", "通用 agent", "日本的生成式 AI / agent 产品公司。"),
];

// 便捷构造：无公开融资明细，rounds 留空
function mk(
  name: string,
  url: string,
  region: "中国" | "美国" | "日本",
  agent_subcategory: string,
  description: string
): SeedStartup {
  return { name, url, region, agent_subcategory, description, rounds: [] };
}
