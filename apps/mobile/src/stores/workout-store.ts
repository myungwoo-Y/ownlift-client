import {
    createWorkoutResult,
    getOrCreateExercise,
    getPrescriptionBySession,
    getSetLogsBySession,
    upsertSetLog,
} from "@ownlift/db";
import type { PrescriptionData, PrescriptionSet, SetType } from "@ownlift/schemas";
import { nowISO } from "@ownlift/schemas";
import { create } from "zustand";

function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface WorkoutSetState {
  id: string;
  setOrder: number;
  prescribed: PrescriptionSet;
  actualWeight: string;
  actualReps: string;
  isCompleted: boolean;
  isAmrap: boolean;
}

const MAIN_LIFT_LABELS: Record<string, string> = {
  squat: "Squat",
  bench: "Bench Press",
  deadlift: "Deadlift",
  press: "Press",
};

interface WorkoutStore {
  sessionId: string | null;
  instanceId: string | null;
  prescription: PrescriptionData | null;
  sets: WorkoutSetState[];
  isLoading: boolean;
  startedAt: string | null;

  startWorkout: (sessionId: string, instanceId: string) => Promise<void>;
  updateSet: (setId: string, field: "actualWeight" | "actualReps", value: string) => void;
  toggleSetComplete: (setId: string) => Promise<void>;
  completeWorkout: () => Promise<void>;
  resetWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  sessionId: null,
  instanceId: null,
  prescription: null,
  sets: [],
  isLoading: true,
  startedAt: null,

  startWorkout: async (sessionId, instanceId) => {
    set({ isLoading: true, sessionId, instanceId });

    const rx = await getPrescriptionBySession(sessionId);
    if (!rx) {
      set({ isLoading: false });
      return;
    }

    // Load existing set logs (if resuming)
    const existingLogs = await getSetLogsBySession(sessionId);
    const existingMap = new Map(existingLogs.map((l) => [l.setOrder, l]));

    // Only show work sets (skip warmup)
    const workSets = rx.data.sets.filter((s) => !s.isWarmup);

    const sets: WorkoutSetState[] = workSets.map((prescribed) => {
      const existing = existingMap.get(prescribed.setOrder);
      return {
        id: existing?.id ?? generateId(),
        setOrder: prescribed.setOrder,
        prescribed,
        actualWeight: existing?.actualWeight != null
          ? String(existing.actualWeight)
          : String(prescribed.targetWeight),
        actualReps: existing?.actualReps != null
          ? String(existing.actualReps)
          : String(prescribed.targetReps),
        isCompleted: existing?.isCompleted ?? false,
        isAmrap: prescribed.isAmrap,
      };
    });

    set({
      prescription: rx.data,
      sets,
      isLoading: false,
      startedAt: nowISO(),
    });
  },

  updateSet: (setId, field, value) => {
    set((state) => ({
      sets: state.sets.map((s) =>
        s.id === setId ? { ...s, [field]: value } : s,
      ),
    }));
  },

  toggleSetComplete: async (setId) => {
    const { sets, sessionId } = get();
    const setData = sets.find((s) => s.id === setId);
    if (!setData || !sessionId) return;
    const mainLift = get().prescription?.mainLift;
    if (!mainLift) return;

    const newCompleted = !setData.isCompleted;
    const exercise = await getOrCreateExercise({
      id: mainLift,
      name: MAIN_LIFT_LABELS[mainLift] ?? mainLift,
    });

    set((state) => ({
      sets: state.sets.map((s) =>
        s.id === setId ? { ...s, isCompleted: newCompleted } : s,
      ),
    }));

    // Persist to DB
    await upsertSetLog({
      id: setData.id,
      sessionId,
      exerciseId: exercise.id,
      setType: "main" as SetType,
      setOrder: setData.setOrder,
      planned: {
        targetWeight: setData.prescribed.targetWeight,
        targetReps: setData.prescribed.targetReps,
        percentage: setData.prescribed.percentage,
      },
      actualWeight: parseFloat(setData.actualWeight) || null,
      actualReps: parseInt(setData.actualReps, 10) || null,
      rpe: null,
      isCompleted: newCompleted,
    });
  },

  completeWorkout: async () => {
    const { sessionId, instanceId, sets } = get();
    if (!sessionId || !instanceId) return;

    const mainLift = get().prescription?.mainLift;
    if (!mainLift) return;
    const exercise = await getOrCreateExercise({
      id: mainLift,
      name: MAIN_LIFT_LABELS[mainLift] ?? mainLift,
    });

    // Save all sets
    for (const setData of sets) {
      await upsertSetLog({
        id: setData.id,
        sessionId,
        exerciseId: exercise.id,
        setType: "main" as SetType,
        setOrder: setData.setOrder,
        planned: {
          targetWeight: setData.prescribed.targetWeight,
          targetReps: setData.prescribed.targetReps,
          percentage: setData.prescribed.percentage,
        },
        actualWeight: parseFloat(setData.actualWeight) || null,
        actualReps: parseInt(setData.actualReps, 10) || null,
        rpe: null,
        isCompleted: setData.isCompleted,
      });
    }

    // Compute volume
    const totalVolume = sets.reduce((sum, s) => {
      const w = parseFloat(s.actualWeight) || 0;
      const r = parseInt(s.actualReps, 10) || 0;
      return sum + w * r;
    }, 0);

    await createWorkoutResult({
      sessionId,
      instanceId,
      completedAt: nowISO(),
      summary: {
        totalVolume,
        isPR: false,
        durationMinutes: undefined,
      },
    });
  },

  resetWorkout: () => {
    set({
      sessionId: null,
      instanceId: null,
      prescription: null,
      sets: [],
      isLoading: true,
      startedAt: null,
    });
  },
}));
