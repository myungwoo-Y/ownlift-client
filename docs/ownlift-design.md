# OwnLift Design Guide

> OwnLift is a calm lifting console that reveals only the data needed for the next confident action.

This document defines the design direction, visual rules, interaction principles, and AI/agent guidance for OwnLift.

It is intentionally **feature-agnostic**.  
It should continue to guide the product even if screens, navigation, or specific features change.

---

## 1. Product Design Philosophy

OwnLift is not a colorful fitness dashboard, a social workout app, or a dense analytics tool.

OwnLift is a **program runner for structured barbell training**.

The product should help the user:

1. understand what to do next,
2. record the current action with minimal friction,
3. trust that the program is progressing correctly,
4. feel rewarded when meaningful progress happens.

The UI should show less, but guide better.

### Core Experience

The core experience is:

```txt
prescription → execution → progression → reflection
```

This means the design should always prioritize:

- the next prescribed action,
- the current state,
- the most important training number,
- the next confident interaction.

Everything else should be secondary, collapsed, deferred, or removed.

---

## 2. Design Taste

OwnLift should feel:

- clean,
- restrained,
- focused,
- calm,
- precise,
- premium,
- strong without being loud.

The app should avoid:

- visual complexity,
- excessive dashboard density,
- unnecessary charts,
- decorative icons,
- repeated badges,
- too many highlighted states,
- accent color used as decoration.

The best OwnLift screen should feel simple at first glance, but supportive during actual use.

---

## 3. Design Principles

## 3.1 Data Minimalism

Every screen should answer one primary question.

Examples:

```txt
What should I do now?
What is currently selected?
What changed?
Am I progressing?
What can I control?
```

If a piece of data does not help answer the screen’s primary question, it should be:

1. removed,
2. muted,
3. collapsed,
4. moved to a detail screen,
5. revealed only after interaction.

### Data Priority

Use this hierarchy when deciding what to show:

1. **Action-critical data**  
   Needed to perform the next action.

2. **State-critical data**  
   Needed to understand current state.

3. **Progress data**  
   Helps the user feel growth over time.

4. **Reference data**  
   Useful but not needed immediately.

5. **Debug/detail data**  
   Should almost always live deeper.

---

## 3.2 Numbers Are the Product

OwnLift is a training app.  
Weights, reps, sets, estimated strength, progress counts, and completion states are the core product surface.

Training numbers should be:

- larger than labels,
- easier to scan than metadata,
- visually stable,
- aligned consistently,
- never hidden behind decorative UI.

When in doubt, make the number clearer before adding a new visual element.

---

## 3.3 Accent Is Earned

The primary green is not decoration.  
It is a signal.

Use accent only when the interface needs to say:

- start here,
- this is selected,
- this is happening now,
- this was completed,
- this is a meaningful achievement,
- this requires attention.

Do not use accent simply to make the screen feel more exciting.

If a screen feels flat, improve:

1. hierarchy,
2. spacing,
3. typography,
4. copy,
5. grouping,

before adding more accent color.

---

## 3.4 One Primary Emphasis Per View

A screen should usually have only one dominant visual element.

Examples of dominant elements:

- a primary action card,
- the current set,
- a selected record,
- a completion result,
- a selected setting group.

Secondary elements should support the dominant element, not compete with it.

Avoid:

- multiple bright cards,
- multiple primary CTAs,
- several accent borders in one viewport,
- multiple large numbers with equal emphasis.

---

## 3.5 Quiet by Default, Rewarding When Earned

Most of the app should feel calm.  
Reward should appear only when the user has done something meaningful.

Use stronger visual feedback for:

- workout completion,
- PR,
- cycle progression,
- successful set completion,
- meaningful streak or consistency.

Avoid turning everyday UI into a game.

---

## 4. Token Source

The source of truth for raw token values is `apps/mobile/src/design/tokens.ts`.

This document does not redefine raw values.  
It defines **how tokens should be used**.

Use semantic token names instead of raw hex values.

Good:

```ts
colors.primary
colors.surface
spacing["2xl"]
fontSize["3xl"]
borderRadius.xl
```

Avoid:

