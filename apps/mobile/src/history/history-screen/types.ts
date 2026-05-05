import type { SessionStubRecord } from "@ownlift/db";
import type { MainLift } from "@ownlift/schemas";

export interface HistoryItem extends SessionStubRecord {
  completedAt?: string;
  totalVolume?: number;
  estimatedOneRepMax?: number | null;
  lastWorkSet?: HistoryLastWorkSetMetric | null;
  isMock?: boolean;
}

export interface HistoryLastWorkSetMetric {
  weight: number;
  reps: number;
}

export interface HistoryMonthSection {
  key: string;
  title: string;
  data: HistoryItem[];
}

export interface TrendPoint {
  sessionId: string;
  completedAt: string;
  label: string;
  value: number;
}

export interface LiftSummary {
  lift: MainLift;
  latestPoint: TrendPoint | null;
  previousPoint: TrendPoint | null;
  change: number | null;
}

export interface ActiveFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}
