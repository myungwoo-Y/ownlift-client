import type { ProgramParams } from "@ownlift/schemas";
import { describe, expect, it } from "vitest";
import {
    complete,
    initialize,
    prescribe,
} from "../../src/program/classic531";
import { DAYS_PER_WEEK } from "../../src/program/constants";

function makeParams(overrides?: Partial<ProgramParams>): ProgramParams {
  return {
    trainingMaxes: { squat: 140, bench: 100, deadlift: 180, press: 60 },
    unit: "kg",
    roundingIncrement: 2.5,
    roundingMode: "nearest",
    tmIncreaseUpper: 2.5,
    tmIncreaseLower: 5,
    liftOrder: ["squat", "bench", "deadlift", "press"],
    warmUpEnabled: true,
    includeDeload: true,
    ...overrides,
  };
}

describe("initialize", () => {
  it("creates 16 session stubs for 4-week cycle", () => {
    const params = makeParams();
    const result = initialize({ params });

    expect(result.stubs).toHaveLength(16); // 4 weeks × 4 days
    expect(result.programId).toBe("classic-531");
    expect(result.programVersion).toBe(1);
  });

  it("creates 12 session stubs when deload is disabled", () => {
    const params = makeParams({ includeDeload: false });
    const result = initialize({ params });

    expect(result.stubs).toHaveLength(12); // 3 weeks × 4 days
  });

  it("assigns correct lift keys from liftOrder", () => {
    const params = makeParams({
      liftOrder: ["deadlift", "press", "squat", "bench"],
    });
    const result = initialize({ params });

    // Week 0 stubs
    expect(result.stubs[0].mainLiftKey).toBe("deadlift");
    expect(result.stubs[1].mainLiftKey).toBe("press");
    expect(result.stubs[2].mainLiftKey).toBe("squat");
    expect(result.stubs[3].mainLiftKey).toBe("bench");
  });

  it("initializes state at cycle 0, week 0, day 0", () => {
    const params = makeParams();
    const result = initialize({ params });

    expect(result.state.currentCycle).toBe(0);
    expect(result.state.currentWeek).toBe(0);
    expect(result.state.currentDay).toBe(0);
  });

  it("copies TMs into state", () => {
    const params = makeParams();
    const result = initialize({ params });

    expect(result.state.trainingMaxes).toEqual(params.trainingMaxes);
  });
});

describe("prescribe", () => {
  const params = makeParams();
  const state = initialize({ params }).state;

  it("generates 3 warmup + 3 work sets when warmup is enabled", () => {
    const rx = prescribe({ params, state, weekIndex: 0, mainLift: "squat" });

    expect(rx.mainLift).toBe("squat");
    expect(rx.trainingMax).toBe(140);

    const warmups = rx.sets.filter((s) => s.isWarmup);
    const works = rx.sets.filter((s) => !s.isWarmup);

    expect(warmups).toHaveLength(3);
    expect(works).toHaveLength(3);
    expect(rx.sets).toHaveLength(6);
  });

  it("skips warmup sets when disabled", () => {
    const noWarmup = makeParams({ warmUpEnabled: false });
    const rx = prescribe({
      params: noWarmup,
      state,
      weekIndex: 0,
      mainLift: "squat",
    });

    expect(rx.sets).toHaveLength(3);
    expect(rx.sets.every((s) => !s.isWarmup)).toBe(true);
  });

  it("Week 1 (5s): percentages are 65/75/85, all 5 reps", () => {
    const rx = prescribe({ params, state, weekIndex: 0, mainLift: "squat" });
    const works = rx.sets.filter((s) => !s.isWarmup);

    expect(works[0].percentage).toBe(65);
    expect(works[0].targetReps).toBe(5);
    expect(works[1].percentage).toBe(75);
    expect(works[1].targetReps).toBe(5);
    expect(works[2].percentage).toBe(85);
    expect(works[2].targetReps).toBe(5);
  });

  it("Week 2 (3s): percentages are 70/80/90, all 3 reps", () => {
    const rx = prescribe({ params, state, weekIndex: 1, mainLift: "bench" });
    const works = rx.sets.filter((s) => !s.isWarmup);

    expect(works[0].percentage).toBe(70);
    expect(works[0].targetReps).toBe(3);
    expect(works[2].percentage).toBe(90);
    expect(works[2].targetReps).toBe(3);
  });

  it("Week 3 (5/3/1): percentages are 75/85/95, reps 5/3/1", () => {
    const rx = prescribe({
      params,
      state,
      weekIndex: 2,
      mainLift: "deadlift",
    });
    const works = rx.sets.filter((s) => !s.isWarmup);

    expect(works[0].targetReps).toBe(5);
    expect(works[1].targetReps).toBe(3);
    expect(works[2].targetReps).toBe(1);
    expect(works[2].percentage).toBe(95);
  });

  it("marks last work set as AMRAP on weeks 0-2", () => {
    for (const week of [0, 1, 2]) {
      const rx = prescribe({ params, state, weekIndex: week, mainLift: "squat" });
      const works = rx.sets.filter((s) => !s.isWarmup);

      expect(works[works.length - 1].isAmrap).toBe(true);
      // Non-last work sets are NOT AMRAP
      expect(works[0].isAmrap).toBe(false);
    }
  });

  it("deload week has no AMRAP", () => {
    const rx = prescribe({ params, state, weekIndex: 3, mainLift: "squat" });
    const works = rx.sets.filter((s) => !s.isWarmup);

    expect(works.every((s) => !s.isAmrap)).toBe(true);
  });

  it("calculates correct rounded weights for squat week 1", () => {
    const rx = prescribe({ params, state, weekIndex: 0, mainLift: "squat" });
    const works = rx.sets.filter((s) => !s.isWarmup);

    // 140 * 0.65 = 91 → round(91/2.5)*2.5 = 90
    expect(works[0].targetWeight).toBe(90);
    // 140 * 0.75 = 105 → exact
    expect(works[1].targetWeight).toBe(105);
    // 140 * 0.85 = 119 → round(119/2.5)*2.5 = 120
    expect(works[2].targetWeight).toBe(120);
  });
});