```ts
"#D6FF60"
24
36
```

New visual tokens should be introduced only when an existing token cannot express the intended hierarchy or interaction.

---

## 5. Color System

OwnLift uses a high-contrast dark system with one primary accent.

## 5.1 Base Surfaces

### `colors.background`

Use for the main app background.

Purpose:

- creates a calm foundation,
- lets cards and primary states stand out,
- reduces visual fatigue in workout contexts.

### `colors.backgroundDeep`

Use sparingly for deeper immersive surfaces.

Good candidates:

- focused workout mode,
- modal background,
- detail view requiring extra contrast.

Do not use it randomly across screens.

### `colors.surface`

Default card and grouped section surface.

Use for:

- cards,
- grouped rows,
- neutral containers,
- inactive areas.

### `colors.surfaceElevated`

Use for elements that need mild separation from the default surface.

Use for:

- summary panels,
- floating sections,
- large grouped containers.

### `colors.surfaceMuted`

Use for selected neutral states or pressed states.

Use for:

- selected tab background,
- neutral segmented controls,
- pressed surface feedback,
- low-emphasis selected option.

### `colors.surfaceGlass` / `colors.surfaceGlassStrong`

Use for floating navigation, overlays, or persistent controls.

Rules:

- should feel functional, not decorative,
- should not obscure important content,
- should have enough contrast against the background.

---

## 5.2 Borders

### `colors.border`

Use for default hairline separation.

### `colors.borderStrong`

Use for:

- selected neutral components,
- floating bars,
- cards requiring stronger containment.

Avoid heavy borders when spacing alone can separate content.

---

## 5.3 Text

### `colors.text`

Use for:

- page titles,
- primary labels,
- major numbers,
- key actions.

### `colors.textSecondary`

Use for:

- metadata,
- captions,
- inactive labels,
- explanatory text.

### `colors.textTertiary`

Use for:

- disabled states,
- very low-priority text,
- placeholder-like labels.

Text hierarchy should be achieved through size, weight, and contrast — not color variety.

---

## 5.4 Accent

### `colors.primary`

Use only for:

- primary action,
- current state,
- selected state,
- success,
- PR,
- meaningful progress,
- critical active control.

### `colors.primarySoft`

Use for:

- subtle selected backgrounds,
- soft state emphasis,
- low-intensity highlight,
- background tint for a currently focused item.

### `colors.primaryForeground`

Use for text or icons placed directly on `colors.primary`.

### Accent Discipline

One screen should rarely need more than:

- one primary accent surface,
- one selected accent state,
- one small accent affordance.

If several elements need accent at the same time, reassess the information hierarchy.

---

## 5.5 Destructive Color

Use destructive color only for actual destructive, dangerous, or irreversible actions.

Do not use destructive color for:

- empty data,
- missing records,
- low performance,
- neutral warnings,
- incomplete setup.

Missing data should feel incomplete, not broken.

---

## 6. Typography

Typography should make the interface feel confident, readable, and quiet.

## 6.1 Type Hierarchy

### Page Title

Use for top-level screen identity.

Recommended:

- `fontSize["4xl"]`
- `fontWeight.extrabold`
- `colors.text`

Purpose:

- strong orientation,
- native-feeling large title,
- premium presence.

### Section Title

Use for major content groups.

Recommended:

- `fontSize["2xl"]` or `fontSize["3xl"]`
- `fontWeight.bold`
- `colors.text`

### Card Title

Use for named objects such as lifts, sessions, settings groups, or records.

Recommended:

- `fontSize.xl` to `fontSize["2xl"]`
- `fontWeight.bold`
- `colors.text`

### Numeric Hero

Use for important training numbers.

Recommended:

- `fontSize["3xl"]` or `fontSize["4xl"]`
- `fontWeight.bold` or `fontWeight.extrabold`
- `colors.text`

On primary surfaces:

- use `colors.primaryForeground`

### Metadata

Use for supporting details.

Recommended:

- `fontSize.sm` to `fontSize.md`
- `fontWeight.medium` or `fontWeight.semibold`
- `colors.textSecondary`

### Microcopy

