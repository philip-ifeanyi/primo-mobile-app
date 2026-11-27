/**
 * Design tokens from design_handoff_primo_mobile/README.md.
 * Every colour, radius and spacing value in the app comes from here.
 */

export const colors = {
  primary: '#0076B5',
  primaryDeep: '#043FAE',
  ink: '#1D2541',
  textMuted: '#68757C',
  textFaint: '#A9B4BA',
  surface: '#FFFFFF',
  canvas: '#F5F6F7',
  field: '#F1F5F7',
  border: '#E6E9EB',
  borderStrong: '#D8DDE1',
  success: '#A0ED8C',
  successInk: '#14401C',
  successTint: '#EDFBEA',
  accent: '#F4DA7B',
  accentInk: '#4A3B00',
  danger: '#E5484D',
  scrim: 'rgba(29,37,65,0.45)',
  cameraBg: '#0B0F1A',
  uploadTint: '#F4F9FC',
} as const;

/** Named steps keep call sites readable; the raw scale is 4-24. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  bar: 6,
  thumb: 8,
  tile: 12,
  input: 14,
  button: 16,
  card: 18,
  cardLg: 20,
  hero: 22,
  art: 24,
  sheet: 28,
  pill: 99,
} as const;

/** Fixed sizes the spec calls out explicitly. */
export const sizes = {
  buttonHeight: 54,
  inputHeight: 54,
  hitArea: 44,
  screenPaddingFlow: 16,
  screenPaddingAuth: 20,
  progressHeight: 7,
} as const;

export type ColorToken = keyof typeof colors;
