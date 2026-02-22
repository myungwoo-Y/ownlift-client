# Wendler 5/3/1 Program Runner — Product Spec (Mobile MVP-first, Web/Server-ready)

- Last updated: 2026-02-22
- Platform: **RN / Expo (TypeScript)**
- MVP scope: **Mobile App only**
- Future scope: **Server Sync + Web Console (템플릿/프로그램 관리, 리포트/탐색)**

---

## 1) 제품 포지셔닝

### 1.1 문제 정의

5/3/1을 제대로 굴리려면 TM 기반 퍼센트 계산/라운딩/주차 진행/사이클 TM 증가/AMRAP 기록을 매번 스프레드시트로 관리해야 한다. 이를 **“오늘 할 것 자동 제시 → 기록 → 자동 진행”**으로 단순화한다.

### 1.2 타겟 유저

- 5/3/1(또는 % 기반 바벨 훈련) 수행자
- 스프레드시트/메모 대신 앱으로 “진행 + 기록”을 일관되게 남기고 싶은 사람
- (향후) 템플릿/보조운동을 커스터마이즈하고 싶지만 모바일에서 편집 UX가 불편한 사람

### 1.3 차별점(Why us)

- **5/3/1 전용 “프로그램 런처(Program Runner)”**: 처방(오늘의 세트/중량)을 자동으로 만들고 진행을 자동으로 굴린다.
- **처방 스냅샷(Prescription Snapshot) 불변성**: TM/라운딩이 바뀌어도 과거 세션의 처방은 바뀌지 않는다.
- **오프라인-퍼스트** + **서버 동기화 준비(dirty/revision/deleted_at)**: MVP는 로그인 없이도 완성 가능, 이후 서버 붙이기 쉬움.

---

## 2) 시장/경쟁 앱 분석에서 뽑은 “기본 기대 기능(Expectation Set)”

### 2.1 범용 운동 기록 앱(Strong / FitNotes / Hevy)의 공통 기대치

- **빠른 기록 UX**(세트/중량/횟수, 지난 기록 참고)
- **루틴/템플릿**(여러 루틴 저장, 커스텀 운동 추가)
- **휴식 타이머(Rest timer)**
- **PR/통계/그래프**(1RM/e1RM, 볼륨, 추세)
- **데이터 내보내기/백업/동기화**(CSV export, cloud sync 등)

예시:

