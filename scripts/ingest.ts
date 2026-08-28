/**
 * 采集入口：npm run ingest [-- --repos 15]
 * 顺序跑 M1 仓库富化 → M2 startup → digest。
 */
import "dotenv/config";
import { ingestRepos } from "../src/lib/pipeline/ingestRepos";
import { ingestStartups } from "../src/lib/pipeline/ingestStartups";
import { buildAndSendDigest } from "../src/lib/pipeline/digest";
import { providerName } from "../src/lib/llm";

async function main() {
  const arg = process.argv.find((a, i) => process.argv[i - 1] === "--repos");
  const enrichCap = arg ? parseInt(arg, 10) : 15;
  const only = process.argv.find((a, i) => process.argv[i - 1] === "--only"); // repos | startups

  console.log(`=== AI 前沿雷达 采集开始（LLM=${providerName()}）===`);
  const t0 = Date.now();

  if (only !== "startups") {
    console.log("\n[Module 1] 开源项目");
    await ingestRepos({ enrichCap });
  }

  if (only !== "repos") {
    console.log("\n[Module 2] Startup");
    await ingestStartups({
      ycLimit: process.env.RADAR_YC_LIMIT ? Number(process.env.RADAR_YC_LIMIT) : undefined,
      hnLimit: process.env.RADAR_HN_LIMIT ? Number(process.env.RADAR_HN_LIMIT) : undefined,
    });
  }

  console.log("\n[Digest]");
  await buildAndSendDigest();

  console.log(`\n=== 完成，用时 ${((Date.now() - t0) / 1000).toFixed(0)}s ===`);
  process.exit(0);
}

main().catch((e) => {
  console.error("采集失败:", e);
  process.exit(1);
});
