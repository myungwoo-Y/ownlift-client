import { complete, initialize, prescribe } from "@ownlift/core";
import type { ProgramInstanceRecord, SessionStubRecord } from "@ownlift/db";
import {
    bulkCreateStubs,
    createPrescription,
    createProgramInstance,
    getActiveInstance,
    getNextIncompleteStub,
    getStubsByInstance,
    getStubsByWeek,
    reorderStubsByWeek,
    setSetting,
    updateInstanceState,
    updateStubStatus,
} from "@ownlift/db";
import type { ProgramParams } from "@ownlift/schemas";
import { create } from "zustand";

let loadProgramInFlight: Promise<void> | null = null;

function generateId(): string {
  // Simple UUID v4 generator (no external dep needed at runtime)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface ProgramStore {
  instance: ProgramInstanceRecord | null;
  stubs: SessionStubRecord[];
  currentWeekStubs: SessionStubRecord[];
  nextStub: SessionStubRecord | null;
  todayStub: SessionStubRecord | null;
  isLoading: boolean;
  hasHydrated: boolean;

  loadProgram: () => Promise<void>;
  initProgram: (params: ProgramParams) => Promise<void>;
  completeSession: (sessionId: string) => Promise<void>;
  reorderCurrentWeek: (orderedSessionIds: string[]) => Promise<void>;
}

export const useProgramStore = create<ProgramStore>((set, get) => ({
  instance: null,
  stubs: [],
  currentWeekStubs: [],
  nextStub: null,
  todayStub: null,
  isLoading: true,
  hasHydrated: false,

  loadProgram: async () => {
    if (loadProgramInFlight) {
      return loadProgramInFlight;
    }

    const loadPromise = (async () => {
      try {
        if (!get().hasHydrated) {
          set({ isLoading: true });
        }

        const instance = await getActiveInstance();
        if (!instance) {
          set({
            instance: null,
            stubs: [],
            currentWeekStubs: [],
            nextStub: null,
            todayStub: null,
            isLoading: false,
            hasHydrated: true,
          });
          return;
        }

        const stubs = await getStubsByInstance(instance.instanceId);
        const currentWeekStubs = await getStubsByWeek({
          instanceId: instance.instanceId,
          cycleIndex: instance.state.currentCycle,
          weekIndex: instance.state.currentWeek,
        });
        const nextStub = await getNextIncompleteStub(instance.instanceId);
        const todayStub = nextStub;

        set({
          instance,
          stubs,
          currentWeekStubs,
          nextStub,
          todayStub,
          isLoading: false,
          hasHydrated: true,
        });
      } catch (error) {
        set({ isLoading: false, hasHydrated: true });
        throw error;
      }
    })();

    loadProgramInFlight = loadPromise;
    try {
      await loadPromise;
    } finally {
      loadProgramInFlight = null;
    }
  },

  initProgram: async (params: ProgramParams) => {
    const result = initialize({ params });
    const instanceId = generateId();
    const now = new Date().toISOString();

    await createProgramInstance({
      instanceId,
      programId: result.programId,
      programVersion: result.programVersion,
      name: null,
      startDate: now,
      params,
      state: result.state,
    });

    const stubRecords = result.stubs.map((stub) => ({
      sessionId: generateId(),
      instanceId,
      scheduledDate: null,
      ...stub,
    }));
    await bulkCreateStubs(stubRecords);

    // Pre-generate prescriptions for all stubs
    for (const stub of stubRecords) {
      const rx = prescribe({
        params,
        state: result.state,
        weekIndex: stub.weekIndex,
        mainLift: stub.mainLiftKey,
      });
      await createPrescription({
        sessionId: stub.sessionId,
        instanceId,
        data: rx,
      });
    }

    // Save settings
    await setSetting({ key: "unit", value: params.unit });
    await setSetting({ key: "roundingIncrement", value: String(params.roundingIncrement) });
    await setSetting({ key: "roundingMode", value: params.roundingMode });
    await setSetting({ key: "tmIncreaseUpper", value: String(params.tmIncreaseUpper) });
    await setSetting({ key: "tmIncreaseLower", value: String(params.tmIncreaseLower) });
    await setSetting({ key: "warmUpEnabled", value: String(params.warmUpEnabled) });
    await setSetting({ key: "includeDeload", value: String(params.includeDeload) });

    await get().loadProgram();
  },

  completeSession: async (sessionId: string) => {
    const { instance } = get();
    if (!instance) return;

    await updateStubStatus({ sessionId, status: "completed" });

    const result = complete({
      params: instance.params,
      state: instance.state,
    });

    await updateInstanceState({
      instanceId: instance.instanceId,
      state: result.newState,
    });

    // If cycle advanced, generate stubs + prescriptions for next cycle
    if (result.cycleAdvanced) {
      const newStubs = initialize({ params: instance.params }).stubs.map((s) => ({
        ...s,
        cycleIndex: result.newState.currentCycle,
        sessionId: generateId(),
        instanceId: instance.instanceId,
        scheduledDate: null,
      }));
      await bulkCreateStubs(newStubs);

      for (const stub of newStubs) {
        const rx = prescribe({
          params: instance.params,
          state: result.newState,
          weekIndex: stub.weekIndex,
          mainLift: stub.mainLiftKey,
        });
        await createPrescription({
          sessionId: stub.sessionId,
          instanceId: instance.instanceId,
          data: rx,
        });
      }
    }
  },

  reorderCurrentWeek: async (orderedSessionIds: string[]) => {
    const { instance, currentWeekStubs } = get();
    if (!instance) return;

    if (orderedSessionIds.length !== currentWeekStubs.length) {
      throw new Error("Ordered session count does not match current week session count.");
    }

    const isUnchanged = orderedSessionIds.every(
      (sessionId, index) => currentWeekStubs[index]?.sessionId === sessionId,
    );
    if (isUnchanged) return;

    await reorderStubsByWeek({
      instanceId: instance.instanceId,
      cycleIndex: instance.state.currentCycle,
      weekIndex: instance.state.currentWeek,
      orderedSessionIds,
    });

    await get().loadProgram();
  },
}));
