# OwnLift Design System

> OwnLift is a dark, number-first training console where the UI recedes and the next prescribed action becomes obvious.

This document describes the design language currently implemented in the mobile app.
It is the source of truth for product design direction, implementation details, and UI review principles.
Use this document when implementing UI details: tokens, components, screen patterns, spacing, motion, and visual hierarchy.

When these documents feel ambiguous, follow the current code in:

- `apps/mobile/src/design/tokens.ts`
- `apps/mobile/src/design/primitives`
- `apps/mobile/app`
- `apps/mobile/src/program/plan-screen`
- `apps/mobile/src/history/history-screen`

---

## Overview

OwnLift should feel like a premium lifting instrument, not a colorful fitness dashboard.

The product surface is built from:

- a near-black app canvas,
- translucent charcoal cards,
- large rounded tactile controls,
- a single earned green accent,
- quiet native navigation,
- strong training numbers,
- sparse motion that appears mostly on completion or current-state changes.

The Apple reference is useful for restraint: confident typography, low chrome, a single action color, and surfaces that do not compete with the content. OwnLift applies that taste to a workout app. The hero object is not product photography; it is the current lift, set, weight, reps, completion state, and next action.

## Key Characteristics

- Dark-only interface with a calm charcoal base.
- One primary accent: high-energy green (`colors.primary`) for action, selection, current state, completion, PR, and meaningful progress.
- Numbers carry the product. Weights, reps, e1RM, set counts, and progress values should be easier to scan than labels.
- Cards are large, rounded, translucent, and tactile.
- Press feedback uses small scale changes and opacity, not color noise.
- Settings screens are neutral and grouped; they should not feel celebratory.
- Workout screens prioritize thumb-friendly controls, stable inputs, and persistent CTAs.
- History screens can show more data, but still avoid dense dashboards.
- Reward moments are rare: workout completion, PR, meaningful progress, and set completion.

---

## Design Principles

## 1. The Next Action Wins

Every screen should make the next useful action visible within two seconds.

Examples:

- Plan: start today's workout.
- Workout: complete or edit the current set.
- Completion: understand the top set and return to the plan.
- History: inspect recent progress.
- Settings: change one stable configuration value.

If another element competes with the next action, reduce it before adding more styling.

## 2. Numbers Are the Hero

Training numbers should be:

- large,
- high contrast,
- aligned predictably,
- close to the action they support,
- never hidden behind decorative UI.

Labels explain numbers; they should not visually overpower them.

## 3. Accent Is Earned

The primary green is a signal, not decoration.

Use `colors.primary` or `colors.primarySoft` only for:

- primary action,
- selected state,
- current set,
- today/current state,
- progress fill,
- successful completion,
- PR or meaningful achievement,
- active switch or mode.

Do not use green to make a neutral screen more exciting.

## 4. Quiet Until Rewarded

Most screens should be calm and dark. Strong visual feedback is reserved for:

- workout completion,
- PR improvement,
- current set,
- set completion,
- primary start/finish action.

Routine configuration and reference data should stay neutral.

## 5. Existing Tokens First

Use design primitives and tokens from `apps/mobile/src/design`.

Good:

```ts
colors.surfaceGlassStrong
spacing["2xl"]
fontSize["3xl"]
fontWeight.extrabold
borderRadius.xl
motion.duration.fast
```

Avoid new raw values unless the current tokens cannot express the intended hierarchy. If a raw value repeats, add a semantic token instead.

---

## Colors

Source of truth: `apps/mobile/src/design/tokens.ts`.

## Brand and Accent

| Token | Value | Use |
|---|---:|---|
| `colors.primary` | `#D6FF60` | The only primary accent. CTAs, selected state, current state, success, progress, PR. |
| `colors.primarySoft` | `rgba(214, 255, 96, 0.16)` | Soft green tint for selected backgrounds, current-state wash, progress fill, reward glow. |
| `colors.primaryForeground` | `#061018` | Text/icons placed on primary green. |
| `colors.accent` | `#D6FF60` | Alias-like accent usage. Prefer `primary` for new UI unless matching existing component API. |
| `colors.success` | `#D6FF60` | Success moments. Use sparingly. |
| `colors.destructive` | `#EF4444` | Actual destructive or blocking error states only. |