- Strong는 rest timer, 그래프(볼륨/1RM), warm-up/plate calculator, cloud sync, CSV export 등 “기록 앱의 표준 기능군”을 광범위하게 제공. ([App Store](https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577?utm_source=chatgpt.com))
- FitNotes 2도 그래프, rest timer(EMOM/AMRAP 등), warmup sets, RPE/RIR, iCloud 백업, CSV export 등을 강조. ([App Store](https://apps.apple.com/kr/app/fitnotes-2-gym-workout-log/id1538896016?utm_source=chatgpt.com))
- Hevy는 “workout logging + progress tracking + community”를 3축으로 기능 페이지를 운영. ([hevyapp.com](https://www.hevyapp.com/features/?utm_source=chatgpt.com))

### 2.2 “프로그램 기반(Program-first)” 앱의 기대치(StrongLifts / Boostcamp)

- 사용자가 루틴을 만드는 게 아니라 **검증된 프로그램을 선택 → 앱이 세트/중량을 안내**
- “스프레드시트 대체” 메시지가 강함
- 오프라인 기록 + 프로그램 다수 탑재

예시:

- StrongLifts는 앱이 workouts/weights/sets/reps를 계획해주는 “가이드형” 포지셔닝. ([Stronglifts](https://stronglifts.com/app/?utm_source=chatgpt.com))
- Boostcamp는 nSuns/GZCLP/5/3/1 등 “인기 프로그램 내장”을 전면에 둠. ([구글 플레이](https://play.google.com/store/apps/details?hl=en&id=com.bpmhealth.boostcamp&utm_source=chatgpt.com))

### 2.3 5/3/1 전용/근접 앱(KeyLifts / FiveThreeOne / 5/3/1 Logger)의 기대치

- **사이클/주차 자동 생성**
- **TM/퍼센트 자동 계산**
- **PR 추적**
- **Rest timer / Plate calculation** 같은 “바벨 친화” 기능이 자주 포함

예시:

- Five/Three/One 앱은 cycle 계획/스케줄, 차트, rest timer, 자동 플레이트 계산, 성과 기반 next cycle 계산 등을 명시. ([App Store](https://apps.apple.com/eg/app/five-three-one-531-workouts/id1560266240?utm_source=chatgpt.com))
- KeyLifts는 “one button으로 cycle 계획”, PR 알림, warm-up sets, rest timer, 150+ 템플릿 등을 명시. ([App Store](https://apps.apple.com/us/app/keylifts-531-workout-log/id1437949461?utm_source=chatgpt.com))
- 5/3/1 Workout Logger(531)는 자동으로 중량/레프를 배치하고, “No registration / No ads” 같은 프라이버시/단순성도 가치로 제시. ([App Store](https://apps.apple.com/kr/app/5-3-1-workout-logger-531/id1114435690?l=en-GB&utm_source=chatgpt.com))

**결론(벤치마크 요약)**

- 우리가 “기록 앱”으로 경쟁하면 Strong/Hevy/FitNotes의 기대치(통계/루틴/커뮤니티/완성도)를 맞춰야 해서 스코프가 폭발한다.
- 대신 “5/3/1 프로그램 런처” 포지셔닝이면 니치지만 명확한 가치가 있고, 그 니치 안에서 경쟁 앱들이 이미 제공하는 **핵심 기대 기능(자동 진행/PR/타이머/플레이트/히스토리)** 중 일부는 초기에 갖추는 편이 유리하다. ([App Store](https://apps.apple.com/eg/app/five-three-one-531-workouts/id1560266240?utm_source=chatgpt.com))

---

## 3) 제품 범위 정의

### 3.1 MVP (Mobile v1) — 반드시 포함

**목표:** “TM 입력 → 오늘 운동 자동 처방 → 기록 → 자동 진행”

1. 온보딩
- Unit: kg/lb
- Rounding: increment(예: 2.5kg/5lb), mode(nearest/down/up)
- Training Max(TM): squat/bench/deadlift/press
- TM increase: upper/lower
- 주간 리프트 순서(기본값 제공, 커스텀 가능)
- warm-up sets 포함 여부(on/off)
1. 5/3/1 Classic 프로그램
- 4-week cycle (5s / 3s / 5-3-1 / deload)
- AMRAP(+) 기록: 마지막 work set의 reps 기록
- 사이클 완료 시 TM 자동 증가(upper/lower)
1. Today Workout (오늘 세션)
- 다음 미완료 세션 자동 선택
- 처방(prescription) 자동 생성 및 저장(스냅샷)
- 세트 체크/입력(실중량/실횟수)
1. Assistance(보조운동) “자유 기록”
- 운동명(커스텀) + 세트/중량/횟수
1. History + Mini Report (모바일 필수 “가벼운 리포트”)
- 최근 세션 리스트(날짜/메인리프트/주차/상태)
- 세션 상세(처방 vs 기록 조회)
- 미니 리포트(텍스트 중심):
    - 이번 주/사이클 진행률 (예: 6/16)
    - 리프트별 최근 PR 하이라이트 1~2개(예: top set reps 최고, e1RM 최고 중 택1)
1. Settings
- unit/rounding/tmIncrease/TM 수정
- 주의 문구: “이미 생성된 처방은 스냅샷이므로 소급 변경되지 않음”
1. 로컬 저장소
- SQLite(offline-first)
- Sync-ready 메타 컬럼(dirty/revision/deleted_at/updated_at) 포함
- Migration runner로 스키마 버전 관리

---

### 3.2 MVP+ (Mobile v1.1~) — 시장 기대치 대응(우선순위 순)

> 5/3/1 전용 앱들이 자주 제공하는 기능을 “가성비” 위주로 추가
> 

A) Rest timer (세트 휴식 타이머)

- 경쟁 앱/범용 트래커에서 매우 흔한 기능. ([App Store](https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577?utm_source=chatgpt.com))

B) Plate calculator (플레이트 계산)

- 바벨 앱에서 차별화 강함(Strong, Five/Three/One 등에서도 강조). ([App Store](https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577?utm_source=chatgpt.com))

C) PR 알림/배지

- KeyLifts가 PR 알림을 명시. ([App Store](https://apps.apple.com/us/app/keylifts-531-workout-log/id1437949461?utm_source=chatgpt.com))

D) Export/Import (JSON 또는 CSV)

- Strong/ FitNotes 2가 CSV export/백업을 명시(데이터 신뢰). ([App Store](https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577?utm_source=chatgpt.com))

---

## 4) 향후 확장 (Server + Web) — “웹을 붙이는 이유”를 살리는 방향

### 4.1 Web Console의 역할(Option B: 템플릿/프로그램 관리 콘솔)

- 모바일: 수행/기록/간략 리포트
- 웹: **편집/관리(템플릿, 프로그램 설정), 깊은 탐색/리포트**

웹에서 제공할 1순위 기능:

1. Assistance Template 관리(프리셋 CRUD)
- 예: BBB/FSL/SSL용 보조운동 프리셋 저장/편집
- “Push/Pull/Leg/Core” 같은 사용자 프리셋
1. Program Definition(데이터 기반 프로그램) 관리(추후)
- 프로그램 정의(JSON) 버전 관리/배포(유료 팩도 여기로 연결 가능)
1. Deep Report/Analytics(추후)
- 사이클 비교, 기간 필터, 볼륨/추세, PR 히스토리 탐색

### 4.2 Server가 맡을 최소 책임(추후)

- Auth(옵션): 계정/기기 연결
- Sync: 레코드 단위 업/다운로드(파일 통째 업로드 금지)
- Conflict policy: 초기 LWW + 세션 수정 제한 정책(완료 후 수정 규칙)

---

## 5) 데이터/도메인 설계

### 5.1 “처방 vs 기록” 엔티티

- **SessionStub**: 일정/세션 뼈대(week/day/mainLift/status)
- **Prescription**: 해당 세션의 처방 스냅샷(세트/중량/레프)
- **SetLog**: 세트 단위 실제 기록(메인/보조)
- **WorkoutResult**: 세션 완료 메타(완료시각/요약)

### 5.2 프로그램 엔진 인터페이스(요약)

- `initialize(params, startDate) -> state + stubs`
- `prescribe(params, state, stub) -> prescription(snapshot)`
- `complete(params, state, result) -> newState (+ TM increase)`

**중요 규칙**

- Prescription은 생성 이후 불변(또는 최소 변경)로 운영
- TM/라운딩 변경은 “미래 처방”에만 적용

---

## 6) SQLite (Sync-ready) — 정책 및 스키마 요약

### 6.1 공통 메타 컬럼(서버 확장 대비 핵심)

동기화 대상 테이블은 아래를 기본 포함:

- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`
- `deleted_at TEXT NULL` (soft delete)
- `dirty INTEGER NOT NULL DEFAULT 1` (로컬 변경됨)
- `revision INTEGER NOT NULL DEFAULT 0` (update마다 +1)
- `server_id TEXT NULL` (서버 PK 매핑용, 선택)

### 6.2 데이터 변경 규칙(클라 표준)

- INSERT: dirty=1, revision=0, created_at/updated_at=now
- UPDATE: dirty=1, revision+1, updated_at=now
- DELETE 금지 → soft delete: deleted_at=now, dirty=1, revision+1

### 6.3 authoritative SQL 파일

- `src/data/migrations/001_init.sql` 에 v1 DDL을 둔다.
- 앱 시작 시 migration runner가 schema_version 기준으로 순차 적용한다.

> **Appendix A**에 v1 DDL 전체를 포함(아래).
> 

---

## 7) 폴더 구조(모바일 MVP + 향후 웹 확장성 고려)

### 7.1 권장: 모노레포(초기부터) — Web/Server 추가 시 확장 비용 최소화

(도메인/타입/검증을 공유하기 위한 구조)

```
/
  apps/
    mobile/                # Expo RN (MVP 구현)
      src/
        features/          # screens, flows
        app/               # navigation, app bootstrap
    web/                   # (future) Next.js console (placeholder)
    api/                   # (future) sync/auth service (placeholder)

  packages/
    core/                  # 프로그램 엔진(5/3/1), 타입, 규칙(플랫폼 독립)
      src/
        program/
        math/
        types/
        validation/
      tests/
    db/                    # SQLite layer (mobile), repo interfaces, migrations
      src/
        migrations/
        repos/
        sync/
    ui/                    # (optional) shared UI primitives (later)

  docs/
    spec.md                # 이 문서
```

**의존성 규칙**

- `packages/core`는 RN/DOM API를 참조하지 않는다(순수 TS 도메인).
- `apps/mobile`은 `packages/core`, `packages/db`를 사용한다.
- (추후) `apps/web`도 `packages/core`를 사용하고, 저장소는 IndexedDB 또는 서버 API로 구현한다.
- (추후) `apps/api`는 `packages/core`의 타입/검증을 공유할 수 있다(단, 서버 환경 의존성 분리).

---

## 8) 화면/기능 상세 요구사항 (Mobile MVP)

### 8.1 Onboarding

- 입력:
    - unit(kg/lb)
    - rounding(increment/mode)
    - TM 4종
    - TM increase(upper/lower)
    - lift order(기본값 제공)
    - warm-up on/off
- 완료 시:
    - program_instance 생성(status=active)
    - session_stubs 생성(16개: 4주×4일) 또는 “첫 주만 생성 + 필요시 확장”

### 8.2 Today Workout

- 다음 규칙으로 세션 선택:
    - active instance의 session_stubs 중 status != completed && deleted_at IS NULL
    - scheduled_date가 있으면 오늘 우선, 없으면 가장 이른 순서(cycle/week/day)
- prescription이 없으면 생성 후 저장
- 세트 UI:
    - targetWeight/targetReps 표시
    - actualWeight/actualReps 입력
    - AMRAP set은 reps 입력 필수

### 8.3 Logging & Complete

- 세트 로그 저장(set_logs upsert)
- 완료 버튼:
    - workout_results 생성
    - session stub status=completed
    - program_instance state_json 업데이트(week/day 이동, cycle 완료면 TM 증가)

### 8.4 Assistance(Freeform)

- 운동명 검색/최근 사용(최소)
- 세트 추가/삭제

### 8.5 History + Mini Report

- History list:
    - 최근 30개 세션(완료/스킵 포함) 표시
- Session detail:
    - 처방(계획)과 기록(실제)을 같이 보여주기
- Mini report:
    - “이번 주 완료 X/4”, “이번 사이클 완료 Y/16”
    - PR 하이라이트(예: main lift별 top set reps 최고 or e1RM 최고)

---

## 9) 품질 바(포트폴리오/해외 FE 지원 고려)

- TypeScript strict
- `packages/core`는 unit test 필수(퍼센트/라운딩/주차 로직/사이클 증가)
- DB layer는 migration 테스트(최소: 새 설치에서 001 적용 확인)
- “처방 스냅샷 불변성” 회귀 테스트(핵심 신뢰성)

---

## 10) 개발 로드맵(추천)

### Phase 1 — Mobile MVP

- migrations + migration runner
- repo layer
- 5/3/1 engine
- Onboarding / Today / Logging / History / Settings

### Phase 1.1 — 기대치 보강

- rest timer
- plate calculator
- PR badge
- export/import

### Phase 2 — Server + Web Console(B)

- auth + sync endpoints
- web console: assistance template CRUD
- 모바일: 템플릿 선택/적용만(편집은 웹 중심)

---

# Appendix A) SQLite v1 DDL (Sync-ready, 001_init.sql)

> 아래 SQL을 그대로 `src/data/migrations/001_init.sql`로 두고, 앱 시작 시 1회 적용한다.
> 

```sql
PRAGMA foreign_keys = ON;

-- =============
-- 0) settings
-- =============
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0
);

-- =============
-- 1) exercises
-- =============
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  server_id TEXT NULL,

  name TEXT NOT NULL,
  is_user_defined INTEGER NOT NULL DEFAULT 1,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_name_active
  ON exercises(name)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_exercises_dirty
  ON exercises(dirty)
  WHERE dirty = 1;

-- =============
-- 2) program_definitions
-- =============
CREATE TABLE IF NOT EXISTS program_definitions (
  program_id TEXT NOT NULL,
  version INTEGER NOT NULL,

  server_id TEXT NULL,

  definition_json TEXT NOT NULL,
  is_premium INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY (program_id, version)
);

CREATE INDEX IF NOT EXISTS idx_program_defs_dirty
  ON program_definitions(dirty)
  WHERE dirty = 1;

-- =============
-- 3) program_instances
-- =============
CREATE TABLE IF NOT EXISTS program_instances (
  instance_id TEXT PRIMARY KEY,
  server_id TEXT NULL,

  program_id TEXT NOT NULL,
  program_version INTEGER NOT NULL,

  name TEXT NULL,
  status TEXT NOT NULL,              -- active | paused | archived
  start_date TEXT NOT NULL,

  params_json TEXT NOT NULL,
  state_json TEXT NOT NULL,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_program_instances_status_active
  ON program_instances(status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_program_instances_dirty
  ON program_instances(dirty)
  WHERE dirty = 1;

-- =============
-- 4) session_stubs
-- =============
CREATE TABLE IF NOT EXISTS session_stubs (
  session_id TEXT PRIMARY KEY,
  server_id TEXT NULL,

  instance_id TEXT NOT NULL,
  scheduled_date TEXT NULL,
  cycle_index INTEGER NOT NULL,
  week_index INTEGER NOT NULL,
  day_index INTEGER NOT NULL,

  main_lift_key TEXT NOT NULL,
  status TEXT NOT NULL,              -- planned | started | completed | skipped

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY(instance_id) REFERENCES program_instances(instance_id)
);

CREATE INDEX IF NOT EXISTS idx_session_stubs_instance_order
  ON session_stubs(instance_id, cycle_index, week_index, day_index);

CREATE INDEX IF NOT EXISTS idx_session_stubs_date
  ON session_stubs(scheduled_date)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_session_stubs_dirty
  ON session_stubs(dirty)
  WHERE dirty = 1;

-- =============
-- 5) prescriptions
-- =============
CREATE TABLE IF NOT EXISTS prescriptions (
  session_id TEXT PRIMARY KEY,
  server_id TEXT NULL,

  instance_id TEXT NOT NULL,

  prescription_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY(session_id) REFERENCES session_stubs(session_id),
  FOREIGN KEY(instance_id) REFERENCES program_instances(instance_id)
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_instance
  ON prescriptions(instance_id);

CREATE INDEX IF NOT EXISTS idx_prescriptions_dirty
  ON prescriptions(dirty)
  WHERE dirty = 1;

-- =============
-- 6) workout_results
-- =============
CREATE TABLE IF NOT EXISTS workout_results (
  session_id TEXT PRIMARY KEY,
  server_id TEXT NULL,

  instance_id TEXT NOT NULL,

  completed_at TEXT NOT NULL,
  summary_json TEXT NULL,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY(session_id) REFERENCES session_stubs(session_id),
  FOREIGN KEY(instance_id) REFERENCES program_instances(instance_id)
);

CREATE INDEX IF NOT EXISTS idx_results_instance
  ON workout_results(instance_id);

CREATE INDEX IF NOT EXISTS idx_results_dirty
  ON workout_results(dirty)
  WHERE dirty = 1;

-- =============
-- 7) set_logs
-- =============
CREATE TABLE IF NOT EXISTS set_logs (
  id TEXT PRIMARY KEY,
  server_id TEXT NULL,

  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,

  set_type TEXT NOT NULL,
  set_order INTEGER NOT NULL,

  planned_json TEXT NULL,
  actual_weight REAL NULL,
  actual_reps INTEGER NULL,
  rpe REAL NULL,

  is_completed INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY(session_id) REFERENCES session_stubs(session_id),
  FOREIGN KEY(exercise_id) REFERENCES exercises(id)
);

CREATE INDEX IF NOT EXISTS idx_set_logs_session_order
  ON set_logs(session_id, set_order)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_set_logs_dirty
  ON set_logs(dirty)
  WHERE dirty = 1;

-- =============
-- 8) pr_events (optional cache)
-- =============
CREATE TABLE IF NOT EXISTS pr_events (
  id TEXT PRIMARY KEY,
  server_id TEXT NULL,

  exercise_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  value REAL NOT NULL,

  session_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY(exercise_id) REFERENCES exercises(id),
  FOREIGN KEY(session_id) REFERENCES session_stubs(session_id)
);

CREATE INDEX IF NOT EXISTS idx_pr_events_exercise_time
  ON pr_events(exercise_id, occurred_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pr_events_dirty
  ON pr_events(dirty)
  WHERE dirty = 1;
```

---

## 11) 기술 스택 (MVP Mobile 중심 + Server 분리 레포 + OpenAPI 연동)

### 11.1 결정 원칙(Decision Principles)

- **오프라인-퍼스트**: 로컬 DB 중심으로 모델링하고, 서버 연동은 나중에 붙이기 쉬운 형태로 설계한다.
- **도메인 로직 분리**: 5/3/1 엔진(라운딩/퍼센트/PR 계산)은 플랫폼 독립(`packages/core`)으로 고정한다.
- **계약 기반 통신**: 앱 ↔ 서버는 **OpenAPI spec**을 단일 계약으로 사용한다.
- **포트폴리오 품질**: strict TS + 핵심 불변성(처방 스냅샷) 회귀 테스트를 “필수”로 둔다.

---

### 11.2 Mobile (Expo RN / TypeScript) — MVP

**Runtime**
- Expo + React Native
- TypeScript (strict)

**Routing / Navigation**
- expo-router

**Local Persistence (Offline-first)**
- expo-sqlite
- Query builder: **Kysely 권장**
  - SQL-first라서 migration/디버깅이 쉽고, 타입 안전한 쿼리를 유지할 수 있다.

**Schema / Validation**
- zod (입력값 검증 + shared 타입 생성)

**State**
- zustand (UI 상태, 세션 진행 상태 등)
- (선택) TanStack Query: 서버 붙는 Phase 2에서 캐시/동기화 패턴을 그대로 가져가기 좋다.

**UI**
- (옵션 A) **NativeWind(Tailwind for RN)**  
  - DX가 뛰어나지만, 스타일 난립 방지를 위해 **UI primitives 레이어(Button/Text/Stack/Card 등)에서만 className 사용**을 권장한다.
  - 동적 className 조합을 최소화하고, spacing/typography scale을 tokens로 고정한다.
- (옵션 B) 자체 primitives + StyleSheet 기반 (가장 단순/명확)

**Device**
- react-native-safe-area-context
- react-native-gesture-handler
- react-native-reanimated

**Utilities**
- date-fns (날짜/시간)
- uuid or nanoid (id)
- (필요 시) decimal.js (라운딩/퍼센트 계산의 부동소수 오차 회피)

---

### 11.3 Monorepo / Shared Packages (Mobile/Web 공용)

**Monorepo**
- Turborepo + pnpm

**packages/core**
- 프로그램 엔진(5/3/1), 라운딩/퍼센트/PR 계산
- 플랫폼 API 금지(RN/DOM 접근 금지)
- vitest 기반 unit test 필수

**packages/schemas**
- zod 스키마 모음 (settings, session, prescription, set_log 등)
- core / mobile / web / api에서 공유 가능하도록 설계

**packages/db**
- migrations(DDL) + migration runner + repos
- sync-ready 메타 컬럼(dirty/revision/deleted_at/updated_at) 규칙을 공통 유틸로 제공

---

### 11.4 Server (별도 레포, Spring + Kotlin) — Phase 2

> 서버는 **모노레포에 포함하지 않는다.** 별도 Git 레포에서 관리한다.

**Framework**
- Spring Boot + Kotlin

**Database**
- Postgres

**API Contract**
- OpenAPI 3.x
- 앱/웹은 OpenAPI 기반으로 클라이언트/타입을 생성하여 통신한다.

**Auth / Sync**
- 초기: 이메일 OTP/매직링크 또는 OAuth
- Sync는 record 단위 up/down으로 시작하고, conflict policy는 LWW + “완료 세션 수정 제한 정책”을 적용한다.

---

### 11.5 Web Console (Phase 2, 선택)

- Next.js (App Router) + TypeScript
- Tailwind + shadcn/ui
- TanStack Query
- Recharts (report/analytics)

---

### 11.6 품질/도구

**Testing**
- packages/core: vitest unit test (필수)
- mobile UI: @testing-library/react-native (핵심 플로우 위주)
- db: 새 설치에서 001 적용 테스트 + prescription 불변성 회귀 테스트

**Lint/Format**
- ESLint + Prettier

**Typecheck**
- tsc --noEmit

**CI**
- turbo run lint test typecheck

---
## 12) 엔지니어링 표준 (필수: AI 코딩 준수 규칙)

> 본 프로젝트는 AI 코딩을 적극 활용한다.  
> 아래 규칙은 **권장**이 아니라 **필수**이며, CI에서 위반 시 빌드 실패로 처리한다.  
> AI는 기능 구현 시 본 규칙을 최우선으로 준수해야 한다.

---

### 12.1 Lint / Typecheck 정책

- **TypeScript strict**를 기본으로 한다.
- ESLint는 **type-aware 설정**(TypeScript project 기반)을 사용한다.
- 아래 룰 위반은 모두 **error**로 간주한다. (warn 지양)
- 포맷팅은 Prettier 단일화(ESLint 스타일 충돌 제거)를 원칙으로 한다.

---

### 12.2 TypeScript 타입 안전 규칙 (최우선)

**금지**
- `any` 사용 금지 (`no-explicit-any`)
- `as` type assertion 남용 금지 (불가피한 경우만 제한적으로 사용)
- unsafe 흐름 금지:
  - `no-unsafe-assignment`
  - `no-unsafe-member-access`
  - `no-unsafe-call`
  - `no-unsafe-return`

**필수**
- 외부 입력/저장/네트워크 값은 기본적으로 `unknown`으로 받고,
  **zod.parse()** 또는 **type guard**로 좁힌다.
- Promise는 **떠다니면 안 된다**:
  - `no-floating-promises` 준수(의도적인 fire-and-forget은 명시적으로 void 처리 + 주석)
- Promise 오용 금지:
  - `no-misused-promises`
  - `await-thenable`
- union type 분기는 **exhaustive** 해야 한다:
  - `switch-exhaustiveness-check`
- type import/export는 일관되게 유지한다:
  - `consistent-type-imports`
  - (선택) `consistent-type-exports`

---

### 12.3 함수 시그니처/복잡도 규칙 (AI 코드 폭주 방지)

**파라미터 규칙**
- 함수 파라미터는 **최대 2개**까지만 허용한다. (`max-params: 2`)
- 파라미터가 3개 이상 필요하면 즉시 아래 형태로 변경한다:

  ✅ 허용
  - `fn({ a, b, c }: { a: A; b: B; c: C })`

  ❌ 금지
  - `fn(a: A, b: B, c: C)`

**복잡도/크기 상한**
- 인지 복잡도 상한: `sonarjs/cognitive-complexity <= 15`
- cyclomatic complexity 상한: `complexity <= 12`
- 함수 내 statement 수 상한: `max-statements <= 30`
- 함수 길이 상한: `max-lines-per-function <= 120` (주석/빈줄 제외)
- 중첩 depth 상한: `max-depth <= 4`

> 규칙 위반 시 “기능 추가”가 아니라 “리팩터링(분리/추출/모듈화)”가 먼저다.

---

### 12.4 파일 사이즈(소스) 비대화 방지

- 파일 길이 상한: `max-lines <= 450` (주석/빈줄 제외)
- 파일당 class 수: `max-classes-per-file = 1`

> 450줄을 넘기면 파일을 책임 단위로 분리한다.  
> (UI: 화면/컴포넌트/훅/유틸, Core: 엔진/계산/모델/시리얼라이즈 등)

---

### 12.5 React / React Native 필수 규칙

- Hooks 룰 위반 금지:
  - `react-hooks/rules-of-hooks`
- dependency 누락 금지:
  - `react-hooks/exhaustive-deps`
- nested component(렌더 내부 컴포넌트 정의) 금지:
  - `react/no-unstable-nested-components`

---

### 12.6 Import 규칙 (아키텍처 경계 + 번들/용량 예방)

**정렬/위생**
- import 정렬은 자동화한다:
  - `simple-import-sort/imports`, `simple-import-sort/exports`
- 순환 참조 금지:
  - `import/no-cycle`
- 의존성 누락/오염 금지:
  - `import/no-extraneous-dependencies`

**무거운 의존성 금지(번들/용량)**
- 아래 라이브러리 직접 사용 금지(대안 사용):
  - `moment` 금지 → `date-fns` 사용
  - `lodash` 전체 import 금지 → 필요 시 함수 단위 import 또는 `lodash-es` (허용 정책은 별도 문서로 고정)

**레이어/경계 규칙(필수)**
- `packages/core`는 플랫폼 의존을 가지면 안 된다:
  - `react`, `react-native`, `expo` import 금지
- 앱 레이어는 core를 사용하되, core는 앱을 참조하면 안 된다:
  - `packages/core` → `apps/*` import 금지
- DB 접근은 지정된 레이어를 통해서만 한다(직접 접근 금지 정책을 유지):
  - `apps/mobile`에서 `packages/db` 직접 사용을 제한(필요 시 repo/service 통해 접근)

> 위 금지/경계 규칙은 `no-restricted-imports` 또는 boundaries/import-path 규칙으로 강제한다.

---

### 12.7 기본 안정성 규칙

- 느슨한 비교 금지: `eqeqeq`
- 중괄호 생략 금지: `curly`
- debugger 금지: `no-debugger`
- console 금지: `no-console`  
  - 예외: 개발 전용 스크립트/샘플 코드는 overrides로 허용 가능

---

### 12.8 예외(Overrides) 정책

- 테스트 파일, 스크립트, 툴링 영역은 일부 룰을 완화할 수 있다.
  - 예: `no-console`, `max-lines`, `max-lines-per-function`, `max-statements`
- 예외가 필요하면 “무조건 disable”이 아니라,
  - 최소 범위(한 줄/한 파일)로 제한하고,
  - 주석으로 사유를 남긴다.

---

### 12.9 UI Token / i18n 강제 규칙 (필수)

#### UI Token
- 스크린/피처 레벨에서 임의 `spacing/fontSize/color` literal 사용 금지.
  - 금지 예: `padding: 13`, `fontSize: 15`, `color: '#111'`, `className="p-[13px]"` 등
- 허용: `tokens.*` 참조 또는 primitives의 props(예: `variant`, `size`, `tone`)로만 스타일링.
- 집행: `apps/mobile/src/features/**`에서
  - StyleSheet 직접 사용 제한(또는 tokens만 참조하도록 규칙화)
  - NativeWind 사용 시 arbitrary value(`[]`) 금지

#### i18n
- 사용자 노출 문자열 하드코딩 금지.
  - 금지 예: `<Text>완료</Text>`, `title: "Settings"`
- 허용: `t('...')` / `formatNumber(...)` / `formatDate(...)` (및 동일 목적의 래퍼 유틸)
- 집행: `apps/mobile/src/features/**`에서 literal string 사용을 리뷰 체크리스트 + 린트(가능한 범위)로 강제

#### Overrides(예외)
- 테스트/샘플 코드에 한해 최소 범위로만 허용.
- 예외 필요 시 “한 줄/한 파일” 수준으로 제한하고 사유 주석 필수.
---