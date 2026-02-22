interface CalcE1RMParams {
  weight: number;
  reps: number;
}

/**
 * Estimate 1-rep max using the Epley formula.
 *
 * Epley: e1RM = weight × (1 + reps / 30)
 *
 * Returns the weight itself for singles (reps ≤ 1).
 */
export function calcE1RM({ weight, reps }: CalcE1RMParams): number {
  if (reps <= 1) {
    return weight;
  }
  return Math.round(weight * (1 + reps / 30) * 100) / 100;
}