### Accent Rule

One viewport should usually contain only one strong green surface. Secondary green should appear as small selected states, thin borders, or `primarySoft` fills.

Current examples:

- Today preview card and play action on Plan.
- Selected tab and native tab indicator.
- Current set badge and current card border.
- Workout progress fill.
- History trend line and selected range indicator.
- PR/reward card border and glow.

## Surfaces

| Token | Value | Use |
|---|---:|---|
| `colors.background` | `#101010` | Default app canvas. |
| `colors.backgroundDeep` | `#0E131B` | Deeper immersive surfaces; use rarely. |
| `colors.surface` | `#1C1C1E` | Native tab bar, neutral controls, progress track, sheet background. |
| `colors.surfaceElevated` | `#1C1C1C` | Large cards, input fields, selected-neutral surfaces. |
| `colors.surfaceMuted` | `#2C2C2E` | Pressed/disabled/low-emphasis selected states. |
| `colors.surfaceGlass` | `rgba(28, 28, 30, 0.78)` | Floating controls and translucent bars. |
| `colors.surfaceGlassStrong` | `rgba(28, 28, 30, 0.94)` | Default card surface and grouped settings cards. |
| `colors.transparent` | `transparent` | Modal shells and intentional transparent backgrounds. |

### Surface Philosophy

OwnLift uses a dark "gallery" approach. The page background disappears; the current lift, card, or action becomes the visible object.

Do:

- separate sections with spacing first,
- use translucent cards for grouped content,
- use full dark backgrounds for workout focus,
- let native navigation stay quiet.

Do not:

- introduce large decorative gradients,
- stack many nested cards,
- use multiple colored card families for the main lifts,
- brighten settings screens.

## Borders and Hairlines

| Token | Value | Use |
|---|---:|---|
| `colors.border` | `#2C2C2E` | Hairline dividers and default card borders. |
| `colors.borderStrong` | `#3A3A3C` | Stronger control borders and progress containers. |

Existing screens also use subtle white alpha borders like `rgba(255, 255, 255, 0.05)` for glass cards. Treat these as local glass-surface details. Prefer adding a semantic token if a new alpha border repeats.

## Text

| Token | Value | Use |
|---|---:|---|
| `colors.text` | `#F5F5F7` | Primary text, titles, numbers, key labels. |
| `colors.textSecondary` | `#98989F` | Metadata, captions, helper copy. |
| `colors.textTertiary` | `#6C6C70` | Disabled states, low-priority labels, placeholders. |

Text hierarchy should come from size and weight first, then color.

---

## Typography

Source of truth: `apps/mobile/src/design/tokens.ts` and `Text.tsx`.

OwnLift uses the native system font through React Native. The style should feel close to Apple's confidence: large enough, strong enough, and not overly decorative.

## Type Scale

| Token | Size | Typical Use |
|---|---:|---|
| `fontSize.xs` | 11 | Labels, compact badges. |
| `fontSize.sm` | 13 | Captions, small controls, metadata. |
| `fontSize.md` | 15 | Body text, chip text, secondary values. |
| `fontSize.lg` | 17 | Important body, button text, settings values. |
| `fontSize.xl` | 20 | Section titles, card values, lift names. |
| `fontSize["2xl"]` | 24 | Modal titles and compact display. |
| `fontSize["3xl"]` | 30 | Major card values. |
| `fontSize["4xl"]` | 36 | Completion hero and high-emphasis numbers. |

Some current screens use local display sizes around `42px` for large native headers. New custom display type should use tokens first unless matching an existing screen pattern.

## Weight Scale

