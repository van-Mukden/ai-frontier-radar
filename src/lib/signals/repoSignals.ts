import { BREAKOUT } from "@/config/scoring";

export interface SignalInput {
  stars: number;
  gained7d: number;
  gainedPrev7d: number;
  corroborationCount: number;
  discussionScore: number;
}

export interface ComputedSignals {
  star_velocity_7d: number; // 每天
  star_accel: number;
  growth_rate: number;
  breakout_flag: number;
  momentum_score: number; // 0-100
}

export function computeRepoSignals(i: SignalInput): ComputedSignals {
  const star_velocity_7d = i.gained7d / 7;
  const star_accel = i.gained7d - i.gainedPrev7d;
  const growth_rate = i.gained7d / Math.max(i.stars, 50);
  const breakout_flag =
    growth_rate >= BREAKOUT.minGrowthRate && i.gained7d >= BREAKOUT.minAbsoluteGain7d ? 1 : 0;

  // momentum：相对增长(压缩) + 加速度(正向) + 跨源印证，归一到 0-100
  const growthTerm = Math.min(growth_rate, 2) / 2; // 0..1
  const accel = Math.max(0, star_accel);
  const accelNorm = Math.min(accel / Math.max(i.gainedPrev7d + 20, 40), 1);
  const corrNorm = Math.min(i.corroborationCount / 3, 1);
  const momentum_score = Math.round(
    100 * (0.5 * growthTerm + 0.3 * accelNorm + 0.2 * corrNorm)
  );

  return { star_velocity_7d, star_accel, growth_rate, breakout_flag, momentum_score };
}
