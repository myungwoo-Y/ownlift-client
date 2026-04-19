import {
  getWorkoutResultsByInstance,
  type ProgramInstanceRecord,
  type SessionStubRecord,
  type WorkoutResultRecord,
} from "@ownlift/db";
import { useEffect, useMemo, useState } from "react";

interface UsePlanActivitySummaryParams {
  instance: ProgramInstanceRecord | null;
  currentWeekStubs: SessionStubRecord[];
  stubs: SessionStubRecord[];
}

export interface PlanActivitySummary {
  currentWeekCompleted: number;
  currentWeekTotal: number;
  currentCycleCompleted: number;
  currentCycleTotal: number;
  recentWorkoutCount: number;
}

const EMPTY_SUMMARY: PlanActivitySummary = {
  currentWeekCompleted: 0,
  currentWeekTotal: 0,
  currentCycleCompleted: 0,
  currentCycleTotal: 0,
  recentWorkoutCount: 0,
};

function getStartOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function getCurrentCycleStubs(
  stubs: SessionStubRecord[],
  cycleIndex: number,
): SessionStubRecord[] {
  return stubs.filter((stub) => stub.cycleIndex === cycleIndex);
}

export function usePlanActivitySummary({
  instance,
  currentWeekStubs,
  stubs,
}: UsePlanActivitySummaryParams): PlanActivitySummary {
  const [workoutResults, setWorkoutResults] = useState<WorkoutResultRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkoutResults() {
      if (!instance) {
        setWorkoutResults([]);
        return;
      }

      try {
        const nextResults = await getWorkoutResultsByInstance(instance.instanceId);
        if (!cancelled) {
          setWorkoutResults(nextResults);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load plan activity summary", error);
          setWorkoutResults([]);
        }
      }
    }

    void loadWorkoutResults();

    return () => {
      cancelled = true;
    };
  }, [instance, stubs]);

  return useMemo(() => {
    if (!instance) {
      return EMPTY_SUMMARY;
    }

    const currentCycleStubs = getCurrentCycleStubs(stubs, instance.state.currentCycle);
    const currentWeekCompleted = currentWeekStubs.filter(
      (stub) => stub.status === "completed",
    ).length;
    const currentCycleCompleted = currentCycleStubs.filter(
      (stub) => stub.status === "completed",
    ).length;

    const now = new Date();
    const recentWorkoutStart = getStartOfDay(now);
    recentWorkoutStart.setDate(recentWorkoutStart.getDate() - 6);

    let recentWorkoutCount = 0;

    for (const result of workoutResults) {
      const completedAt = new Date(result.completedAt);
      if (Number.isNaN(completedAt.getTime())) {
        continue;
      }

      if (completedAt >= recentWorkoutStart) {
        recentWorkoutCount += 1;
      }
    }

    return {
      currentWeekCompleted,
      currentWeekTotal: currentWeekStubs.length,
      currentCycleCompleted,
      currentCycleTotal: currentCycleStubs.length,
      recentWorkoutCount,
    };
  }, [currentWeekStubs, instance, stubs, workoutResults]);
}