| Token | Weight | Use |
|---|---:|---|
| `fontWeight.normal` | 400 | Body and long helper text. |
| `fontWeight.medium` | 500 | Secondary values and calm controls. |
| `fontWeight.semibold` | 600 | Buttons, labels, settings values. |
| `fontWeight.bold` | 700 | Section titles, important values. |
| `fontWeight.extrabold` | 800 | Lift names, screen heroes, key training numbers. |

## Text Variants

Implemented in `Text.tsx`:

| Variant | Treatment | Use |
|---|---|---|
| `title` | `30 / 800 / text` | Screen titles inside custom screens. |
| `subtitle` | `17 / 500 / textSecondary` | One-line screen context. |
| `body` | `15 / 400 / text` | Default copy. |
| `caption` | `13 / 400 / textSecondary` | Metadata and helper text. |
| `label` | `11 / 500 / textTertiary / uppercase / 0.5 tracking` | Small metric labels. |
| `sectionHeader` | `13 / 600 / textSecondary / uppercase / 0.5 tracking` | Default section title primitive. |

Several screen-level sections intentionally override `sectionHeader` to a larger, non-uppercase `20 / 700` style. This is now part of the current Plan/History visual language.

## Typography Rules

Do:

- make lift names and top numbers heavier than labels,
- use `adjustsFontSizeToFit` for narrow numeric values,
- keep metadata at `textSecondary` or `textTertiary`,
- use short copy in workout mode,
- prefer 17px body-like text for controls that need native iOS readability.

Do not:

- use long instructional paragraphs in cards,
- bold every label,
- make metadata compete with weights/reps,
- use negative letter spacing in React Native unless a local screen has a measured need.

---

## Spacing and Layout

Source of truth: `spacing` tokens.

| Token | Value | Use |
|---|---:|---|
| `spacing["2xs"]` | 2 | Tiny insets, segmented-control inner padding. |
| `spacing.xs` | 4 | Tight text gaps and small internal offsets. |
| `spacing.sm` | 8 | Compact internal gaps. |
| `spacing.md` | 12 | Default row/control gaps. |
| `spacing.lg` | 16 | Row padding and medium section internals. |
| `spacing.xl` | 20 | Card padding. |
| `spacing["2xl"]` | 24 | Screen horizontal padding and major gaps. |
| `spacing["3xl"]` | 32 | Large vertical rhythm and bottom spacing. |
| `spacing["4xl"]` | 40 | Large bottom clearance. |
| `spacing["5xl"]` | 48 | Workout navigation offsets and onboarding header air. |

## Page Layout

Default mobile structure:

```txt
dark app background
native or custom header
screen content with 24px horizontal padding
sections with 24-32px vertical gaps
cards/rows with 12-20px internal gaps
bottom CTA or native tab bar clearance
```

Current examples:

- Plan: `paddingHorizontal: spacing["2xl"]`, `gap: spacing["2xl"]`.
- History: section list with 24px horizontal padding and compact list gaps.
- Settings: 32px section gaps to make configuration feel stable.
- Workout: larger top offset for custom back button and timer bar.
- Onboarding: 24px page padding with `flexGrow` layout and bottom CTA.

## Density

OwnLift is lower density than most fitness dashboards, but denser than Apple product tiles because workouts require repeated controls.

Use density by context:

- Plan: sparse, one strong today action.
- Workout: moderately dense, because input speed matters.
- Completion: sparse and celebratory.
- History: measured density with charts and list rows.
- Settings: grouped and calm.

---

## Shapes

Source of truth: `borderRadius` tokens.

| Token | Value | Use |
|---|---:|---|
| `borderRadius.sm` | 6 | Small inner elements only. |
| `borderRadius.md` | 10 | Inputs, check buttons, compact controls. |
| `borderRadius.lg` | 14 | Chips, utility buttons, small cards. |
| `borderRadius.xl` | 20 | Default major cards and grouped settings. |
| `borderRadius.full` | 999 | Pills, badges, circular buttons, segmented controls. |

Current screen styles also use larger local radii (`22`, `28`) for high-emphasis cards. Use these only when matching existing Plan/History card geometry. Otherwise prefer `borderRadius.xl`.