describe("complete", () => {
  const params = makeParams();

  it("advances day within the same week", () => {
    const state = { currentCycle: 0, currentWeek: 0, currentDay: 0, trainingMaxes: { ...params.trainingMaxes } };
    const { newState, cycleAdvanced } = complete({ params, state });

    expect(newState.currentDay).toBe(1);
    expect(newState.currentWeek).toBe(0);
    expect(newState.currentCycle).toBe(0);
    expect(cycleAdvanced).toBe(false);
  });

  it("advances to next week when day overflows", () => {
    const state = { currentCycle: 0, currentWeek: 0, currentDay: 3, trainingMaxes: { ...params.trainingMaxes } };
    const { newState } = complete({ params, state });

    expect(newState.currentDay).toBe(0);
    expect(newState.currentWeek).toBe(1);
    expect(newState.currentCycle).toBe(0);
  });

  it("advances to next cycle when week overflows", () => {
    const state = { currentCycle: 0, currentWeek: 3, currentDay: 3, trainingMaxes: { ...params.trainingMaxes } };
    const { newState, cycleAdvanced } = complete({ params, state });

    expect(newState.currentDay).toBe(0);
    expect(newState.currentWeek).toBe(0);
    expect(newState.currentCycle).toBe(1);
    expect(cycleAdvanced).toBe(true);
  });

  it("increases TMs at cycle boundary", () => {
    const state = { currentCycle: 0, currentWeek: 3, currentDay: 3, trainingMaxes: { ...params.trainingMaxes } };
    const { newState } = complete({ params, state });

    // Upper lifts: +2.5
    expect(newState.trainingMaxes.bench).toBe(100 + 2.5);
    expect(newState.trainingMaxes.press).toBe(60 + 2.5);
    // Lower lifts: +5
    expect(newState.trainingMaxes.squat).toBe(140 + 5);
    expect(newState.trainingMaxes.deadlift).toBe(180 + 5);
  });

  it("does NOT change TMs mid-cycle", () => {
    const state = { currentCycle: 0, currentWeek: 1, currentDay: 2, trainingMaxes: { ...params.trainingMaxes } };
    const { newState } = complete({ params, state });

    expect(newState.trainingMaxes).toEqual(params.trainingMaxes);
  });

  it("handles no-deload (3 weeks) cycle correctly", () => {
    const noDeload = makeParams({ includeDeload: false });
    const state = { currentCycle: 0, currentWeek: 2, currentDay: 3, trainingMaxes: { ...noDeload.trainingMaxes } };
    const { newState, cycleAdvanced } = complete({ params: noDeload, state });

    expect(newState.currentCycle).toBe(1);
    expect(cycleAdvanced).toBe(true);
    expect(newState.trainingMaxes.squat).toBe(140 + 5);
  });
});

describe("prescription snapshot immutability (regression)", () => {
  it("changing TMs after prescribe does NOT affect existing prescription", () => {
    const params = makeParams();
    const { state } = initialize({ params });

    // Generate a prescription
    const rx = prescribe({ params, state, weekIndex: 0, mainLift: "squat" });
    const originalWeights = rx.sets.map((s) => s.targetWeight);

    // Simulate completing the full cycle (TMs increase)
    let currentState = { ...state };
    const totalSessions = DAYS_PER_WEEK * 4;
    for (let i = 0; i < totalSessions; i++) {
      const { newState } = complete({ params, state: currentState });
      currentState = newState;
    }

    // TMs should have increased
    expect(currentState.trainingMaxes.squat).toBeGreaterThan(params.trainingMaxes.squat);

    // But the original prescription is unchanged (snapshot)
    expect(rx.sets.map((s) => s.targetWeight)).toEqual(originalWeights);
    expect(rx.trainingMax).toBe(140);
  });
});
