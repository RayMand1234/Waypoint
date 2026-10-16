import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '../Text';

export type ButtonKind = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = {
  /** Says what happens next: "Continue to stay", not "OK". */
  readonly label: string;
  readonly onPress: () => void;
  readonly kind?: ButtonKind;
  /** Full width (mobile). */
  readonly isBlock?: boolean;
  /** The step isn't complete yet. */
  readonly isDisabled?: boolean;
  /** Shows a spinner and blocks presses while the action runs. */
  readonly isLoading?: boolean;
  readonly icon?: ReactNode;
  readonly accessibilityHint?: string;
};

/** One primary button per screen. Never sunshine — sunshine only means best value. */
export const Button = ({
  label,
  onPress,
  kind = 'primary',
  isBlock = false,
  isDisabled = false,
  isLoading = false,
  icon,
  accessibilityHint,
}: ButtonProps) => {
  const { theme } = useUnistyles();
  const isInactive = isDisabled || isLoading;

  styles.useVariants({ kind, isBlock, isDisabled: isInactive });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isInactive, busy: isLoading }}
      disabled={isInactive}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {isLoading ? (
        <ActivityIndicator
          color={
            kind === 'primary'
              ? theme.colors['on-midnight']
              : theme.colors['midnight-900']
          }
        />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text variant="label" color={labelColor(kind, isInactive)}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const labelColor = (kind: ButtonKind, isDisabled: boolean) => {
  if (isDisabled) return 'ink-muted' as const;

  return kind === 'primary'
    ? ('on-midnight' as const)
    : ('midnight-900' as const);
};

const styles = StyleSheet.create((theme) => ({
  button: {
    minHeight: theme.size['control-h'],
    paddingHorizontal: theme.space[6],
    borderRadius: theme.radius.md,
    borderWidth: theme.size.hairline,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      kind: {
        primary: { backgroundColor: theme.colors['midnight-900'] },
        secondary: { backgroundColor: theme.colors['midnight-100'] },
        ghost: { backgroundColor: 'transparent' },
      },
      isBlock: {
        true: { alignSelf: 'stretch' },
        false: { alignSelf: 'flex-start' },
      },
      isDisabled: {
        true: { backgroundColor: theme.colors.border },
      },
    },
  },
  pressed: {
    variants: {
      kind: {
        primary: { backgroundColor: theme.colors['midnight-700'] },
        secondary: { borderColor: theme.colors['midnight-900'] },
        ghost: { backgroundColor: theme.colors['midnight-100'] },
      },
    },
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
  },
}));
