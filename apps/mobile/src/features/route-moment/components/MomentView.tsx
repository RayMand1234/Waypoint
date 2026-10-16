import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { componentSize } from '@/theme/tokens';
import type {
  FinishedStep,
  MomentContent,
  MomentLabel,
} from '../utils/momentContent';
import { CHECKPOINTS, type MomentLayout } from '../utils/momentGeometry';
import { MomentMap } from './MomentMap';
import { MomentSheet } from './MomentSheet';
import { PLANNING_STEP_COUNT } from '@/shared/constants/planning';

/** Room above the first and below the last checkpoint, for their labels. */
const MAP_PADDING = componentSize['moment-map-padding'];

type MomentViewProps = {
  readonly step: FinishedStep;
  readonly content: MomentContent;
  readonly labels: readonly MomentLabel[];
  readonly tasksDone: number;
  readonly canContinue: boolean;
  readonly reduceMotion: boolean;
  readonly onContinue: () => void;
};

/** The route moment: where you are on the whole trip, while the next step is prepared. */
export const MomentView = ({
  step,
  content,
  labels,
  tasksDone,
  canContinue,
  reduceMotion,
  onContinue,
}: MomentViewProps) => {
  const [size, setSize] = useState<{
    readonly width: number;
    readonly height: number;
  } | null>(null);
  // The design spaces checkpoints 72pt apart; shorter screens squeeze them to fit.
  const layout: MomentLayout | null =
    size === null
      ? null
      : {
          width: size.width,
          top: MAP_PADDING,
          spacing: Math.min(
            componentSize['moment-spacing'],
            (size.height - 2 * MAP_PADDING) / (CHECKPOINTS - 1),
          ),
        };

  const onLayout = (event: LayoutChangeEvent): void => {
    setSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  };

  return (
    <View
      style={styles.screen}
      accessibilityLabel={`Checkpoint ${String(step)} of ${String(PLANNING_STEP_COUNT)}. ${content.title}`}
    >
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text variant="overline" color="sunshine-400">
          {`CHECKPOINT ${String(step)} OF ${String(PLANNING_STEP_COUNT)}`}
        </Text>
        <Text
          variant="moment-title"
          color="on-midnight"
          accessibilityRole="header"
        >
          {content.title}
        </Text>
      </View>
      <View style={styles.map} onLayout={onLayout}>
        {layout !== null && size !== null && (
          <MomentMap
            layout={layout}
            height={size.height}
            step={step}
            labels={labels}
            reduceMotion={reduceMotion}
          />
        )}
      </View>
      <MomentSheet
        content={content}
        tasksDone={tasksDone}
        canContinue={canContinue}
        onContinue={onContinue}
      />
    </View>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors['midnight-900'],
  },
  header: {
    gap: theme.space[1],
    paddingTop: rt.insets.top + theme.space[4],
    paddingHorizontal: theme.space[6],
  },
  map: {
    flex: 1,
  },
}));
