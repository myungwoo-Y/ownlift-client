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
    "lift.press": "OHP",
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
    "plan.section.today": "Today",
    "plan.section.thisWeek": "This Week",
    "plan.section.activity": "Activity",
    "plan.section.upcoming": "Upcoming",
    "plan.editWeek": "Edit Order",
    "plan.reorderHint": "Drag incomplete sessions to reorder them",
    "plan.reorderScreen.helper": "Adjust this week's workout order with the drag handle.",
    "plan.reorderHandleA11y": "Drag to reorder this session",
    "plan.assistance": "531 + assistance",
    "plan.andMore": "{lift} and more",
    "plan.startTodayWorkout": "Start Today Workout",
    "plan.preview.workSets": "Work Sets",
    "plan.preview.workSetCount": "{count} work sets",
    "plan.preview.totalSets": "{count} total sets",
    "plan.preview.warmupSets": "{count} warm-up sets",
    "plan.preview.estimatedDuration": "Est. {minutes} min",
    "plan.preview.emptyTitle": "No workout unlocked today",
    "plan.preview.emptySubtitle": "The next session will unlock on your selected training day.",
    "plan.activity.week": "This Week",
    "plan.activity.cycle": "This Cycle",
    "plan.activity.last7Days": "Last 7 Days",
    "plan.activity.weeklyVolume": "Weekly Volume",
    "plan.activity.completedSessions": "Sessions done",
    "plan.activity.completedWorkouts": "Completed workouts",
    "plan.activity.totalVolume": "Total volume",
    "plan.activity.workoutCount": "{count} workouts",
    "plan.upcoming.viewRemainingWeeks": "View Remaining Weeks",
    "history.title": "History",
    "history.volume": "Volume {volume} {unit}",
    "history.emptyTitle": "No completed workouts yet.",
    "history.emptySubtitle": "Complete your first workout to see it here.",
    "history.filter.all": "All",
    "history.filter.month": "Month",
    "history.filter.period": "Period",
    "history.filter.exercise": "Lift",
    "history.filter.open": "Filter",
    "history.filter.title": "Filter Workouts",
    "history.filter.helper": "Choose a period and lift for the workout list.",
    "history.filter.reset": "Reset",
    "history.filter.apply": "Apply",
    "history.filter.squat": "Squat",
    "history.filter.bench": "Bench",
    "history.filter.deadlift": "Dead",
    "history.filter.press": "OHP",
    "history.logSectionTitle": "Workout Log",
    "history.filteredEmptyTitle": "No workouts match these filters.",
    "history.filteredEmptySubtitle": "Try a different month or lift.",
    "history.e1rmTitle": "{lift} e1RM Trend",
    "history.e1rmHelper": "최근 추정 1RM 변화",
    "history.e1rmEmptyTitle": "Not enough data yet",
    "history.e1rmEmptySubtitle": "Complete more workouts to unlock your e1RM trend",
    "history.latestE1rm": "Latest e1RM",
    "history.selectedE1rm": "Selected e1RM",
    "history.sessionDate": "Session Date",
    "history.allLiftTrendTitle": "Lift e1RM",
    "history.allLiftTrendHelper": "Choose a lift to keep the trend view focused",
    "history.allLiftTrendPlaceholder": "Select Squat, Bench, Deadlift, or OHP to view a clean lift-by-lift trend.",
    "history.completedWorkouts": "Completed Workouts",
    "history.latestWorkout": "Latest Workout",
    "history.weeklyWorkoutTitle": "Workouts in the Last 4 Weeks",
    "history.weeklyWorkoutHelper": "Shows how consistently you've trained recently",
    "history.weeklyWorkoutEmptyTitle": "Not enough weekly pattern yet",
    "history.weeklyWorkoutEmptySubtitle": "We'll show your weekly count as more workouts are logged",
    "history.last4Weeks": "Last 4 Weeks",
    "history.weekLabel.this": "This",
    "history.weekLabel.last": "Last",
    "history.weekLabel.weeksAgo": "{count}w ago",
    "settings.title": "Settings",
    "settings.section.trainingMax": "Training Max (TM)",
    "settings.trainingMaxHint": "Used to calculate your 531 percentages",
    "settings.section.units": "Units",
    "settings.weightUnit": "Weight Unit",
    "settings.weightUnitHint": "Changing units converts existing values",
    "settings.section.workout": "Workout",
    "settings.restTimerDefault": "Default Rest Timer",
    "settings.restTimerHint": "Auto-starts after each completed work set",
    "settings.section.increments": "Increments",
    "settings.upperBody": "Upper Body",
    "settings.upperBodyHint": "OHP, Bench Press",
    "settings.lowerBody": "Lower Body",
    "settings.lowerBodyHint": "Squat, Deadlift",
    "settings.section.program": "Program",
    "settings.section.language": "Language",
    "settings.languageLabel": "App Language",
    "settings.languageRestartFailedTitle": "Restart required",
    "settings.languageRestartFailedMessage": "The language was saved. Please close and reopen the app to apply it everywhere.",
    "settings.languageChangedTitle": "Language changed",
    "settings.languageChangedMessage": "The app language has been updated to {language}.",
    "settings.deloadWeek": "Deload Week",
    "settings.deloadHint": "Include deload every 4th week",
    "schedule.section.title": "Schedule Mode",
    "schedule.mode.flexible.title": "Flexible",
    "schedule.mode.flexible.description": "Advance the next incomplete session on any day you can train.",
    "schedule.mode.scheduled.title": "Scheduled",
    "schedule.mode.scheduled.description": "Only unlock the next session on your selected training days.",
    "schedule.days.label": "Training Days",
    "schedule.days.selectedCount": "{count}/{total} days selected",
    "schedule.days.requiredHint": "Select exactly {total} training days before saving.",
    "schedule.days.saveHint": "Changes apply after you tap Save Schedule.",
    "schedule.save": "Save Schedule",
    "schedule.saveBlockedTitle": "Schedule not ready",
    "schedule.saving": "Saving...",
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
    "onboarding.nextTrainingMaxes": "Set Training Maxes",
    "onboarding.step2.title": "Training Maxes",
    "onboarding.step2.subtitle": "Typically 85-90% of your true 1RM",
    "onboarding.section.trainingMax": "Training Max (TM)",
    "onboarding.section.tmIncreasePerCycle": "TM Increase Per Cycle",
    "onboarding.nextCustomize": "Customize Program",
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
    "workout.onlyScheduledDayCanStart": "This workout can only be started on a scheduled training day.",
    "workout.section.warmupSets": "Warm-up Sets",
    "workout.section.workSets": "Work Sets",
    "workout.startWorkout": "Start Workout",
    "workout.starting": "Starting...",
    "workout.completeWorkout": "Complete Workout",
    "workout.saving": "Saving...",
    "workout.progress.current": "Current Workout",
    "workout.setLabel": "Set {set}",
    "workout.currentSet": "Current Set",
    "workout.restTimer": "Rest {time}",
    "workout.restPause": "Pause",
    "workout.restResume": "Resume",
    "workout.restPausedStatus": "Paused",
    "workout.restAddTime": "+30s",
    "workout.restSkip": "Skip",
    "workout.restStop": "Stop Timer",
    "workout.amrapRepsRequiredTitle": "Enter AMRAP reps",
    "workout.amrapRepsRequiredMessage": "AMRAP sets require actual reps before completion.",
    "workout.subtitle": "Week {week} / {label}",
    "workout.completeScreen.title": "Workout Complete",
    "workout.completeScreen.subtitle": "Your {lift} session is saved. Nice work.",
    "workout.completeScreen.subtitleFallback": "Your session is saved. Nice work.",
    "workout.completeScreen.completedSets": "Completed Sets",
    "workout.completeScreen.volume": "Volume",
    "workout.completeScreen.duration": "Duration",
    "workout.completeScreen.durationValue": "{minutes} min",
    "workout.completeScreen.backToPlan": "Back to Plan",
    "workout.completeScreen.viewLog": "View Workout Log",
    "workout.completeScreen.nextUp": "Next up",
    "session.notFound": "Session not found.",
    "session.volume": "Volume: {volume} {unit}",
    "session.section.workSets": "Work Sets",
    "session.weekAndSession": "Week {week} · {session}",
    "language.en": "English",
    "language.ko": "Korean",
    "weekday.mon.short": "Mon",
    "weekday.tue.short": "Tue",
    "weekday.wed.short": "Wed",
    "weekday.thu.short": "Thu",
    "weekday.fri.short": "Fri",
    "weekday.sat.short": "Sat",
    "weekday.sun.short": "Sun",
  },
  ko: {
    "tab.plan": "플랜",
    "tab.history": "기록",
    "tab.settings": "설정",
    "lift.squat": "스쿼트",
    "lift.bench": "벤치 프레스",
    "lift.deadlift": "데드리프트",
    "lift.press": "OHP",
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
    "plan.section.today": "오늘 운동",
    "plan.section.thisWeek": "이번 주",
    "plan.section.activity": "활동",
    "plan.section.upcoming": "예정",
    "plan.editWeek": "순서 수정",
    "plan.reorderHint": "완료되지 않은 세션만 드래그해서 순서를 바꿀 수 있습니다",
    "plan.reorderScreen.helper": "드래그 핸들을 움직여 이번 주 운동 순서를 조정하세요.",
    "plan.reorderHandleA11y": "드래그해서 세션 순서 변경",
    "plan.assistance": "531 + 보조운동",
    "plan.andMore": "{lift} 외",
    "plan.startTodayWorkout": "오늘 운동 시작",
    "plan.preview.workSets": "본 세트",
    "plan.preview.workSetCount": "본 세트 {count}세트",
    "plan.preview.totalSets": "총 {count}세트",
    "plan.preview.warmupSets": "웜업 {count}세트",
    "plan.preview.estimatedDuration": "예상 {minutes}분",
    "plan.preview.emptyTitle": "오늘 열리는 운동이 없습니다",
    "plan.preview.emptySubtitle": "다음 세션은 선택한 운동 요일에 열립니다.",
    "plan.activity.week": "이번 주",
    "plan.activity.cycle": "이번 사이클",
    "plan.activity.last7Days": "최근 7일",
    "plan.activity.weeklyVolume": "이번 주 볼륨",
    "plan.activity.completedSessions": "세션 완료",
    "plan.activity.completedWorkouts": "완료 운동",
    "plan.activity.totalVolume": "총 볼륨",
    "plan.activity.workoutCount": "{count}회",
    "plan.upcoming.viewRemainingWeeks": "남은주 보기",
    "history.title": "기록",
    "history.volume": "볼륨 {volume} {unit}",
    "history.emptyTitle": "아직 완료한 운동이 없습니다.",
    "history.emptySubtitle": "첫 운동을 완료하면 여기에 표시됩니다.",
    "history.filter.all": "전체",
    "history.filter.month": "월별",
    "history.filter.period": "기간",
    "history.filter.exercise": "운동별",
    "history.filter.open": "필터",
    "history.filter.title": "기록 필터",
    "history.filter.helper": "기간과 운동을 선택해 기록 리스트를 좁혀보세요.",
    "history.filter.reset": "초기화",
    "history.filter.apply": "적용",
    "history.filter.squat": "스쿼트",
    "history.filter.bench": "벤치",
    "history.filter.deadlift": "데드",
    "history.filter.press": "OHP",
    "history.logSectionTitle": "운동 기록",
    "history.filteredEmptyTitle": "선택한 필터에 맞는 기록이 없습니다.",
    "history.filteredEmptySubtitle": "다른 월이나 운동을 선택해 보세요.",
    "history.e1rmTitle": "{lift} e1RM 추이",
    "history.e1rmHelper": "최근 추정 1RM 변화",
    "history.e1rmEmptyTitle": "데이터가 아직 충분하지 않아요",
    "history.e1rmEmptySubtitle": "운동을 더 완료하면 e1RM 추이를 볼 수 있어요",
    "history.latestE1rm": "최신 e1RM",
    "history.selectedE1rm": "선택 e1RM",
    "history.sessionDate": "운동 날짜",
    "history.allLiftTrendTitle": "리프트별 e1RM",
    "history.allLiftTrendHelper": "리프트를 선택하면 추이를 더 선명하게 볼 수 있어요",
    "history.allLiftTrendPlaceholder": "스쿼트, 벤치, 데드, OHP 중 하나를 선택하면 강도 변화를 볼 수 있어요.",
    "history.completedWorkouts": "완료 운동",
    "history.latestWorkout": "최근 운동",
    "history.weeklyWorkoutTitle": "최근 4주 운동 횟수",
    "history.weeklyWorkoutHelper": "최근 4주 동안 얼마나 꾸준히 운동했는지 보여줍니다",
    "history.weeklyWorkoutEmptyTitle": "아직 주간 운동 패턴이 충분하지 않아요",
    "history.weeklyWorkoutEmptySubtitle": "운동 기록이 쌓이면 주간 횟수를 보여줄게요",
    "history.last4Weeks": "최근 4주",
    "history.weekLabel.this": "이번주",
    "history.weekLabel.last": "지난주",
    "history.weekLabel.weeksAgo": "{count}주전",
    "settings.title": "설정",
    "settings.section.trainingMax": "훈련 최대중량 (TM)",
    "settings.trainingMaxHint": "531 퍼센트 계산에 사용됩니다",
    "settings.section.units": "단위",
    "settings.weightUnit": "무게 단위",
    "settings.weightUnitHint": "단위를 바꾸면 기존 값이 변환됩니다",
    "settings.section.workout": "운동",
    "settings.restTimerDefault": "기본 휴식 타이머",
    "settings.restTimerHint": "본 세트 완료 후 자동으로 시작됩니다",
    "settings.section.increments": "증가량",
    "settings.upperBody": "상체",
    "settings.upperBodyHint": "OHP, 벤치 프레스",
    "settings.lowerBody": "하체",
    "settings.lowerBodyHint": "스쿼트, 데드리프트",
    "settings.section.program": "프로그램",
    "settings.section.language": "언어",
    "settings.languageLabel": "앱 언어",
    "settings.languageRestartFailedTitle": "재시작이 필요합니다",
    "settings.languageRestartFailedMessage": "언어는 저장되었습니다. 전체 반영을 위해 앱을 완전히 종료한 뒤 다시 열어 주세요.",
    "settings.languageChangedTitle": "언어 변경됨",
    "settings.languageChangedMessage": "앱 언어가 {language}로 변경되었습니다.",
    "settings.deloadWeek": "디로드 주",
    "settings.deloadHint": "4주마다 디로드를 포함합니다",
    "schedule.section.title": "스케줄 모드",
    "schedule.mode.flexible.title": "유연하게",
    "schedule.mode.flexible.description": "운동 가능한 날에 다음 미완료 세션을 진행합니다.",
    "schedule.mode.scheduled.title": "요일 고정",
    "schedule.mode.scheduled.description": "선택한 운동 요일에만 다음 세션이 활성화됩니다.",
    "schedule.days.label": "운동 요일",
    "schedule.days.selectedCount": "{count}/{total}일 선택됨",
    "schedule.days.requiredHint": "저장하려면 운동 요일을 정확히 {total}개 선택해야 합니다.",
    "schedule.days.saveHint": "저장 버튼을 눌러야 변경 사항이 반영됩니다.",
    "schedule.save": "스케줄 저장",
    "schedule.saveBlockedTitle": "스케줄을 저장할 수 없습니다",
    "schedule.saving": "저장 중...",
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
    "onboarding.nextTrainingMaxes": "훈련 최대중량 입력",
    "onboarding.step2.title": "훈련 최대중량",
    "onboarding.step2.subtitle": "보통 실제 1RM의 85-90%를 사용합니다",
    "onboarding.section.trainingMax": "훈련 최대중량 (TM)",
    "onboarding.section.tmIncreasePerCycle": "사이클별 TM 증가량",
    "onboarding.nextCustomize": "프로그램 설정 조정",
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
    "workout.onlyScheduledDayCanStart": "이 운동은 선택한 운동 요일에만 시작할 수 있습니다.",
    "workout.section.warmupSets": "웜업 세트",
    "workout.section.workSets": "본 세트",
    "workout.startWorkout": "운동 시작",
    "workout.starting": "시작 중...",
    "workout.completeWorkout": "운동 완료",
    "workout.saving": "저장 중...",
    "workout.progress.current": "현재 운동",
    "workout.setLabel": "{set}세트",
    "workout.currentSet": "현재 세트",
    "workout.restTimer": "타이머 {time}",
    "workout.restPause": "일시정지",
    "workout.restResume": "재개",
    "workout.restPausedStatus": "일시정지",
    "workout.restAddTime": "+30초",
    "workout.restSkip": "스킵",
    "workout.restStop": "타이머 종료",
    "workout.amrapRepsRequiredTitle": "AMRAP 반복 횟수를 입력하세요",
    "workout.amrapRepsRequiredMessage": "AMRAP 세트는 완료 전에 실제 반복 횟수를 입력해야 합니다.",
    "workout.subtitle": "{week}주차 / {label}",
    "workout.completeScreen.title": "운동 완료",
    "workout.completeScreen.subtitle": "{lift} 세션이 저장됐어요. 수고했습니다.",
    "workout.completeScreen.subtitleFallback": "세션이 저장됐어요. 수고했습니다.",
    "workout.completeScreen.completedSets": "완료 세트",
    "workout.completeScreen.volume": "볼륨",
    "workout.completeScreen.duration": "시간",
    "workout.completeScreen.durationValue": "{minutes}분",
    "workout.completeScreen.backToPlan": "플랜으로 돌아가기",
    "workout.completeScreen.viewLog": "운동 기록 보기",
    "workout.completeScreen.nextUp": "다음 운동",
    "session.notFound": "세션을 찾을 수 없습니다.",
    "session.volume": "볼륨: {volume} {unit}",
    "session.section.workSets": "본 세트",
    "session.weekAndSession": "{week}주차 · {session}",
    "language.en": "영어",
    "language.ko": "한국어",
    "weekday.mon.short": "월",
    "weekday.tue.short": "화",
    "weekday.wed.short": "수",
    "weekday.thu.short": "목",
    "weekday.fri.short": "금",
    "weekday.sat.short": "토",
    "weekday.sun.short": "일",
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

const WEEKDAY_KEY_TO_MESSAGE: Record<string, MessageKey> = {
  mon: "weekday.mon.short",
  tue: "weekday.tue.short",
  wed: "weekday.wed.short",
  thu: "weekday.thu.short",
  fri: "weekday.fri.short",
  sat: "weekday.sat.short",
  sun: "weekday.sun.short",
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

export function getWeekdayShortLabel(weekdayKey: string): string {
  const key = WEEKDAY_KEY_TO_MESSAGE[weekdayKey];
  return key ? t(key) : weekdayKey;
}