## Shape Rules

Do:

- use pill shapes for primary CTAs and compact selected controls,
- use large rounded cards for tactile grouping,
- keep check buttons and numeric inputs stable and rectangular-rounded,
- use continuous corners (`borderCurve: "continuous"`) where supported.

Do not:

- mix many radius sizes inside one card,
- nest rounded cards inside rounded cards,
- make full-bleed sections rounded,
- introduce sharp corners for primary workout controls.

---

## Elevation and Depth

OwnLift uses more card elevation than Apple, but it should still feel restrained.

## Current Depth Levels

| Level | Treatment | Use |
|---|---|---|
| Flat | `colors.background`, no border | Page canvas and empty space. |
| Hairline | `colors.border` or subtle white alpha border | Dividers, settings rows, glass cards. |
| Glass Card | `colors.surfaceGlassStrong`, 1px alpha border, soft shadow | Default `Card`. |
| Floating Control | `colors.surfaceGlass`, circular/pill shape, soft shadow | Back button, drag handle, small icon controls. |
| Reward Glow | `colors.primarySoft` overlay or green border | PR/completion reward only. |
| Fade Overlay | SVG gradient using `colors.background` | Workout nav and bottom CTA fade. |

## Shadow Philosophy

Shadows are allowed when they support tactile hierarchy:

- default cards,
- floating back buttons,
- draggable week cards,
- selected chart/summary cards,
- primary today card.

Do not add shadow to plain text or every small chip. If a component does not need to float, use spacing, surface, and border instead.

---

## Motion and Haptics

Source of truth: `motion` tokens.

| Token | Value | Use |
|---|---:|---|
| `motion.duration.instant` | 80 | Tiny feedback. |
| `motion.duration.fast` | 140 | Press/selection feedback. |
| `motion.duration.normal` | 220 | Reveal and tab movement. |
| `motion.duration.slow` | 360 | Larger transitions. |
| `motion.scale.press` | 0.98 | Press feedback. |
| `motion.scale.selected` | 1.02 | Selected emphasis. |
| `motion.scale.reward` | 1.06 | Reward moment. |
| `motion.distance.subtle` | 6 | Small reveal movement. |
| `motion.distance.normal` | 12 | Default reveal movement. |
| `motion.distance.large` | 24 | Larger entrance. |

## Motion Rules

Do:

- use scale/opacity for press states,
- animate current-state changes when they clarify state,
- use reveal motion on completion summaries,
- respect reduce motion for celebratory animations,
- use haptics for set completion and PR/completion.

Do not:

- loop decorative animation in normal screens,
- animate background decoration,
- use haptics for every tap,
- make settings screens feel energetic.

Current reward implementation:

- completion screen uses reveal cards and optional Lottie confetti,
- PR reward uses a subtle green glow and success haptic,
- rest timer progress animates linearly and can be paused.

---

## Components

Source of truth: `apps/mobile/src/design/primitives`.

## `Text`

Use the primitive for consistent color and hierarchy. Override only when a screen has a clear local hierarchy.

Good local overrides:

- larger Plan section titles,
- completion hero numbers,
- compact chart labels,
- settings values.

## `Button`

Implemented variants:

| Variant | Treatment | Use |
|---|---|---|
| `primary` | Green pill, foreground dark text | Main action. Start, save, complete, apply. |
| `secondary` | Muted surface, strong border, light text | Secondary but visible action. |
| `ghost` | Low-alpha white surface | Tertiary action. |

Sizes:

- `sm`: compact actions,
- `md`: mid-level actions,
- `lg`: default full-width screen CTA.

Rules:

- Primary button should normally appear once per view.
- Use full-width primary for bottom CTAs.
- Use `disabled` instead of changing copy color manually.
- Keep labels short and action-oriented.

## `Card`

Default:

- `colors.surfaceGlassStrong`,
- `borderRadius.xl`,
- `padding: spacing.xl`,
- subtle alpha border,
- soft shadow.

