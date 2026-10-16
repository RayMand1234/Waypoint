import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { componentSize, size } from '@/theme/tokens';
import { Text } from '../Text';

export type ChipProps = {
  /** One to three words. */
  readonly label: string;
  readonly isSelected: boolean;
  readonly onPress: () => void;
  readonly icon?: ReactNode;
};

// The chip is drawn 36pt tall; the slop brings its touch area to tap-min (44).
const SLOP = (size['tap-min'] - componentSize['chip-h']) / 2;
const HIT_SLOP = { top: SLOP, bottom: SLOP, left: 0, right: 0 };

/** A filter or multi-select preference. Never a primary action. */
export const Chip = ({ label, isSelected, onPress, icon }: ChipProps) => {
  styles.useVariants({ isSelected });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      hitSlop={HIT_SLOP}
      onPress={onPress}
      style={styles.chip}
    >
      {icon}
      <Text variant="label" color={isSelected ? 'midnight-900' : 'ink'}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.space[1],
    minHeight: theme.size['chip-h'],
    paddingHorizontal: theme.space[3],
    borderWidth: theme.size.hairline,
    borderRadius: theme.radius.full,
    variants: {
      isSelected: {
        true: {
          backgroundColor: theme.colors['midnight-100'],
          borderColor: theme.colors['midnight-900'],
        },
        false: {
          backgroundColor: theme.colors['surface-card'],
          borderColor: theme.colors['border-strong'],
        },
      },
    },
  },
}));
