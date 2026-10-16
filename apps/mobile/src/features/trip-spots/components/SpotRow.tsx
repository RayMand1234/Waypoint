import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Badge, Text } from '@/shared/components';

type SpotRowProps = {
  readonly name: string;
  readonly meta: string;
  readonly isTopPick: boolean;
  readonly isSelected: boolean;
  readonly isFirst: boolean;
  readonly onPress: () => void;
};

/** One recommended spot with a checkbox: name, what it suits and how long it takes. */
export const SpotRow = ({
  name,
  meta,
  isTopPick,
  isSelected,
  isFirst,
  onPress,
}: SpotRowProps) => {
  const { theme } = useUnistyles();

  styles.useVariants({ isFirst, isSelected });

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={`${name}. ${meta}${isTopPick ? '. Top pick' : ''}`}
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.box}>
        {isSelected && (
          <Check
            size={theme.size['icon-sm']}
            strokeWidth={theme.size['icon-stroke-bold']}
            color={theme.colors['on-midnight']}
          />
        )}
      </View>
      <View style={styles.text}>
        <Text variant="body-strong">{name}</Text>
        <Text variant="caption" color="ink-muted">
          {meta}
        </Text>
      </View>
      {isTopPick && <Badge kind="neutral" label="Top pick" />}
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    minHeight: theme.size['spot-row-h'],
    paddingVertical: theme.space[2],
    paddingHorizontal: theme.space[3],
    variants: {
      // Rows after the first are divided by a hairline.
      isFirst: {
        true: {},
        false: {
          borderTopWidth: theme.size.hairline,
          borderColor: theme.colors.border,
        },
      },
    },
  },
  box: {
    width: theme.size.checkbox,
    height: theme.size.checkbox,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    variants: {
      isSelected: {
        true: { backgroundColor: theme.colors['midnight-900'] },
        false: {
          backgroundColor: theme.colors['surface-card'],
          borderWidth: theme.size['checkbox-border'],
          borderColor: theme.colors['border-strong'],
        },
      },
    },
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: theme.size['focus-ring'],
  },
}));
