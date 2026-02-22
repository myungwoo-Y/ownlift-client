import type { RoundingMode } from "@ownlift/schemas";
import { roundWeight } from "./rounding";

interface CalcWeightParams {
  tm: number;
  percentage: number;
  roundingIncrement: number;
  roundingMode: RoundingMode;
}

/**
 * Calculate the working weight: TM × percentage, then round.
 *
 * @param percentage — expressed as a whole number (e.g. 85 for 85%)
 */
export function calcWeight({
  tm,
  percentage,
  roundingIncrement,
  roundingMode,
}: CalcWeightParams): number {
  const raw = tm * (percentage / 100);
  return roundWeight({
    weight: raw,
    increment: roundingIncrement,
    mode: roundingMode,
  });
}
