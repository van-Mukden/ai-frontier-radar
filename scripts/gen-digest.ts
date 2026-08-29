import "dotenv/config";
import { buildAndSendDigest } from "@/lib/pipeline/digest";
(async () => {
  const p = await buildAndSendDigest({ log: (s) => process.stderr.write(s + "\n") });
  process.stdout.write("\n===== MARKDOWN =====\n" + p.markdown + "\n");
})();
