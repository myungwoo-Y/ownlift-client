export const colors = {
  background: "#000000",
  surface: "#1C1C1E",
  surfaceElevated: "#232326",
  surfaceMuted: "#2C2C2E",
  surfaceGlass: "rgba(28, 28, 30, 0.78)",
  surfaceGlassStrong: "rgba(28, 28, 30, 0.94)",
  border: "#2C2C2E",
  borderStrong: "#3A3A3C",

  text: "#F5F5F7",
  textSecondary: "#98989F",
  textTertiary: "#6C6C70",

  primary: "#22C55E",
  primarySoft: "rgba(34, 197, 94, 0.16)",
  primaryForeground: "#061018",

  accent: "#22C55E",
  accentForeground: "#061018",

  success: "#22C55E",
  successForeground: "#061018",

  destructive: "#EF4444",
  destructiveForeground: "#0B0F16",

  transparent: "transparent",
} as const;

export const spacing = {
  "2xs": 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
} as const;

export const fontWeight = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

export const tokens = {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} as const;
