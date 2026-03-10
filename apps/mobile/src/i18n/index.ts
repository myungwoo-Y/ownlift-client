import { useSyncExternalStore } from "react";

type MessageParams = Record<string, number | string>;

const messages = {
  en: {
    "tab.plan": "Plan",
    "tab.history": "History",
    "tab.settings": "Settings",
    "lift.squat": "Squat",
    "lift.bench": "Bench Press",
    "lift.deadlift": "Deadlift",
    "lift.press": "Press",
    "status.today": "Today",
    "status.completed": "Completed",
    "status.planned": "Planned",
    "badge.amrap": "+ AMRAP",
    "unit.reps": "reps",
    "common.back": "Back",
    "common.cancel": "Cancel",
    "common.complete": "Complete",
    "week.title": "Week {week}",
    "week.deload": "Deload",
    "session.label": "Session {session}",
    "plan.loadingProgram": "Loading program...",
    "plan.section.thisWeek": "This Week",
    "plan.section.upcoming": "Upcoming",
    "plan.reorderHint": "Drag the handle to reorder sessions",
    "plan.reorderHandleA11y": "Drag to reorder this session",
    "plan.assistance": "531 + assistance",
    "plan.andMore": "{lift} and more",
    "plan.startTodayWorkout": "Start Today Workout",
    "history.title": "History",
    "history.volume": "Volume {volume} {unit}",
    "history.emptyTitle": "No completed workouts yet.",
    "history.emptySubtitle": "Complete your first workout to see it here.",
    "settings.title": "Settings",
    "settings.section.trainingMax": "Training Max (TM)",
    "settings.trainingMaxHint": "Used to calculate your 531 percentages",
    "settings.section.units": "Units",
    "settings.weightUnit": "Weight Unit",
    "settings.weightUnitHint": "Changing units converts existing values",
    "settings.section.increments": "Increments",
    "settings.upperBody": "Upper Body",
    "settings.upperBodyHint": "Press, Bench Press",
    "settings.lowerBody": "Lower Body",
    "settings.lowerBodyHint": "Squat, Deadlift",
    "settings.section.program": "Program",
    "settings.section.language": "Language",
    "settings.languageLabel": "App Language",
    "settings.deloadWeek": "Deload Week",
    "settings.deloadHint": "Include deload every 4th week",
    "settings.editTmTitle": "Edit {lift} TM",
    "settings.editTmMessage": "Current: {tm} {unit}",
    "onboarding.step1.title": "Welcome to OwnLift",
    "onboarding.step1.subtitle": "Let's set up your 5/3/1 program",
    "onboarding.section.weightUnit": "Weight Unit",
    "onboarding.roundingSummary": "Rounding: {increment} {unit} ({mode})",
    "onboarding.section.roundingMode": "Rounding Mode",
    "rounding.nearest": "Nearest",
    "rounding.down": "Down",
    "rounding.up": "Up",
    "onboarding.nextTrainingMaxes": "Next -> Training Maxes",
    "onboarding.step2.title": "Training Maxes",
    "onboarding.step2.subtitle": "Typically 85-90% of your true 1RM",
    "onboarding.section.trainingMax": "Training Max (TM)",
    "onboarding.section.tmIncreasePerCycle": "TM Increase Per Cycle",
    "onboarding.nextCustomize": "Next -> Customize",
    "onboarding.step3.title": "Customize",
    "onboarding.step3.subtitle": "Fine-tune your program settings",
    "onboarding.section.programOptions": "Program Options",
    "onboarding.warmupSets": "Warm-up Sets",
    "onboarding.warmupHint": "40/50/60% warm-up before work sets",
    "onboarding.section.liftOrder": "Lift Order",
    "onboarding.liftOrderHint": "Drag to reorder (coming soon). Default order used.",
    "onboarding.creatingProgram": "Creating Program...",
    "onboarding.startProgram": "Start Program",
    "workout.loading": "Loading workout...",
    "workout.errorStartTitle": "Could not start workout",
    "workout.errorStartMessage": "An error occurred while preparing this workout. Please try again.",
    "workout.errorCompleteTitle": "Could not complete workout",
    "workout.errorCompleteMessage": "An error occurred while saving. Please try again.",
    "workout.incompleteTitle": "Incomplete Sets",
    "workout.incompleteMessage": "Some sets are not marked as complete. Finish anyway?",
    "workout.exitTitle": "Exit workout?",
    "workout.exitMessage": "You can resume this workout later from the plan screen.",
    "workout.stay": "Stay",
    "workout.exit": "Exit",
    "workout.readyToStart": "You can start this workout from the button below.",
    "workout.onlyTodayCanStart": "Only today's workout can be started.",
    "workout.section.workSets": "Work Sets",
    "workout.startWorkout": "Start Workout",
    "workout.starting": "Starting...",
    "workout.completeWorkout": "Complete Workout",
    "workout.saving": "Saving...",
    "workout.setLabel": "Set {set}",
    "workout.subtitle": "Week {week} / {label}",
    "session.notFound": "Session not found.",
    "session.volume": "Volume: {volume} {unit}",
    "session.section.workSets": "Work Sets",
    "session.weekAndSession": "Week {week} · {session}",
    "language.en": "English",
    "language.ko": "Korean",
  },
  ko: {
    "tab.plan": "플랜",
    "tab.history": "기록",
    "tab.settings": "설정",
    "lift.squat": "스쿼트",
    "lift.bench": "벤치프레스",
    "lift.deadlift": "데드리프트",
    "lift.press": "오버헤드 프레스",
    "status.today": "오늘",
    "status.completed": "완료",
    "status.planned": "예정",
    "badge.amrap": "+ AMRAP",
    "unit.reps": "회",
    "common.back": "뒤로",
    "common.cancel": "취소",
    "common.complete": "완료",
    "week.title": "{week}주차",
    "week.deload": "디로드",
    "session.label": "{session} 세션",
    "plan.loadingProgram": "프로그램 불러오는 중...",
    "plan.section.thisWeek": "이번 주",
    "plan.section.upcoming": "예정",
    "plan.reorderHint": "핸들을 드래그해서 세션 순서를 바꿀 수 있습니다",
    "plan.reorderHandleA11y": "드래그해서 세션 순서 변경",
    "plan.assistance": "531 + 보조운동",
    "plan.andMore": "{lift} 외",
    "plan.startTodayWorkout": "오늘 운동 시작",
    "history.title": "기록",
    "history.volume": "볼륨 {volume} {unit}",
    "history.emptyTitle": "아직 완료한 운동이 없습니다.",
    "history.emptySubtitle": "첫 운동을 완료하면 여기에 표시됩니다.",
    "settings.title": "설정",
    "settings.section.trainingMax": "훈련 최대중량 (TM)",
    "settings.trainingMaxHint": "531 퍼센트 계산에 사용됩니다",
    "settings.section.units": "단위",
    "settings.weightUnit": "무게 단위",
    "settings.weightUnitHint": "단위를 바꾸면 기존 값이 변환됩니다",
    "settings.section.increments": "증가량",
    "settings.upperBody": "상체",
    "settings.upperBodyHint": "오버헤드 프레스, 벤치프레스",
    "settings.lowerBody": "하체",
    "settings.lowerBodyHint": "스쿼트, 데드리프트",
    "settings.section.program": "프로그램",
    "settings.section.language": "언어",
    "settings.languageLabel": "앱 언어",
    "settings.deloadWeek": "디로드 주",
    "settings.deloadHint": "4주마다 디로드를 포함합니다",
    "settings.editTmTitle": "{lift} TM 수정",
    "settings.editTmMessage": "현재: {tm} {unit}",
    "onboarding.step1.title": "OwnLift에 오신 것을 환영합니다",
    "onboarding.step1.subtitle": "5/3/1 프로그램을 설정해볼게요",
    "onboarding.section.weightUnit": "무게 단위",
    "onboarding.roundingSummary": "반올림: {increment} {unit} ({mode})",
    "onboarding.section.roundingMode": "반올림 방식",
    "rounding.nearest": "가까운 값",
    "rounding.down": "내림",
    "rounding.up": "올림",
    "onboarding.nextTrainingMaxes": "다음 -> TM 입력",
    "onboarding.step2.title": "훈련 최대중량",
    "onboarding.step2.subtitle": "보통 실제 1RM의 85-90%를 사용합니다",
    "onboarding.section.trainingMax": "훈련 최대중량 (TM)",
    "onboarding.section.tmIncreasePerCycle": "사이클별 TM 증가량",
    "onboarding.nextCustomize": "다음 -> 세부 설정",
    "onboarding.step3.title": "세부 설정",
    "onboarding.step3.subtitle": "프로그램 설정을 조정하세요",
    "onboarding.section.programOptions": "프로그램 옵션",
    "onboarding.warmupSets": "워밍업 세트",
    "onboarding.warmupHint": "본 세트 전 40/50/60% 워밍업",
    "onboarding.section.liftOrder": "운동 순서",
    "onboarding.liftOrderHint": "순서 변경은 추후 지원됩니다. 기본 순서를 사용합니다.",
    "onboarding.creatingProgram": "프로그램 생성 중...",
    "onboarding.startProgram": "프로그램 시작",
    "workout.loading": "운동 불러오는 중...",
    "workout.errorStartTitle": "운동을 시작할 수 없습니다",
    "workout.errorStartMessage": "운동 준비 중 오류가 발생했습니다. 다시 시도해 주세요.",
    "workout.errorCompleteTitle": "운동을 완료할 수 없습니다",
    "workout.errorCompleteMessage": "저장 중 오류가 발생했습니다. 다시 시도해 주세요.",
    "workout.incompleteTitle": "미완료 세트",
    "workout.incompleteMessage": "완료되지 않은 세트가 있습니다. 그래도 끝낼까요?",
    "workout.exitTitle": "운동을 종료할까요?",
    "workout.exitMessage": "플랜 화면에서 나중에 이어서 진행할 수 있습니다.",
    "workout.stay": "계속하기",
    "workout.exit": "종료",
    "workout.readyToStart": "아래 버튼에서 이 운동을 시작할 수 있습니다.",
    "workout.onlyTodayCanStart": "오늘 운동만 시작할 수 있습니다.",
    "workout.section.workSets": "본 세트",
    "workout.startWorkout": "운동 시작",
    "workout.starting": "시작 중...",
    "workout.completeWorkout": "운동 완료",
    "workout.saving": "저장 중...",
    "workout.setLabel": "{set}세트",
    "workout.subtitle": "{week}주차 / {label}",
    "session.notFound": "세션을 찾을 수 없습니다.",
    "session.volume": "볼륨: {volume} {unit}",
    "session.section.workSets": "본 세트",
    "session.weekAndSession": "{week}주차 · {session}",
    "language.en": "영어",
    "language.ko": "한국어",
  },
} as const;

