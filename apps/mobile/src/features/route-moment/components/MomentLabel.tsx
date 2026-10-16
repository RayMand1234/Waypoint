import Animated from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { componentSize } from '@/theme/tokens';
import type { Point } from '@/shared/utils/bezier';
import { useAppear } from '../hooks/useAppear';
import type { MomentLabel as Label } from '../utils/momentContent';

// From route-moment.css: the just-finished pick fades in at 0.35s; "Next stop" at 2s.
const PICK_DELAY_MS = 350;
const PICK_DURATION_MS = 400;
const NEXT_DELAY_MS = 2000;
const NEXT_DURATION_MS = 500;
const RISE = componentSize['moment-label-appear-rise'];

type MomentLabelProps = {
  readonly label: Label;
  readonly point: Point;
  /** Labels sit left of checkpoints on the left side, right of those on the right. */
  readonly side: 'left' | 'right';
};

/** The words beside a checkpoint: the step and what was picked, "Next stop", or the step to come. */
export const MomentLabel = ({ label, point, side }: MomentLabelProps) => {
  const isQuiet = label.state === 'todo' || label.state === 'finish';
  const next = useAppear({
    delayMs: NEXT_DELAY_MS,
    durationMs: NEXT_DURATION_MS,
    fromY: RISE,
    isAnimated: label.state === 'target',
  });
  const pick = useAppear({
    delayMs: PICK_DELAY_MS,
    durationMs: PICK_DURATION_MS,
    fromY: RISE,
    isAnimated: label.state === 'just',
  });

  return (
    <Animated.View style={[styles.label(point, side, isQuiet), next]}>
      {label.top !== '' && (
        <Text
          variant={
            label.state === 'target' ? 'moment-next' : 'moment-label-top'
          }
          color={label.state === 'target' ? 'sunshine-400' : 'moment-muted'}
          align={side === 'left' ? 'right' : 'left'}
        >
          {label.state === 'target' ? label.top.toUpperCase() : label.top}
        </Text>
      )}
      <Animated.View style={pick}>
        <Text
          variant={isQuiet ? 'moment-label-todo' : 'moment-label'}
          color={isQuiet ? 'moment-muted' : 'on-midnight'}
          align={side === 'left' ? 'right' : 'left'}
          numberOfLines={1}
        >
          {label.main}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create((theme) => ({
  label: (point: Point, side: 'left' | 'right', isQuiet: boolean) => ({
    position: 'absolute',
    width: theme.size['moment-label-w'],
    // Two lines start further above the checkpoint's centre than one.
    top:
      point.y -
      (isQuiet
        ? theme.size['moment-label-rise-quiet']
        : theme.size['moment-label-rise']),
    left:
      side === 'left'
        ? point.x -
          theme.size['moment-label-gap'] -
          theme.size['moment-label-w']
        : point.x + theme.size['moment-label-gap'],
  }),
}));
