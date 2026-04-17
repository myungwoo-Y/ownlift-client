---
title: Use Native Kit for Shell Widgets
impact: HIGH
impactDescription: platform consistency, accessibility, native gestures
tags: native-kit, modal, header, drawer, navigation, ui
---

## Use Native Kit for Shell Widgets

For shell widgets such as modals, headers, drawers, sheets, tab bars, and
menus, prefer the project's Native Kit primitives first. If Native Kit does not
cover the use case, fall back to platform-native APIs like React Navigation's
native stack/header and `formSheet` presentation before building a custom JS
widget.

These widgets sit on top of system gestures, safe areas, keyboard avoidance,
back handling, and accessibility semantics. Hand-rolled JS chrome usually drifts
from platform behavior and is harder to maintain.

**Incorrect (custom JS shell widgets):**

```tsx
function ProfileScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </Animated.View>

      {drawerOpen ? (
        <Animated.View style={styles.drawer}>
          <SettingsPanel />
        </Animated.View>
      ) : null}

      {sheetOpen ? (
        <Animated.View style={styles.sheet}>
          <EditProfileForm />
        </Animated.View>
      ) : null}

      <ProfileContent />
    </View>
  )
}
```

**Correct (native header + native modal, native drawer when available):**

```tsx
import { Stack } from 'expo-router'
import { Modal, View } from 'react-native'

export function ProfileLayout() {
  return (
    <Stack.Screen
      options={{
        title: 'Profile',
        headerLargeTitleEnabled: true,
        headerSearchBarOptions: {
          placeholder: 'Search',
        },
      }}
    />
  )
}

function ProfileScreen() {
  const [editorOpen, setEditorOpen] = useState(false)

  return (
    <View style={{ flex: 1 }}>
      <ProfileContent />
      <Modal
        visible={editorOpen}
        presentationStyle='formSheet'
        onRequestClose={() => setEditorOpen(false)}
      >
        <EditProfileForm />
      </Modal>
    </View>
  )
}
```

Use this fallback order for app chrome:

- **First:** Native Kit primitives already adopted by the project
- **Second:** platform-native APIs such as native stack headers, native tabs, or
  native form sheets
- **Last resort:** custom JS implementations only when no acceptable native
  primitive exists

For drawers and side panels specifically, prefer a Native Kit drawer or a
navigator-provided drawer/split-view primitive over an absolutely positioned
`Animated.View` overlay.

Reference:

- [React Navigation Native Stack](https://reactnavigation.org/docs/native-stack-navigator)
- [React Native Modal](https://reactnative.dev/docs/modal)
- [Expo Router Native Tabs](https://docs.expo.dev/router/advanced/native-tabs)
