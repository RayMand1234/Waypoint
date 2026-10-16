import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Route, Text } from '@/shared/components';
import {
  PLANNING_STEP_COUNT,
  STEP_NAMES,
  stepNumber,
  type StepKey,
} from '../utils/steps';
import { StepHeader } from './StepHeader';

type StepLayoutProps = {
  readonly step: StepKey;
  /** Header title — the trip so far. */
  readonly tripTitle: string;
  /** Route labels for the passed steps. */
  readonly picks: readonly string[];
  /** The step's one question, in `title-lg`. */
  readonly question: string;
  readonly hint?: string;
  readonly onBack: () => void;
  readonly onClose: () => void;
  readonly onCheckpointPress?: (step: number) => void;
  readonly footer: ReactNode;
  readonly children: ReactNode;
};

/** Every planning step: header, the Route, one question, the step's content, and its pinned footer. */
export const StepLayout = ({
  step,
  tripTitle,
  picks,
  question,
  hint,
  onBack,
  onClose,
  onCheckpointPress,
  footer,
  children,
}: StepLayoutProps) => (
  <View style={styles.screen}>
    <View style={styles.header}>
      <StepHeader title={tripTitle} onBack={onBack} onClose={onClose} />
      <Route
        step={Math.min(stepNumber(step), PLANNING_STEP_COUNT)}
        stepName={STEP_NAMES[step]}
        picks={picks}
        {...(onCheckpointPress === undefined ? {} : { onCheckpointPress })}
      />
    </View>
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.question}>
        <Text variant="title-lg" accessibilityRole="header">
          {question}
        </Text>
        {hint !== undefined && <Text color="ink-muted">{hint}</Text>}
      </View>
      {children}
    </ScrollView>
    {footer}
  </View>
);

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    gap: theme.space[2],
    paddingTop: rt.insets.top + theme.space[2],
    paddingHorizontal: theme.space[4],
  },
  content: {
    gap: theme.space[6],
    paddingTop: theme.space[6],
    paddingHorizontal: theme.space[4],
    paddingBottom: theme.space[8],
    width: '100%',
    maxWidth: theme.size['content-max'],
    alignSelf: 'center',
  },
  question: {
    gap: theme.space[1],
  },
}));