export type AppLocale = keyof typeof messages;
type MessageKey = keyof (typeof messages)["en"];

const LIFT_KEY_TO_MESSAGE: Record<string, MessageKey> = {
  squat: "lift.squat",
  bench: "lift.bench",
  deadlift: "lift.deadlift",
  press: "lift.press",
};

const ROUNDING_MODE_TO_MESSAGE: Record<string, MessageKey> = {
  nearest: "rounding.nearest",
  down: "rounding.down",
  up: "rounding.up",
};

function resolveLocale(input: string | undefined): AppLocale {
  const normalized = input?.toLowerCase() ?? "";
  return normalized.startsWith("ko") ? "ko" : "en";
}

function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = params[token];
    return value == null ? `{${token}}` : String(value);
  });
}

function getIntlLocale(locale: AppLocale): string {
  return locale === "ko" ? "ko-KR" : "en-US";
}

let currentLocale: AppLocale = resolveLocale(Intl.DateTimeFormat().resolvedOptions().locale);
const localeListeners = new Set<() => void>();

const numberFormatterCache = new Map<string, Intl.NumberFormat>();
const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

export function getLocale(): AppLocale {
  return currentLocale;
}

export function setLocale(locale: AppLocale): void {
  if (currentLocale === locale) return;
  currentLocale = locale;
  localeListeners.forEach((listener) => listener());
}

