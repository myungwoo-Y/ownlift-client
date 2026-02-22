import type { RoundingMode } from "@ownlift/schemas";

interface RoundWeightParams {
  weight: number;
  increment: number;
  mode: RoundingMode;
}

/**
 * Round a weight to the nearest valid increment.
 *
 * @example
 * roundWeight({ weight: 102.3, increment: 2.5, mode: "nearest" }) // 102.5
 * roundWeight({ weight: 102.3, increment: 2.5, mode: "down" })    // 100
 * roundWeight({ weight: 102.3, increment: 2.5, mode: "up" })      // 105
 */
export function roundWeight({ weight, increment, mode }: RoundWeightParams): number {
  if (increment <= 0) {
    return weight;
  }

  switch (mode) {
    case "nearest": {
      return Math.round(weight / increment) * increment;
    }
    case "down": {
      return Math.floor(weight / increment) * increment;
    }
    case "up": {
      return Math.ceil(weight / increment) * increment;
    }
  }
}