Use sparingly for helper text and empty states.

Recommended:

- `fontSize.sm` to `fontSize.md`
- `fontWeight.normal`
- `colors.textSecondary`

---

## 6.2 Typography Rules

Do:

- make numbers easier to read than labels,
- use strong weight for key data,
- keep metadata quiet,
- keep line lengths short on mobile,
- use consistent numeric formatting.

Avoid:

- small weights/reps text,
- competing large text blocks,
- multiple font weights in one card,
- using bold everywhere.

---

## 7. Spacing and Layout

OwnLift should feel spacious, not empty.

## 7.1 Page Layout

Recommended base structure:

```txt
safe area
page title
primary content
secondary content
supporting content
bottom navigation / persistent control
```

Use generous section gaps.  
Separate content through spacing and hierarchy before adding borders or dividers.

## 7.2 Recommended Spacing

Use existing spacing tokens.

General guidance:

- page horizontal padding: `spacing["2xl"]`
- card padding: `spacing.xl` to `spacing["2xl"]`
- section gap: `spacing["3xl"]` to `spacing["4xl"]`
- compact internal gap: `spacing.sm` to `spacing.md`
- large content gap: `spacing.xl` to `spacing["2xl"]`

## 7.3 Density

OwnLift should avoid dense dashboard layouts.

Do:

- show fewer metrics,
- increase clarity of the key metric,
- use progressive disclosure,
- group related information.

Avoid:

- too many cards in one viewport,
- chart-heavy screens without enough data,
- over-explaining every metric,
- placing secondary data next to primary CTAs.

---

## 8. Shape and Radius

OwnLift uses large, soft shapes to feel premium and tactile.

## 8.1 Radius Usage

### `borderRadius.sm`

Use for small internal elements only.

### `borderRadius.md`

Use for compact buttons, small controls, and inner elements.

### `borderRadius.lg`

Use for medium cards and grouped controls.

### `borderRadius.xl`

Use for primary cards, large containers, grouped settings, and major surfaces.

### `borderRadius.full`

Use for:

- pill controls,
- floating navigation,
- circular buttons,
- segmented controls,
- badges.

## 8.2 Shape Rules

Do:

- use large radius for major surfaces,
- use pill shapes for persistent navigation and compact choices,
- keep shape language consistent.

Avoid:

- mixing many radius values in one screen,
- sharp corners on primary cards,
- excessive nested rounding.

---

## 9. Elevation and Depth

OwnLift should not rely on heavy shadows.

Depth should come from:

1. surface contrast,
2. spacing,
3. subtle borders,
4. glass surfaces for persistent controls,
5. restrained motion.

Use shadows only when a component truly needs to float above content.

Avoid:

- heavy card shadows,
- glowing all cards,
- neumorphic depth,
- decorative gradients used as structure.

---

## 10. Component Principles

This section describes reusable component principles, not fixed screen-specific components.

---

## 10.1 Primary Action Surface

A primary action surface is the strongest card or control in a view.

Use when the user needs one obvious next action.

Style:

- strong visual hierarchy,
- clear title,
- one primary number or action,
- accent only when the action is the main focus,
- large touch target.

Rules:

- one per screen or viewport when possible,
- do not place another equally strong CTA nearby,
- keep supporting metadata minimal.

---

## 10.2 Data Card

A data card presents one meaningful value or state.

Structure:

```txt
label
value
optional delta / state
```

Rules:

- one main value per card,
- label should be quieter than value,
- icon is optional, not required,
- do not show delta unless it helps interpretation,
- missing values should use calm empty state treatment.

---

## 10.3 State Card

A state card represents an item with a current, selected, planned, completed, or disabled state.

State hierarchy:

1. current
2. selected
3. completed
4. planned
5. disabled

Rules:

- current state may use accent,
- selected state may use accent or muted surface,
- planned state should remain quiet,
- completed state should be calm and lower emphasis,
- disabled state should use tertiary text.

---

## 10.4 Grouped List

Use grouped lists for stable configuration or reference information.

Style:

- surface background,
- large radius,
- subtle borders,
- clear row separation,
- right-aligned values.

Rules:

