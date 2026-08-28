import { NOTABLE_ORGS, type AuthenticityLabel } from "@/config/scoring";

export interface AuthenticityInput {
  full_name: string;
  description: string | null;
  readme: string;
  tree: string[]; // 仓库文件路径
  stars: number;
  contributors: number;
  gained7d: number;
}

export interface AuthenticityResult {
  label: AuthenticityLabel;
  evidence: string[];
  flags: string[];
}

/**
 * L2 真实性核查（静态版，不执行代码 —— 安全边界见 PRD §6.5 说明）。
 * 目标不是验证功能完整，而是快速识别「充数/夸大」这类可疑仓库，
 * 正是原始需求里「号称斯坦福、塞几千个无法泛化的 skill」那类案例。
 * 真正的沙箱执行留成 env flag（RADAR_SANDBOX_RUN），默认关闭。
 */
export function staticAuthenticityCheck(i: AuthenticityInput): AuthenticityResult {
  const flags: string[] = [];
  const evidence: string[] = [];
  const readmeLower = i.readme.toLowerCase();
  const descLower = (i.description ?? "").toLowerCase();

  // 1) 声称名校/名实验室/前大厂背书，但缺乏署名/论文/org 佐证
  const claimsPrestige = NOTABLE_ORGS.some(
    (o) => readmeLower.includes(o) || descLower.includes(o)
  );
  const hasCitationOrOrg =
    /arxiv\.org|doi\.org|\bcitation\b|@\w+\.edu|orcid/i.test(i.readme) ||
    i.tree.some((p) => /paper|CITATION/i.test(p));
  if (claimsPrestige && !hasCitationOrOrg && i.contributors <= 2) {
    flags.push("prestige_claim_unbacked");
    evidence.push("README 声称名校/名实验室/前大厂背景，但无论文、引用或 org 佐证，且贡献者≤2。");
  }

  // 2) 体量异常：号称成百上千个 skill/agent/tool，实为模板复制/占位
  const bulkClaim = i.readme.match(/(\d{3,})\s*\+?\s*(skills?|agents?|tools?|plugins?|prompts?)/i);
  const skillLikeFiles = i.tree.filter((p) =>
    /(skills?|agents?|tools?|plugins?)\/.+\.(md|json|ya?ml|py|ts)$/i.test(p)
  );
  if (bulkClaim && Number(bulkClaim[1]) >= 300) {
    flags.push("bulk_padding_claim");
    evidence.push(`README 号称 ${bulkClaim[1]} 个 ${bulkClaim[2]}，属体量异常，需抽样核查是否充数。`);
    // 简单充数启发式：大量同构文件但仓库很浅（无测试/无 CI）
    const hasTests = i.tree.some((p) => /(^|\/)(tests?|__tests__|spec)\//i.test(p));
    const hasCI = i.tree.some((p) => /\.github\/workflows\//i.test(p));
    if (skillLikeFiles.length >= 100 && !hasTests && !hasCI) {
      flags.push("bulk_padding_confirmed");
      evidence.push(
        `发现 ${skillLikeFiles.length} 个同构 skill/agent 文件，但无测试、无 CI —— 高度疑似批量占位/模板复制。`
      );
    }
  }

  // 3) README 华丽但缺 quickstart / 依赖清单（跑不起来的强信号）
  const hasQuickstart = /quick\s?start|getting started|快速开始|installation|## usage/i.test(
    i.readme
  );
  const hasDeps = i.tree.some((p) =>
    /(requirements\.txt|package\.json|pyproject\.toml|Cargo\.toml|go\.mod)$/i.test(p)
  );
  const readmeLong = i.readme.length > 1500;
  if (readmeLong && !hasQuickstart && !hasDeps) {
    flags.push("no_runnable_entry");
    evidence.push("README 篇幅大但没有 quickstart，也没有依赖清单 —— 疑似无法直接运行。");
  }

  // 4) 单人极短时间一次性 dump + 高 star（star 与内容质量背离）
  if (i.contributors <= 1 && i.stars >= 500 && !hasTests(i.tree)) {
    flags.push("single_author_spike");
    evidence.push("单一贡献者却已积累高 star，且无测试 —— star 与内容成熟度背离，需警惕。");
  }

  // 判定
  let label: AuthenticityLabel = "未测";
  const strong = flags.some((f) =>
    ["bulk_padding_confirmed", "prestige_claim_unbacked", "no_runnable_entry"].includes(f)
  );
  if (strong) {
    label = "可疑·充数";
  } else if (flags.length > 0) {
    label = "可疑·充数";
    evidence.push("命中弱信号，标记为可疑待人工复核。");
  } else {
    evidence.push("静态核查未见明显异常（未做沙箱执行）。");
  }

  return { label, evidence, flags };
}

function hasTests(tree: string[]): boolean {
  return tree.some((p) => /(^|\/)(tests?|__tests__|spec)\//i.test(p));
}
