import { prescribe } from "@ownlift/core";
import {
  getPrescriptionBySession,
  updatePrescription,
  type PrescriptionRecord,
  type ProgramInstanceRecord,
  type SessionStubRecord,
} from "@ownlift/db";
import type { MainLift, ProgramState } from "@ownlift/schemas";

function isMutableStub(stub: SessionStubRecord): boolean {
  return stub.status !== "completed" && stub.status !== "skipped";
}

export async function loadSyncedPrescriptionForSession({
  sessionId,
  instance,
  stub,
}: {
  sessionId: string;
  instance: ProgramInstanceRecord | null;
  stub: SessionStubRecord | undefined;
}): Promise<PrescriptionRecord | null> {
  const rx = await getPrescriptionBySession(sessionId);
  if (!rx || !instance || !stub || !isMutableStub(stub)) {
    return rx;
  }

  const currentTm = instance.state.trainingMaxes[stub.mainLiftKey];
  if (rx.data.trainingMax === currentTm) {
    return rx;
  }

  const syncedData = prescribe({
    params: instance.params,
    state: instance.state,
    weekIndex: stub.weekIndex,
    mainLift: stub.mainLiftKey,
  });

  await updatePrescription({
    sessionId,
    data: syncedData,
  });

  return {
    ...rx,
    data: syncedData,
  };
}

export async function syncLiftPrescriptions({
  instance,
  stubs,
  lift,
  state,
}: {
  instance: ProgramInstanceRecord;
  stubs: SessionStubRecord[];
  lift: MainLift;
  state: ProgramState;
}): Promise<void> {
  const targetStubs = stubs.filter((stub) => (
    stub.mainLiftKey === lift && isMutableStub(stub)
  ));

  for (const stub of targetStubs) {
    const data = prescribe({
      params: instance.params,
      state,
      weekIndex: stub.weekIndex,
      mainLift: stub.mainLiftKey,
    });

    await updatePrescription({
      sessionId: stub.sessionId,
      data,
    });
  }
}
