import { describe, expect, it } from "vitest";
import { calcWeight } from "../../src/math/percentage";

describe("calcWeight", () => {
  const params = {
    roundingIncrement: 2.5,
    roundingMode: "nearest" as const,
  };

  it("calculates Week 1 set 1 (65% of 140kg TM)", () => {
    // 140 * 0.65 = 91 → round to 2.5 → 90
    const result = calcWeight({ tm: 140, percentage: 65, ...params });
    expect(result).toBe(90);
  });

  it("calculates Week 1 set 2 (75% of 140kg TM)", () => {
    // 140 * 0.75 = 105 → exact
    const result = calcWeight({ tm: 140, percentage: 75, ...params });
    expect(result).toBe(105);
  });

  it("calculates Week 1 set 3 (85% of 140kg TM)", () => {
    // 140 * 0.85 = 119 → round to 120
    const result = calcWeight({ tm: 140, percentage: 85, ...params });
    expect(result).toBe(120);
  });

  it("calculates Week 2 set 3 (90% of 100kg TM)", () => {
    // 100 * 0.90 = 90 → exact
    const result = calcWeight({ tm: 100, percentage: 90, ...params });
    expect(result).toBe(90);
  });

  it("calculates Week 3 set 3 (95% of 180kg TM)", () => {
    // 180 * 0.95 = 171 → round(171/2.5)*2.5 = 68*2.5 = 170
    const result = calcWeight({ tm: 180, percentage: 95, ...params });
    expect(result).toBe(170);
  });

  it("rounds down when mode=down", () => {
    // 140 * 0.85 = 119 → floor to 2.5 → 117.5
    const result = calcWeight({
      tm: 140,
      percentage: 85,
      roundingIncrement: 2.5,
      roundingMode: "down",
    });
    expect(result).toBe(117.5);
  });

  it("rounds with 5lb increment", () => {
    // 315 * 0.70 = 220.5 → round to 5 → 220
    const result = calcWeight({
      tm: 315,
      percentage: 70,
      roundingIncrement: 5,
      roundingMode: "nearest",
    });
    expect(result).toBe(220);
  });
});
