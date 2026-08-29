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

  // 防污染守卫：离线 mock 默认拒绝写生产库（避免 mock 数据混入线上）
  const allowMock = process.env.RADAR_ALLOW_MOCK === "1" || process.argv.includes("--allow-mock");
  if (providerName() === "mock" && !allowMock) {
    console.error("⚠️  当前是离线 mock（未配置 LLM key），已拒绝写入以免污染生产数据。");
    console.error("    · 生产/部署：配置 LLM_API_KEY 用真实模型再采集。");
    console.error("    · 仅本地预览：加 --allow-mock（或 RADAR_ALLOW_MOCK=1）显式允许写 mock 数据。");
    process.exit(1);
  }

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
