import { colors, fonts, radius } from '@/theme';
import { useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Text } from './Text';

type CodeInputProps = {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  autoFocus?: boolean;
  /** 'sms-otp' for a texted code, 'one-time-code' for an emailed one. */
  autoComplete?: TextInputProps['autoComplete'];
};

/**
 * One real TextInput sits invisibly on top of N presentational boxes.
 *
 * N separate inputs is the obvious approach and it's wrong: backspace focus
 * jumping gets unpredictable, and OS autofill can only ever fill one field,
 * so the code arrives in box 1 and nowhere else. With a single input the OS
 * fills the whole code at once.
 */
export function CodeInput({
  value,
  onChange,
  length = 6,
  autoFocus = true,
  autoComplete = 'one-time-code',
}: CodeInputProps) {
  const inputRef = useRef<TextInput>(null);

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      style={styles.row}
      accessibilityLabel={`${length}-digit code`}
    >
      {Array.from({ length }, (_, index) => {
        const char = value[index] ?? '';
        const isActive = index === Math.min(value.length, length - 1);
        return (
          <View
            key={index}
            style={[styles.box, isActive && styles.boxActive]}
          >
            <Text style={styles.digit}>{char}</Text>
          </View>
        );
      })}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(next) => onChange(next.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={autoComplete}
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, position: 'relative' },
  box: {
    flex: 1,
    height: 64,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  digit: {
    fontFamily: fonts.displaySemi,
    fontSize: 20,
    color: colors.ink,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
});
