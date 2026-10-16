import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Text } from '@/shared/components';
import { componentSize } from '@/theme/tokens';
import { useAppear } from '../hooks/useAppear';
import type { MomentContent } from '../utils/momentContent';
import { MomentTask } from './MomentTask';

// From route-moment.css: the card rises at 0.35s; Continue fades in when ready.
const SHEET_DELAY_MS = 350;
const SHEET_DURATION_MS = 500;
const CONTINUE_DURATION_MS = 400;

type MomentSheetProps = {
  readonly content: MomentContent;
  readonly tasksDone: number;
  readonly canContinue: boolean;
  readonly onContinue: () => void;
};

/** The white card: what Waypoint is doing for the next step, then the way on. */
export const MomentSheet = ({
  content,
  tasksDone,
  canContinue,
  onContinue,
}: MomentSheetProps) => {
  const sheet = useAppear({
    delayMs: SHEET_DELAY_MS,
    durationMs: SHEET_DURATION_MS,
    fromY: componentSize['moment-sheet-appear-rise'],
  });
  // Continue is always mounted (see useAppear), hidden and inert until ready.
  const action = useAppear({
    durationMs: CONTINUE_DURATION_MS,
    isShown: canContinue,
  });

  return (
    <Animated.View style={[styles.sheet, sheet]}>
      <Text variant="body-strong">{content.sheetTitle}</Text>
      <View style={styles.tasks} accessibilityLiveRegion="polite">
        {content.tasks.map((task, index) => (
          <MomentTask key={task} text={task} isDone={index < tasksDone} />
        ))}
      </View>
      <Animated.View
        style={[styles.action, action]}
        pointerEvents={canContinue ? 'auto' : 'none'}
        accessibilityElementsHidden={!canContinue}
        importantForAccessibility={canContinue ? 'auto' : 'no-hide-descendants'}
      >
        <Button label={content.go} isBlock onPress={onContinue} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  sheet: {
    gap: theme.space[3],
    marginHorizontal: theme.space[4],
    marginBottom: theme.space[6] + rt.insets.bottom,
    padding: theme.space[4],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors['surface-card'],
    boxShadow: theme.shadow.raised,
  },
  tasks: {
    gap: theme.space[2] + theme.size['focus-ring'],
  },
  action: {
    minHeight: theme.size['control-h'],
  },
}));
