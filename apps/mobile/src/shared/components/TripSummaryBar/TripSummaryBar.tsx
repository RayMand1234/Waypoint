import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../Button';
import { Text } from '../Text';
import { PLANNING_STEP_COUNT } from '../../constants/planning';

export type TripSummaryBarProps = {
  /** "Lisbon · 12–16 May · 2 travelers". */
  readonly tripLine: string;
  /** Everything chosen so far, formatted: "€ 1,190". */
  readonly total: string;
  /** 0–6. */
  readonly completedSteps: number;
  readonly buttonLabel: string;
  readonly onButtonPress: () => void;
  readonly isButtonDisabled?: boolean;
  /** Opens the full breakdown. */
  readonly onInfoPress?: () => void;
};

/** Pinned to the bottom of each step from the day plan on: the trip so far and the one primary action. */
export const TripSummaryBar = ({
  tripLine,
  total,
  completedSteps,
  buttonLabel,
  onButtonPress,
  isButtonDisabled = false,
  onInfoPress,
}: TripSummaryBarProps) => (
  <View style={styles.bar}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${tripLine}. Total ${total}. ${String(completedSteps)} of ${String(PLANNING_STEP_COUNT)} steps done.`}
      accessibilityHint="Shows the price breakdown"
      disabled={onInfoPress === undefined}
      onPress={onInfoPress}
      style={styles.info}
    >
      <Text variant="caption" color="ink-muted" numberOfLines={1}>
        {tripLine}
      </Text>
      <Text variant="price-lg" tabular>
        {total}
      </Text>
      <View style={styles.steps}>
        {Array.from({ length: PLANNING_STEP_COUNT }, (_, index) => (
          <View key={index} style={styles.dot(index < completedSteps)} />
        ))}
      </View>
    </Pressable>
    <Button
      label={buttonLabel}
      onPress={onButtonPress}
      isDisabled={isButtonDisabled}
    />
  </View>
);

const styles = StyleSheet.create((theme, rt) => ({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space[4],
    paddingTop: theme.space[3],
    paddingHorizontal: theme.space[4],
    paddingBottom: theme.space[3] + rt.insets.bottom,
    backgroundColor: theme.colors['surface-card'],
    borderTopWidth: theme.size.hairline,
    borderColor: theme.colors.border,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    boxShadow: theme.shadow.bar,
  },
  info: {
    flexShrink: 1,
    minWidth: 0,
  },
  steps: {
    flexDirection: 'row',
    gap: theme.space[1],
  },
  dot: (isDone: boolean) => ({
    width: theme.size['summary-dot'],
    height: theme.size['summary-dot'],
    borderRadius: theme.radius.full,
    backgroundColor: isDone
      ? theme.colors.savings
      : theme.colors['border-strong'],
  }),
}));