`highlighted` uses `colors.surfaceElevated` and slightly stronger containment.

Rules:

- one main value or one grouped control per card,
- avoid putting a `Card` inside another `Card`,
- use screen-level card styles for high-emphasis Plan/History cards,
- completed/selected/current states may override border or background.

## `Badge`

Variants:

| Variant | Use |
|---|---|
| `today` | Current/today state, green fill. |
| `completed` | Completed state, neutral elevated surface. |
| `planned` | Planned state, quiet border. |
| `amrap` | AMRAP marker, neutral surface with green text. |
| `pr` | PR/achievement marker, green fill. |
| `default` | Rare neutral badge. |

Rules:

- Badges should clarify state, not decorate.
- Do not stack many badges in one row unless each changes behavior.
- Use compact badges in dense cards.

## `SegmentedControl`

Current treatment:

- glass container,
- pill-ish outer radius,
- neutral selected state,
- semibold selected label.

Use for two or three mode choices:

- units,
- language,
- schedule mode,
- trend range.

Settings segmented controls should stay neutral. Use green selection only when the selected mode directly controls the primary content, like History trend range.

## `Stepper`

Use for numeric settings with predictable increments:

- TM increase,
- rest timer default.

Rules:

- Keep buttons thumb-sized where practical.
- Display the value in the center with a stable minimum width.
- Disable decrement at minimum rather than showing errors.

## `NumericInput`

Use for training numbers:

- training maxes,
- actual set weight,
- actual reps.

Current treatment:

- elevated surface,
- 1px border,
- `borderRadius.md`,
- centered 17px semibold text,
- optional unit label.

Rules:

- Numeric inputs should be stable in width.
- In workout mode, avoid tiny inputs.
- AMRAP reps should receive focus when they become current.

## `Section`

Use for grouping related content.

Default title is small uppercase, but Plan/History often override to a larger `20 / 700` title.

Rules:

- Keep one conceptual group per section.
- Use `headerAccessory` for one quiet action only.
- Do not put a primary CTA in a section header.

## `BackButton`

Current treatment:

- 52px circular glass surface,
- chevron icon,
- subtle shadow,
- `hitSlop: 8`.

Use in custom full-screen flows:

- Workout,
- Session detail,
- Upcoming.

Prefer native stack back buttons when the screen is a normal tab stack child.

## `Divider`

Use sparingly. Prefer section spacing first.

Good uses:

- separating onboarding steps,
- separating workout header from set list,
- separating settings groups only when needed.

---

## Screen Patterns

## Plan

Primary question: What should I do next?

Current structure:

```txt
native large title
Today section
  strong green today preview card
This Week section
  2-column lift cards
Activity section
  compact summary card
Upcoming section
  quiet row card
```

Rules:

- Today preview is the dominant surface.
- Green is allowed because it starts the current workout.
- Week cards should remain neutral unless today/completed state needs a badge.
- Activity numbers should be compact and scannable, not dashboard-heavy.
- Upcoming should be a quiet secondary action.

## Workout

Primary question: What set do I complete now?

Current structure:

```txt
floating back button / rest timer
lift title and week
badges
progress count and bar
preview notice if not active
warm-up sets
work sets
sticky bottom primary CTA
rest timer sheet
```

Rules:

- Current set gets the strongest set-card emphasis.
- Completed set gets a subtle green tint/border.
- The progress bar can use primary green because it reflects meaningful progress.
- The bottom CTA should be persistent when the user can start or complete.
- Inputs and check buttons must remain stable and thumb-friendly.
- Rest timer should be visible but not dominate the set list.

## Completion

Primary question: What happened, and what is next?

Current structure:

```txt
completion title
subtitle with lift
top set hero
e1RM / PR card
next up card
cycle progress card
primary return action
secondary log action
```

Rules:

- Top set is the numeric hero.
- PR card may glow and use stronger green.
- Confetti is allowed only for workout completion and must respect reduce motion.
- Keep summary cards few; do not turn completion into analytics.

## History

Primary question: Am I progressing?

