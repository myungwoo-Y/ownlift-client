export const colors = {
  background: "#FFFFFF",
  surface: "#F5F5F5",
  surfaceElevated: "#FFFFFF",
  border: "#E5E5E5",
  borderStrong: "#1A1A1A",

  text: "#1A1A1A",
  textSecondary: "#6B6B6B",
  textTertiary: "#9B9B9B",

  primary: "#1A1A1A",
  primaryForeground: "#FFFFFF",

  accent: "#F59E0B",
  accentForeground: "#FFFFFF",

  success: "#22C55E",
  successForeground: "#FFFFFF",

  destructive: "#EF4444",
  destructiveForeground: "#FFFFFF",

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
