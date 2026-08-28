import type {
  TechDomain,
  OriginLang,
  AgentSubcategory,
  Region,
  AuthenticityLabel,
} from "@/config/scoring";

export interface Repo {
  id: number;
  name: string;
  owner: string;
  full_name: string;
  url: string;
  description: string | null;
  language: string | null;
  origin_lang: OriginLang | null;
  primary_domain: TechDomain | null;
  secondary_domains: string[];
  topics: string[];
  created_at: string | null;
  first_seen_at: string;
}

export interface RepoSignals {
  repo_id: number;
  ts: string;
  stars: number;
  star_velocity_7d: number;
  star_accel: number;
  growth_rate: number;
  breakout_flag: number;
  corroboration_count: number;
  discussion_score: number;
  momentum_score: number;
}

export interface RepoAssessment {
  repo_id: number;
  prompt_version: string;
  provider: string;
  potential_score: number;
  subscores: {
    novelty: number;
    momentum: number;
    adoption: number;
    team: number;
    defensibility: number;
  };
  one_liner: string;
  thesis: string;
  risks: string[];
  comparable_to: string;
  final_score: number;
  created_at: string;
}

export interface RepoAuthenticity {
  repo_id: number;
  label: AuthenticityLabel;
  evidence: string[];
  flags: string[];
  checked_at: string;
}

export interface Mention {
  id?: number;
  entity_type: "repo" | "startup";
  entity_id: string;
  source: "hackernews" | "reddit" | "producthunt" | "github_trending" | "news";
  url: string;
  title: string;
  score: number;
  num_comments: number;
  sentiment: number;
  ts: string;
}

export interface Startup {
  id: number;
  name: string;
  url: string | null;
  batch: string | null;
  region: Region | null;
  hq: string | null;
  agent_subcategory: AgentSubcategory | null;
  tech_stack: string[];
  description: string | null;
  first_seen_at: string;
  source: string | null;
}

export interface FundingRound {
  id?: number;
  startup_id: number;
  stage: string;
  amount_usd: number | null;
  date: string | null;
  lead_investors: string[];
  all_investors: string[];
  source_url: string | null;
}

export interface StartupAssessment {
  startup_id: number;
  prompt_version: string;
  provider: string;
  potential_score: number;
  momentum_score: number;
  subscores: {
    team: number;
    funding_signal: number;
    traction: number;
    market_timing: number;
    moat_vs_big_labs: number;
  };
  fourc: {
    company: string;
    customers: string;
    competitors: string;
    collaborators: string;
  };
  thesis: string;
  risks: string[];
  final_score: number;
  created_at: string;
}