Current structure:

```txt
native large title
lift summary cards
selected lift trend section
range tabs
chart card
completed workout list
filter sheet
```

Rules:

- Chart and summary cards may be denser than Plan, but still show few metrics.
- Selected trend uses green because it is the active progress signal.
- Filters are modal/bottom-sheet utilities, not primary content.
- Empty states should be calm and non-error-like.

## Settings

Primary question: What can I configure?

Current structure:

```txt
native large title
grouped rows
segmented controls
steppers
switches
schedule editor
data backup actions
```

Rules:

- Keep settings neutral and low-accent.
- Use green only for active switches, selected day chips, and save/apply action.
- Group rows inside glass cards.
- Use right-aligned values for scanability.
- Use destructive styling only for irreversible import/overwrite confirmation, not normal warnings.

## Onboarding

Primary question: What setup value is needed now?

Current structure:

```txt
custom title and subtitle
one or two setup sections
controls
bottom/last primary CTA
```

Rules:

- Keep onboarding direct and sparse.
- Do not add marketing panels before setup.
- Preserve progress by making each step feel small.
- Disable the next action until required values are present.

## Upcoming and Session Detail

Primary question:

- Upcoming: What remains after this week?
- Session detail: What was prescribed and recorded?

Rules:

- Use custom back button with dark canvas.
- Keep rows/cards consistent with Plan and History.
- Session detail is read-only; avoid energetic current-state styling.

---

## Navigation

OwnLift uses Expo Router with native navigation surfaces.

## Root

- dark theme,
- `colors.background` content,
- `colors.surface` card/tab surfaces,
- `colors.primary` as navigation primary/notification color,
- light status bar.

## Tabs

Current native tab treatment:

- background `colors.surface`,
- selected icon/label `colors.primary`,
- default icon/label muted,
- 11px labels,
- semibold/bold label weight,
- no transparent scroll-edge effect.

Rules:

- Keep tab icons familiar and literal.
- Selected tab can use green because it is current location.
- Do not add badges unless they require user attention.

## Stack Headers

Native tab stacks use large titles where appropriate:

- title color `colors.text`,
- large title weight `800`,
- background `colors.background`,
- minimal shadows.

Custom headers are reserved for immersive screens like Workout, Upcoming, and Session Detail.

---

## Imagery and Icons

OwnLift uses functional imagery, not decoration.

Current assets:

- lift thumbnails for squat, bench, deadlift, press,
- foreground/tinted lift assets,
- completion confetti animation.

Rules:

- Use lift imagery only to identify a lift or reinforce the current action.
- Tint thumbnails with `colors.primary` only for current/completed/selected states.
- Use `colors.textTertiary` for inactive lift imagery.
- Icons should be literal and small.
- Avoid decorative icon clusters.
- Prefer existing icon libraries already in the app (`Ionicons`, and available project icon libs) before custom drawing.

---

## Inputs, Sheets, and Modals

## Bottom Sheets

Current treatment:

- `colors.surface` sheet background,
- 1px subtle white alpha border,
- `colors.borderStrong` handle indicator,
- 48% backdrop opacity,
- dynamic sizing.

Use for:

- rest timer controls,
- history filters,
- compact focused utilities.

Rules:

- Bottom sheets should complete one task.
- Use primary button only for apply/confirm.
- Secondary actions stay neutral.

## Forms

Form hierarchy:

```txt
label
current value / control
short helper text
error only when blocking
```

Rules:

- Prefer segmented controls for finite options.
- Prefer steppers for bounded numeric increments.
- Prefer numeric input for actual training numbers.
- Keep helper copy short.

---

## Accessibility

OwnLift is used during workouts, often with fatigue and limited attention.

Rules:

- Keep practical touch targets at least 44px.
- Use `Pressable` for pressable controls.
- Provide `accessibilityRole` for buttons/tabs where custom.
- Do not communicate state through color alone; pair color with label, badge, border, progress, or check state.
- Important numbers must have strong contrast.
- Preserve reduced-motion handling for celebration.
- Keep bottom CTA padding high enough to avoid the home indicator and keyboard.
- Use `adjustsFontSizeToFit` when translated labels or numbers can overflow.

