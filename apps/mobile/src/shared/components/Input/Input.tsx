import type { Ref } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '../Text';

export type InputProps = Omit<
  TextInputProps,
  'style' | 'placeholderTextColor'
> & {
  readonly label: string;
  readonly help?: string;
  /** Shown instead of `help`, with a danger outline. */
  readonly error?: string;
  readonly ref?: Ref<TextInput>;
};

/** A labelled text field. Prefer smart defaults — every field typed costs time. */
export const Input = ({
  label,
  help,
  error,
  ref,
  ...inputProps
}: InputProps) => {
  const { theme } = useUnistyles();
  const hasError = error !== undefined;

  styles.useVariants({ hasError });

  return (
    <View style={styles.field}>
      <Text variant="label">{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={error ?? help}
        placeholderTextColor={theme.colors['ink-muted']}
        maxFontSizeMultiplier={2}
        {...inputProps}
        style={styles.input}
      />
      {hasError ? (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : help === undefined ? null : (
        <Text variant="caption" color="ink-muted">
          {help}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  field: {
    gap: theme.space[1],
  },
  input: {
    ...theme.typography.body,
    minHeight: theme.size['control-h'],
    paddingHorizontal: theme.space[4],
    borderWidth: theme.size.hairline,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors['surface-card'],
    color: theme.colors.ink,
    variants: {
      hasError: {
        true: { borderColor: theme.colors.danger },
        false: { borderColor: theme.colors['border-strong'] },
      },
    },
  },
}));