- values should be easy to scan,
- chevrons should be quiet,
- row height should support touch comfortably,
- avoid accent unless the row is selected or active.

---

## 10.5 Segmented Control

Use for switching between a small number of modes.

Rules:

- keep options short,
- use pill shape,
- selected state should be obvious,
- use accent only when the selection affects primary content,
- use neutral selected state for settings or low-energy contexts.

---

## 10.6 Floating Navigation

Floating navigation can be used when persistent access is important.

Rules:

- should feel calm and tactile,
- should not block core content,
- selected tab should be clear but not loud,
- use glass surface and pill geometry,
- avoid excessive badges or animation.

---

## 10.7 Empty State

Empty states should feel calm and supportive.

Structure:

```txt
short title
one-sentence explanation
optional next action
```

Rules:

- do not treat empty data as an error,
- avoid red/destructive styling,
- avoid over-explaining,
- give the user a clear next step if possible.

---

## 11. Interaction and Motion

Motion should clarify state changes, not decorate the app.

## 11.1 Motion Personality

OwnLift motion should be:

- calm,
- fast,
- tactile,
- subtle,
- rewarding only when earned.

## 11.2 Motion Rules

Use motion for:

- press feedback,
- selected state changes,
- current state transition,
- completion,
- PR or achievement,
- progressive reveal of relevant data.

Avoid motion for:

- background decoration,
- looping attention effects,
- constant pulsing,
- unnecessary card movement,
- gamified celebration on routine actions.

## 11.3 Motion Tokens

These are implemented in `apps/mobile/src/design/tokens.ts` as `motion`.

```ts
export const motion = {
  duration: {
    instant: 80,
    fast: 140,
    normal: 220,
    slow: 360,
  },
  scale: {
    press: 0.98,
    selected: 1.02,
    reward: 1.06,
  },
  distance: {
    subtle: 6,
    normal: 12,
    large: 24,
  },
};
```

## 11.4 Haptics

Use haptics sparingly.

Good moments:

- primary action press,
- set completion,
- timer completion,
- workout completion,
- PR.

Avoid haptics for every minor tap.

---

## 12. Information Architecture Guidelines

OwnLift should use progressive disclosure.

## 12.1 Surface Level

Show only what the user needs now.

Examples:

- next action,
- current state,
- primary number,
- selected item,
- summary progress.

## 12.2 Detail Level

Show supporting data after the user asks for it.

Examples:

- full set breakdown,
- historical records,
- detailed settings,
- program configuration,
- export/import,
- advanced statistics.

## 12.3 Advanced Level

Hide advanced or rarely used controls deeper.

Examples:

- program internals,
- sync details,
- raw data export,
- debugging information,
- experimental settings.

---

## 13. Screen Composition Patterns

These are flexible patterns, not fixed screens.

---

## 13.1 Command Pattern

Use when the user needs to act.

Structure:

```txt
title
primary action surface
supporting context
secondary options
```

Design goal:

- one obvious next action.

---

## 13.2 Tracking Pattern

Use when the user is recording something.

Structure:

```txt
current item
input / completion control
recent or next context
persistent action
```

Design goal:

- reduce input friction,
- avoid distractions,
- make current state unmistakable.

---

## 13.3 Reflection Pattern

Use when the user is reviewing progress.

Structure:

```txt
primary metric
small set of supporting metrics
trend or history
empty state when data is insufficient
```

Design goal:

- make progress understandable without overwhelming the user.

---

## 13.4 Configuration Pattern

Use when the user is changing app or program behavior.

Structure:

```txt
group title
grouped controls
current values
calm helper text
```

Design goal:

- feel stable,
- avoid excitement,
- reduce fear of changing settings.

---

## 14. Copywriting

Copy should be short, direct, and calm.

## 14.1 Voice

OwnLift copy should be:

- clear,
- supportive,
- confident,
- understated.

Avoid:

- hype,
- guilt,
- excessive motivation,
- social language,
- gamified pressure.

Good:

```txt
Ready for today
Next set
Workout complete
New PR
Not enough data yet
```

Avoid:

```txt
Crush it!
Destroy your limits!
You are unstoppable!
Massive gains!
```

