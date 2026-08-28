# 一键部署（面试用）

app 用了本地 SQLite（`better-sqlite3`），要**保留全部功能（含 Copilot 写库、真实性重核查）**，选一个跑**普通 Node server**的平台即可，SQLite 原生就能用。仓库里已打包好一份 `data/radar.db`（含演示数据），部署即有内容。

## 方案 A：Render（免费，推荐）

1. 把代码推到 GitHub（见下方「首次推送」）。
2. 打开 https://render.com → **New → Blueprint** → 选这个仓库（会自动读根目录的 `render.yaml`）。
3. 填 secret（在 Render 面板）：`LLM_API_KEY`（你的 Kimi key）、`GITHUB_TOKEN`、可选 `TAVILY_API_KEY`（Copilot 联网）。`LLM_BASE_URL / LLM_MODEL` 已在 yaml 里写好。
4. Create → 等构建完成，拿到 `https://xxx.onrender.com`。

- 免费档闲置会休眠，首次访问冷启 ~30s，之后正常。
- 容器文件系统可写 → Copilot 入库、重核查都能用（重新部署会回到打包的 `radar.db`）。

## 方案 B：Railway（最顺，但要绑卡/试用额度）

railway.app → New Project → Deploy from GitHub → 选仓库，自动识别 Next.js。Variables 里填同样的 env。也可挂一个 Volume 到 `/data` 并设 `RADAR_DB_PATH=/data/radar.db` 让写入持久化。

## 关于 Vercel（不推荐给这个项目）

Vercel 是 serverless、文件系统只读，SQLite **写不了**（Copilot 入库/重核查会失败），会牺牲功能。硬要上 Vercel 得把 DB 换成云端（Turso/Neon），改动大，面试来不及就别折腾。

## 联网搜索：用 Tavily（不用 Azure）

Copilot 的联网走多 provider：**Tavily 优先**（tavily.com 注册即得 key，免费 1000/月），Bing 兜底。配 `TAVILY_API_KEY` 即可联网；不配也能基于本地数据问答，只是不联网。

## 首次推送到 GitHub

```bash
git add -A
git commit -m "AI Frontier Radar"
gh repo create ai-frontier-radar --public --source=. --push
# 或手动：git remote add origin <repo-url> && git push -u origin main
```

`.env` 已被 gitignore，不会泄漏 key；`data/radar.db` 会被提交（部署要用）。
