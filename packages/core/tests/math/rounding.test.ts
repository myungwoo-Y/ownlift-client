import { describe, expect, it } from "vitest";
import { roundWeight } from "../../src/math/rounding";

describe("roundWeight", () => {
  describe("mode: nearest", () => {
    it("rounds to nearest 2.5 (kg)", () => {
      expect(roundWeight({ weight: 102.3, increment: 2.5, mode: "nearest" })).toBe(102.5);
      expect(roundWeight({ weight: 101.2, increment: 2.5, mode: "nearest" })).toBe(100);
      expect(roundWeight({ weight: 101.25, increment: 2.5, mode: "nearest" })).toBe(102.5);
    });

    it("rounds to nearest 5 (lb)", () => {
      expect(roundWeight({ weight: 227, increment: 5, mode: "nearest" })).toBe(225);
      expect(roundWeight({ weight: 228, increment: 5, mode: "nearest" })).toBe(230);
    });

    it("returns exact when already on increment", () => {
      expect(roundWeight({ weight: 100, increment: 2.5, mode: "nearest" })).toBe(100);
    });
  });

  describe("mode: down", () => {
    it("always rounds down", () => {
      expect(roundWeight({ weight: 102.3, increment: 2.5, mode: "down" })).toBe(100);
      expect(roundWeight({ weight: 104.9, increment: 2.5, mode: "down" })).toBe(102.5);
    });

    it("returns exact when already on increment", () => {
      expect(roundWeight({ weight: 100, increment: 5, mode: "down" })).toBe(100);
    });
  });

  describe("mode: up", () => {
    it("always rounds up", () => {
      expect(roundWeight({ weight: 100.1, increment: 2.5, mode: "up" })).toBe(102.5);
      expect(roundWeight({ weight: 102.5, increment: 2.5, mode: "up" })).toBe(102.5);
    });
  });

  describe("edge cases", () => {
    it("handles zero weight", () => {
      expect(roundWeight({ weight: 0, increment: 2.5, mode: "nearest" })).toBe(0);
    });

    it("handles zero increment (returns weight unchanged)", () => {
      expect(roundWeight({ weight: 102.3, increment: 0, mode: "nearest" })).toBe(102.3);
    });

    it("handles negative increment (returns weight unchanged)", () => {
      expect(roundWeight({ weight: 102.3, increment: -1, mode: "nearest" })).toBe(102.3);
    });
  });
});