## 14.2 Empty State Copy

Good pattern:

```txt
Not enough data yet
Complete more workouts to see your trend.
```

Do not over-explain.

---

## 15. Accessibility

OwnLift should be usable during real workouts.

Rules:

- minimum touch target: 44px height/width,
- important numbers must have strong contrast,
- do not communicate state through color alone,
- maintain readable text sizes,
- avoid tiny tap targets near screen edges,
- support dynamic type where practical,
- ensure bottom controls do not hide content.

---

## 16. Do's and Don'ts

## Do

- show less, but guide better,
- make the next action obvious,
- make numbers easy to read,
- use one accent color with discipline,
- use large rounded surfaces,
- keep secondary data quiet,
- use spacing before borders,
- use motion only for meaningful state changes,
- make empty states calm,
- preserve a premium dark visual tone.

## Don't

- do not turn every screen into a dashboard,
- do not use accent color as decoration,
- do not show every possible metric,
- do not add badges without meaning,
- do not use multiple competing CTAs,
- do not overuse icons,
- do not add decorative gradients by default,
- do not make settings feel energetic,
- do not treat missing data as an error,
- do not add complex UI when hierarchy can solve the problem.

---

## 17. AI / Agent Instructions

When modifying OwnLift UI, follow these rules.

1. Read this document before changing UI.
2. Use existing tokens from `tokens.ts`.
3. Do not introduce new colors, radii, or shadows unless clearly justified.
4. Preserve the restrained data-first direction.
5. Prefer subtraction before addition.
6. Make the primary action obvious within two seconds.
7. Make training numbers easier to read before adding decoration.
8. Use primary green only for current state, selected state, primary action, success, PR, or meaningful progress.
9. Keep settings and configuration screens neutral.
10. Avoid dense dashboard layouts.
11. Avoid decorative icons and repeated badges.
12. Use progressive disclosure for secondary data.
13. Keep motion subtle except for meaningful completion or achievement.
14. Explain visual changes in terms of clarity, reduced cognitive load, training flow, or product identity.

Before adding a new UI element, ask:

```txt
Does this help the user decide what to do next?
Does this clarify the current state?
Does this reduce cognitive load?
Does this support the main action?
```

If the answer is no, do not add it.

---

## 18. AI Review Checklist

Use this checklist when reviewing any screen.

1. What is the primary question this screen answers?
2. Is the answer visible within two seconds?
3. Is there one dominant visual element?
4. Are training numbers readable enough?
5. Is secondary data quieter than primary data?
6. Is accent color used only where it has meaning?
7. Are there unnecessary icons, badges, borders, or charts?
8. Is the layout calm but not empty?
9. Would the screen be usable during an actual workout?
10. Does the screen feel like OwnLift rather than a generic fitness app?
11. Can the design be implemented with existing tokens?
12. What can be removed before adding anything new?

---

## 19. Expansion Guidelines

As OwnLift grows, new features should inherit the same design philosophy.

For any new feature, define:

```txt
Primary question:
Primary action:
Primary data:
Secondary data:
Accent usage:
Empty state:
Completion/reward moment:
```

A feature should not introduce a new visual language unless it represents a fundamentally new product mode.

Examples of future product areas and expected treatment:

### Analytics

- restrained,
- few metrics at once,
- clear trend explanation,
- no dense dashboards by default.

### Program Editing

- stable,
- configuration-like,
- grouped controls,
- low accent usage.

### Sync / Account

- quiet,
- trust-focused,
- clear status,
- avoid technical noise.

### Achievements / PR

- rewarding,
- rare,
- visually stronger than normal UI,
- still not overly gamified.

### Web Console

- more spacious than mobile,
- still data-minimal,
- avoid enterprise dashboard clutter,
- preserve single-accent discipline.

---

## 20. Final Direction

OwnLift should not become more complex as it becomes more powerful.

The product should grow by:

- revealing data at the right time,
- improving hierarchy,
- strengthening core actions,
- making progress feel meaningful,
- keeping the interface calm.

The design standard is:

> fewer elements, clearer hierarchy, better guidance.