---

## Responsive Behavior

OwnLift is mobile-first.

Current responsive strategy is mostly intrinsic:

- flex rows wrap where needed,
- text uses `numberOfLines` and `adjustsFontSizeToFit`,
- cards use percentage widths for two-column summary grids,
- SectionList and ScrollView avoid visible scroll indicators,
- keyboard-aware workout screen scrolls focused inputs above sticky CTA.

Guidelines:

- Assume small phone width first.
- Do not hard-code text containers so Korean/English labels overflow.
- Preserve 24px horizontal padding unless a screen requires a focused full-width control.
- Two-column card grids should collapse or use flexible sizing when content cannot fit.
- Persistent bottom controls must increase scroll bottom padding.

---

## Implementation Rules

Do:

- import from `apps/mobile/src/design` for tokens and primitives,
- use `StyleSheet.create`,
- use `Pressable` for custom press controls,
- keep touch targets around 44px or larger,
- use semantic tokens before raw values,
- memoize list rows and stabilize callbacks in scroll-heavy screens,
- keep settings and configuration low-accent,
- make training numbers larger and clearer than metadata,
- use progressive disclosure before adding more data to a screen.

Do not:

- introduce a second brand accent,
- add decorative gradients or glow backgrounds,
- use primary green for neutral decoration,
- add multiple competing CTAs in one viewport,
- put cards inside cards,
- add chart-heavy dashboards without a clear question,
- use destructive red for missing data or normal incomplete states,
- create tiny tap targets near screen edges,
- replace existing primitives with one-off components unless there is a real interaction need.

## Raw Value Policy

The current code contains a few local raw values for:

- alpha glass borders,
- alpha green tints,
- special Plan today-card surface,
- high-emphasis card radii,
- shadows.

For new UI:

1. Use existing tokens first.
2. If the exact current pattern exists, reuse the local screen style or extract a primitive.
3. If a raw value repeats across screens, promote it into `tokens.ts` with a semantic name.
4. Do not add new raw colors for one-off decoration.

---

## Review Checklist

Before shipping a UI change, answer:

1. What is the primary question of this screen?
2. Is the answer visible within two seconds?
3. Is there only one dominant visual element?
4. Are weights, reps, sets, or progress values easier to scan than labels?
5. Is green used only for action, current state, selected state, success, PR, or meaningful progress?
6. Are settings and configuration surfaces neutral?
7. Are touch targets large enough for a workout context?
8. Does the screen work with Korean and English text?
9. Is secondary data collapsed, muted, or moved deeper?
10. Does the design look like the current OwnLift app?

---

## Do's and Don'ts

## Do

- Use dark charcoal surfaces and white/gray text hierarchy.
- Keep the main action visually obvious.
- Make the current set unmistakable.
- Use green sparingly and meaningfully.
- Give training numbers enough size and weight.
- Use large rounded glass cards for grouped content.
- Use native navigation when it keeps the screen calmer.
- Use bottom CTAs for start/complete flows.
- Use subtle motion and haptics where they reinforce progress.
- Treat empty states as calm, not broken.

## Don't

- Do not copy Apple's light product-tile system directly.
- Do not make OwnLift feel like a marketing site.
- Do not add color-coded lift families unless there is a strong product reason.
- Do not make History into a dense analytics cockpit.
- Do not make Settings look like a reward surface.
- Do not decorate with icons, gradients, or badges.
- Do not hide important workout numbers in small captions.
- Do not make every card glow or cast a heavy shadow.
- Do not add a new token when an existing token expresses the same hierarchy.

---

## Final Direction

Apple's lesson is restraint. OwnLift's translation is:

> near-invisible dark UI, one earned green signal, and training numbers that tell the lifter exactly what to do next.

When deciding between two UI directions, choose the one that makes the next prescribed action clearer with fewer elements.
