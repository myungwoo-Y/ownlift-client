import type { ProgramInstanceRecord, SessionStubRecord } from "@ownlift/db";
import type { PrescriptionData } from "@ownlift/schemas";
import { useEffect, useMemo, useState } from "react";
import { formatNumber } from "../../i18n";
import { loadSyncedPrescriptionForSession } from "../prescription-sync";

function getTopSetSummary(
  prescription: PrescriptionData | null | undefined,
  unit: string,
): string | null {
  const topSet = prescription?.sets.filter((setData) => !setData.isWarmup).at(-1);
  if (!topSet) {
    return null;
  }

  return `${formatNumber(topSet.targetWeight)}${unit} × ${formatNumber(topSet.targetReps)}${topSet.isAmrap ? "+" : ""}`;
}

interface UseWeekPrescriptionSummariesArgs {
  instance: ProgramInstanceRecord | null;
  weekStubs: readonly SessionStubRecord[];
  unit: string;
}

export function useWeekPrescriptionSummaries({
  instance,
  weekStubs,
  unit,
}: UseWeekPrescriptionSummariesArgs): Readonly<Record<string, string | null>> {
  const [weekPrescriptions, setWeekPrescriptions] = useState<Record<string, PrescriptionData | null>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadWeekPrescriptions() {
      if (!instance || weekStubs.length === 0) {
        setWeekPrescriptions({});
        return;
      }

      const results = await Promise.allSettled(
        weekStubs.map(async (stub) => {
          const rx = await loadSyncedPrescriptionForSession({
            sessionId: stub.sessionId,
            instance,
            stub,
          });

          return [stub.sessionId, rx?.data ?? null] as const;
        }),
      );

      if (cancelled) {
        return;
      }

      const nextPrescriptions: Record<string, PrescriptionData | null> = {};
      for (const result of results) {
        if (result.status === "fulfilled") {
          const [sessionId, prescription] = result.value;
          nextPrescriptions[sessionId] = prescription;
          continue;
        }

        console.error("Failed to load week prescription", result.reason);
      }

      setWeekPrescriptions(nextPrescriptions);
    }

    void loadWeekPrescriptions();

    return () => {
      cancelled = true;
    };
  }, [instance, weekStubs]);

  return useMemo(
    () =>
      Object.fromEntries(
        weekStubs.map((stub) => [
          stub.sessionId,
          getTopSetSummary(weekPrescriptions[stub.sessionId], unit),
        ]),
      ),
    [unit, weekPrescriptions, weekStubs],
  );
}
