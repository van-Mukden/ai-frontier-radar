import { BREAKOUT } from "@/config/scoring";

export interface SignalInput {
  stars: number;
  gained7d: number;
  gainedPrev7d: number;
  ageDays: number; // 仓库创建至今天数
  corroborationCount: number;
  discussionScore: number;
}

export interface ComputedSignals {
  star_velocity_7d: number; // 每天（7 日实测）
  star_accel: number;
  growth_rate: number;
  avg_velocity: number; // 自创建以来日均 star/天
  breakout_flag: number;
  momentum_score: number; // 0-100
}

export function computeRepoSignals(i: SignalInput): ComputedSignals {
  const star_velocity_7d = i.gained7d / 7;
  const star_accel = i.gained7d - i.gainedPrev7d;
  const growth_rate = i.gained7d / Math.max(i.stars, 50);
  const avg_velocity = i.stars / Math.max(i.ageDays, 1);

  // 有效速度：优先用真实 7 日实测（有时间戳时），否则退回自创建日均
  const effVel = star_velocity_7d > 0 ? star_velocity_7d : avg_velocity;

  // 爆发：① 相对增长快且绝对够；② 7 日实测速度快；③ 自创建日均很高（年轻又高星）
  const breakout_flag =
    (growth_rate >= BREAKOUT.minGrowthRate && i.gained7d >= BREAKOUT.minAbsoluteGain7d) ||
    star_velocity_7d >= BREAKOUT.minVelocityPerDay ||
    avg_velocity >= BREAKOUT.minAvgVelPerDay
      ? 1
      : 0;

  // 势能：有效速度（主）+ 相对增长 + 跨源印证，归一到 0-100
  const velTerm = Math.min(effVel / 60, 1); // 60/天 → 满
  const growthTerm = Math.min(growth_rate, 2) / 2;
  const corrNorm = Math.min(i.corroborationCount / 3, 1);
  const momentum_score = Math.round(100 * (0.6 * velTerm + 0.2 * growthTerm + 0.2 * corrNorm));

  return { star_velocity_7d, star_accel, growth_rate, avg_velocity, breakout_flag, momentum_score };
}
