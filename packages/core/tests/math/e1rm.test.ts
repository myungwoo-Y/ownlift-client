import { describe, expect, it } from "vitest";
import { calcE1RM } from "../../src/math/e1rm";

describe("calcE1RM", () => {
  it("returns weight itself for single rep", () => {
    expect(calcE1RM({ weight: 140, reps: 1 })).toBe(140);
  });

  it("returns weight for 0 reps (edge case)", () => {
    expect(calcE1RM({ weight: 140, reps: 0 })).toBe(140);
  });

  it("calculates e1RM with Epley formula (100kg × 5 reps)", () => {
    // Epley: 100 * (1 + 5/30) = 100 * 1.1667 = 116.67
    expect(calcE1RM({ weight: 100, reps: 5 })).toBeCloseTo(116.67, 1);
  });

  it("calculates e1RM (85kg × 8 reps)", () => {
    // 85 * (1 + 8/30) = 85 * 1.2667 = 107.67
    expect(calcE1RM({ weight: 85, reps: 8 })).toBeCloseTo(107.67, 1);
  });

  it("calculates e1RM (100kg × 10 reps)", () => {
    // 100 * (1 + 10/30) = 100 * 1.333 = 133.33
    expect(calcE1RM({ weight: 100, reps: 10 })).toBeCloseTo(133.33, 1);
  });
});
