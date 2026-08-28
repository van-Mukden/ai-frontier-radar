import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

// 数据库文件路径：默认 ./data/radar.db，可用 RADAR_DB_PATH 覆盖（部署用）
const DB_PATH = process.env.RADAR_DB_PATH
  ? path.resolve(process.env.RADAR_DB_PATH)
  : path.join(process.cwd(), "data", "radar.db");
const DATA_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  _db = db;
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
  -- ======== Module 1: 开源项目 ========
  CREATE TABLE IF NOT EXISTS repos (
    id            INTEGER PRIMARY KEY,          -- github repo id
    name          TEXT NOT NULL,
    owner         TEXT NOT NULL,
    full_name     TEXT NOT NULL UNIQUE,
    url           TEXT NOT NULL,
    description   TEXT,
    language      TEXT,
    origin_lang   TEXT,                         -- 中文/英文/其他
    primary_domain TEXT,
    secondary_domains TEXT,                     -- json array
    topics        TEXT,                         -- json array
    created_at    TEXT,
    first_seen_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS repo_snapshots (
    repo_id       INTEGER NOT NULL,
    ts            TEXT NOT NULL,
    stars         INTEGER,
    forks         INTEGER,
    watchers      INTEGER,
    open_prs      INTEGER,
    contributors_30d INTEGER,
    commits_7d    INTEGER,
    releases_90d  INTEGER,
    PRIMARY KEY (repo_id, ts),
    FOREIGN KEY (repo_id) REFERENCES repos(id)
  );

  CREATE TABLE IF NOT EXISTS repo_signals (
    repo_id            INTEGER PRIMARY KEY,
    ts                 TEXT NOT NULL,
    stars              INTEGER,
    star_velocity_7d   REAL,
    star_accel         REAL,
    growth_rate        REAL,
    breakout_flag      INTEGER DEFAULT 0,
    corroboration_count INTEGER DEFAULT 0,
    discussion_score   REAL DEFAULT 0,
    momentum_score     REAL DEFAULT 0,
    FOREIGN KEY (repo_id) REFERENCES repos(id)
  );

  CREATE TABLE IF NOT EXISTS repo_assessments (
    repo_id        INTEGER PRIMARY KEY,
    prompt_version TEXT,
    provider       TEXT,
    potential_score REAL,
    subscores      TEXT,     -- json {novelty,momentum,adoption,team,defensibility}
    one_liner      TEXT,
    thesis         TEXT,
    risks          TEXT,     -- json array
    comparable_to  TEXT,
    final_score    REAL,     -- 混合后用于排名
    created_at     TEXT,
    FOREIGN KEY (repo_id) REFERENCES repos(id)
  );

  -- L2 真实性核查
  CREATE TABLE IF NOT EXISTS repo_authenticity (
    repo_id    INTEGER PRIMARY KEY,
    label      TEXT,     -- 跑通/跑不通/可疑·充数/未测
    evidence   TEXT,     -- json array of strings
    flags      TEXT,     -- json array（命中的充数模式）
    checked_at TEXT,
    FOREIGN KEY (repo_id) REFERENCES repos(id)
  );

  -- ======== 共用: 跨源提及 ========
  CREATE TABLE IF NOT EXISTS mentions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type  TEXT NOT NULL,   -- repo / startup
    entity_id    TEXT NOT NULL,   -- repo full_name 或 startup name
    source       TEXT NOT NULL,   -- hackernews/reddit/producthunt/github_trending/news
    url          TEXT,
    title        TEXT,
    score        INTEGER,
    num_comments INTEGER,
    sentiment    REAL,
    ts           TEXT,
    UNIQUE(source, url, entity_id)
  );

  -- ======== Module 2: startup ========
  CREATE TABLE IF NOT EXISTS startups (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL UNIQUE,
    url           TEXT,
    batch         TEXT,
    region        TEXT,            -- 中国/美国/日本
    hq            TEXT,
    agent_subcategory TEXT,
    tech_stack    TEXT,            -- json array（Kimi 抽取，图谱技术连线用）
    description   TEXT,
    first_seen_at TEXT NOT NULL,
    source        TEXT
  );

  CREATE TABLE IF NOT EXISTS funding_rounds (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    startup_id    INTEGER NOT NULL,
    stage         TEXT,
    amount_usd    REAL,
    date          TEXT,
    lead_investors TEXT,   -- json array
    all_investors TEXT,    -- json array
    source_url    TEXT,
    FOREIGN KEY (startup_id) REFERENCES startups(id)
  );

  CREATE TABLE IF NOT EXISTS startup_assessments (
    startup_id     INTEGER PRIMARY KEY,
    prompt_version TEXT,
    provider       TEXT,
    potential_score REAL,
    momentum_score REAL,
    subscores      TEXT,   -- json {team,funding_signal,traction,market_timing,moat_vs_big_labs}
    fourc          TEXT,   -- json {company,customers,competitors,collaborators}
    thesis         TEXT,
    risks          TEXT,   -- json array
    final_score    REAL,
    created_at     TEXT,
    FOREIGN KEY (startup_id) REFERENCES startups(id)
  );

  -- ======== digest ========
  CREATE TABLE IF NOT EXISTS digests (
    date         TEXT PRIMARY KEY,
    payload      TEXT,     -- json
    delivered_to TEXT,     -- json array
    created_at   TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_mentions_entity ON mentions(entity_type, entity_id);
  CREATE INDEX IF NOT EXISTS idx_snapshots_repo ON repo_snapshots(repo_id, ts);
  `);

  // 幂等迁移：给已存在的旧库补 tech_stack 列
  try {
    db.exec("ALTER TABLE startups ADD COLUMN tech_stack TEXT");
  } catch {
    /* 列已存在，忽略 */
  }
}
