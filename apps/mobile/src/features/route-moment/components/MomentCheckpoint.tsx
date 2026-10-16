import { Check } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { Point } from '@/shared/utils/bezier';
import { componentSize } from '@/theme/tokens';
import { useAppear } from '../hooks/useAppear';
import type { CheckpointState } from '../utils/momentContent';

// The finished checkpoint pops in with a small overshoot (route-moment.css: rm-pop).
const POP_EASING = Easing.bezier(0.3, 1.5, 0.5, 1);
const POP_FROM = 0.3;
const POP_DELAY_MS = 150;
const POP_DURATION_MS = 450;

/** Each state's diameter — the dot is centred on its point. */
const DIAMETER: Readonly<Record<CheckpointState, number>> = {
  done: componentSize['moment-cp-done'],
  just: componentSize['moment-cp-just'],
  target: componentSize['moment-cp-target'],
  todo: componentSize['moment-cp-todo'],
  finish: componentSize['moment-cp-target'],
};

/** One checkpoint on the moment's road; the one just finished pops in with a check. */
export const MomentCheckpoint = ({
  state,
  point,
}: {
  readonly state: CheckpointState;
  readonly point: Point;
}) => {
  const { theme } = useUnistyles();
  const pop = useAppear({
    delayMs: POP_DELAY_MS,
    durationMs: POP_DURATION_MS,
    fromScale: POP_FROM,
    easing: POP_EASING,
    isAnimated: state === 'just',
  });

  styles.useVariants({ state });

  return (
    <Animated.View
      style={[styles.checkpoint, styles.place(point, DIAMETER[state]), pop]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {state === 'just' && (
        <Check
          size={theme.size['moment-check']}
          strokeWidth={theme.size['icon-stroke-heavy']}
          color={theme.colors['midnight-900']}
        />
      )}
      {state === 'finish' && <View style={styles.finishDot} />}
    </Animated.View>
  );
};

const styles = StyleSheet.create((theme) => ({
  checkpoint: {
    position: 'absolute',
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      state: {
        done: { backgroundColor: theme.colors['sunshine-400'] },
        just: { backgroundColor: theme.colors['sunshine-400'] },
        target: {
          backgroundColor: theme.colors['midnight-900'],
          borderWidth: theme.size['moment-cp-target-border'],
          borderColor: theme.colors['on-midnight'],
        },
        todo: {
          backgroundColor: theme.colors['midnight-900'],
          borderWidth: theme.size['moment-cp-todo-border'],
          borderColor: theme.colors['moment-todo'],
        },
        finish: {
          backgroundColor: theme.colors['midnight-900'],
          borderWidth: theme.size['moment-cp-todo-border'],
          borderColor: theme.colors['moment-todo'],
        },
      },
    },
  },
  /** Where the dot sits: centred on its point on the road. */
  place: (point: Point, diameter: number) => ({
    left: point.x - diameter / 2,
    top: point.y - diameter / 2,
    width: diameter,
    height: diameter,
  }),
  finishDot: {
    width: theme.size['moment-finish-dot'],
    height: theme.size['moment-finish-dot'],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors['moment-todo'],
  },
}));
