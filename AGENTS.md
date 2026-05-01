# OwnLift Agent Guide

OwnLift is an Expo / React Native program runner for structured barbell training.
The product should help a lifter know the next prescribed action, record it with
low friction, and trust that progression is handled correctly.

Before changing UI, read:

- `docs/ownlift-design.md` for product design direction and UI review rules.
- `docs/spec.md` for product scope, domain concepts, and MVP behavior.

UI implementation rules:

- Use design primitives and tokens from `apps/mobile/src/design`.
- Treat `apps/mobile/src/design/tokens.ts` as the raw token source of truth.
- Prefer semantic tokens such as `colors.primary`, `spacing["2xl"]`,
  `fontSize["3xl"]`, `borderRadius.xl`, and `motion.duration.fast`.
- Do not introduce raw colors, radii, spacing values, or shadows unless the
  existing tokens cannot express the intended hierarchy or interaction.
- Use the primary green only for primary action, current state, selected state,
  success, PR, or meaningful progress.
- Keep settings and configuration screens neutral and low-accent.
- Make training numbers easier to scan than labels or metadata.
- Prefer subtraction, clearer hierarchy, and progressive disclosure before adding
  more UI.

React Native rules:

- Use `StyleSheet.create` or existing local styling patterns.
- Use `Pressable` for pressable controls.
- Keep touch targets at least 44px when practical.
- Avoid list performance regressions; memoize list rows and stabilize callbacks
  when changing large or scroll-heavy lists.
