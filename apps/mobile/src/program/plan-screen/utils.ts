import type { SessionStubRecord } from "@ownlift/db";

const squatThumbnailSource = require("../../../assets/images/squat.png");
const benchThumbnailSource = require("../../../assets/images/bench-press.png");
const deadliftThumbnailSource = require("../../../assets/images/deadlift.png");
const pressThumbnailSource = require("../../../assets/images/ohp.png");

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getLiftThumbnailSource(mainLiftKey: SessionStubRecord["mainLiftKey"]) {
  if (mainLiftKey === "squat") return squatThumbnailSource;
  if (mainLiftKey === "bench") return benchThumbnailSource;
  if (mainLiftKey === "deadlift") return deadliftThumbnailSource;
  if (mainLiftKey === "press") return pressThumbnailSource;
  return null;
}

export function getReorderableSegmentStart(
  stubs: readonly SessionStubRecord[],
): number {
  let lastLockedIndex = -1;

  for (let index = 0; index < stubs.length; index += 1) {
    const stub = stubs[index];
    if (stub.status === "completed") {
      lastLockedIndex = index;
    }
  }

  return lastLockedIndex + 1;
}
