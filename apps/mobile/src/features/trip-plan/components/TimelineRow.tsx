import { ArrowLeftRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import type { TimelineItem } from '../utils/planModel';

/**
 * One stop on the day's line: how you get there, the time, a dot, and its
 * card. Spots are solid with a yellow dot and can be edited; the fixed moments
 * around them (landing, lunch, the airport) are dashed.
 */
export const TimelineRow = ({
  item,
  onEdit,
}: {
  readonly item: TimelineItem;
  readonly onEdit: (spotId: string) => void;
}) => {
  const { theme } = useUnistyles();
  const { spotId } = item;

  styles.useVariants({ isSpot: item.isSpot });

  return (
    <View>
      {item.travel !== null && (
        <View style={styles.travel}>
          <View style={styles.time} />
          <View style={styles.railColumn}>
            <View style={styles.rail} />
          </View>
          <Text variant="caption" color="ink-muted">
            {item.travel}
          </Text>
        </View>
      )}
      <View style={styles.row}>
        <View style={styles.time}>
          <Text variant="label" tabular>
            {item.time}
          </Text>
        </View>
        <View style={styles.dot} />
        <View style={styles.card}>
          <View style={styles.text}>
            <Text variant="body-strong">{item.name}</Text>
            <Text variant="caption" color="ink-muted">
              {item.meta}
            </Text>
          </View>
          {spotId !== null && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Move or remove ${item.name}`}
              onPress={() => {
                onEdit(spotId);
              }}
              style={styles.edit}
            >
              <ArrowLeftRight
                size={theme.size['icon-sm']}
                strokeWidth={theme.size['icon-stroke']}
                color={theme.colors['ink-muted']}
              />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  travel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    height: theme.size['plan-travel-h'],
  },
  railColumn: {
    width: theme.size['plan-dot'],
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  rail: {
    flex: 1,
    borderLeftWidth: theme.size['plan-rail'],
    borderStyle: 'dashed',
    borderColor: theme.colors['border-strong'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  time: {
    width: theme.size['plan-time-w'],
  },
  dot: {
    width: theme.size['plan-dot'],
    height: theme.size['plan-dot'],
    borderRadius: theme.radius.full,
    borderWidth: theme.size['plan-dot-border'],
    borderColor: theme.colors['midnight-900'],
    variants: {
      isSpot: {
        true: { backgroundColor: theme.colors['sunshine-400'] },
        false: { backgroundColor: theme.colors['surface-card'] },
      },
    },
  },
  card: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    paddingVertical: theme.space[2],
    paddingLeft: theme.space[3],
    paddingRight: theme.space[2],
    borderRadius: theme.radius.md,
    borderWidth: theme.size.hairline,
    borderColor: theme.colors.border,
    variants: {
      isSpot: {
        true: {
          backgroundColor: theme.colors['surface-card'],
          boxShadow: theme.shadow.card,
        },
        false: {
          backgroundColor: 'transparent',
          borderStyle: 'dashed',
        },
      },
    },
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: theme.size['focus-ring'],
  },
  edit: {
    width: theme.size['tap-min'],
    height: theme.size['tap-min'],
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