function subscribeLocale(listener: () => void): () => void {
  localeListeners.add(listener);
  return () => {
    localeListeners.delete(listener);
  };
}

export function useLocale(): AppLocale {
  return useSyncExternalStore(subscribeLocale, getLocale, getLocale);
}

export function isAppLocale(value: string): value is AppLocale {
  return value === "en" || value === "ko";
}

export function t(key: MessageKey, params?: MessageParams): string {
  const template = messages[currentLocale][key] ?? messages.en[key];
  return interpolate(template, params);
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  const locale = getIntlLocale(currentLocale);
  const optionKey = options ? JSON.stringify(options) : "";
  const cacheKey = `${locale}:${optionKey}`;

  let formatter = numberFormatterCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormatterCache.set(cacheKey, formatter);
  }

  return formatter.format(value);
}

export function formatDate(value: string | number | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = value instanceof Date ? value : new Date(value);
  const locale = getIntlLocale(currentLocale);
  const optionKey = options ? JSON.stringify(options) : "";
  const cacheKey = `${locale}:${optionKey}`;

  let formatter = dateFormatterCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateFormatterCache.set(cacheKey, formatter);
  }

  return formatter.format(date);
}

export function getLiftLabel(liftKey: string): string {
  const key = LIFT_KEY_TO_MESSAGE[liftKey];
  return key ? t(key) : liftKey;
}

export function getRoundingModeLabel(roundingMode: string): string {
  const key = ROUNDING_MODE_TO_MESSAGE[roundingMode];
  return key ? t(key) : roundingMode;
}

export function getWeekLabel(weekIndex: number): string {
  if (weekIndex === 0) return "5s";
  if (weekIndex === 1) return "3s";
  if (weekIndex === 2) return "5/3/1";
  if (weekIndex === 3) return t("week.deload");
  return t("week.title", { week: weekIndex + 1 });
}

export function getSessionLabel(dayIndex: number): string {
  return t("session.label", { session: String.fromCharCode(65 + dayIndex) });
}
