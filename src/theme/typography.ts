import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';
import type { TextStyle } from 'react-native';

/**
 * Passed to useFonts() in the root layout. The keys become the strings you
 * use as fontFamily — React Native has no concept of a font "weight" for a
 * custom face, so each weight is a separate family.
 */
export const fontAssets = {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
};

export const fonts = {
  displayMedium: 'SpaceGrotesk_500Medium',
  displaySemi: 'SpaceGrotesk_600SemiBold',
  displayBold: 'SpaceGrotesk_700Bold',
  bodyRegular: 'Poppins_400Regular',
  bodyMedium: 'Poppins_500Medium',
  bodySemi: 'Poppins_600SemiBold',
} as const;

/**
 * lineHeight and letterSpacing are absolute points in RN, not ratios or em.
 * The README gives ratios/em, so they're converted here once:
 *   lineHeight    = round(fontSize * ratio)
 *   letterSpacing = fontSize * em
 */
export const text = {
  onboardingH1: {
    fontFamily: fonts.displaySemi,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.6,
  },
  authH1: {
    fontFamily: fonts.displaySemi,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.56,
  },
  tabH1: {
    fontFamily: fonts.displaySemi,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.52,
  },
  stepH1: {
    fontFamily: fonts.displaySemi,
    fontSize: 24,
    lineHeight: 29,
  },
  sectionH2: {
    fontFamily: fonts.displaySemi,
    fontSize: 17,
    lineHeight: 20,
  },
  premiumHero: {
    fontFamily: fonts.displaySemi,
    fontSize: 46,
    lineHeight: 46,
    letterSpacing: -1.38,
  },
  policyAmount: {
    fontFamily: fonts.displaySemi,
    fontSize: 32,
    lineHeight: 32,
    letterSpacing: -0.64,
  },
  productPrice: {
    fontFamily: fonts.displaySemi,
    fontSize: 20,
    lineHeight: 24,
  },
  code: {
    fontFamily: fonts.displaySemi,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 1.44,
  },
  bodyLarge: {
    fontFamily: fonts.bodyRegular,
    fontSize: 16,
    lineHeight: 25,
  },
  body: {
    fontFamily: fonts.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySm: {
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    lineHeight: 21,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    lineHeight: 20,
  },
  tabLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    lineHeight: 13,
  },
  pill: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    lineHeight: 14,
  },
  wordmark: {
    fontFamily: fonts.displayBold,
    fontSize: 19,
    lineHeight: 23,
    letterSpacing: -0.57,
  },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof text;
