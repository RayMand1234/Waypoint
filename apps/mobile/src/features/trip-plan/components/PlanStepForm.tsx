import type { Spot } from '@waypoint/contracts/destinations';
import type { TripDetail } from '@waypoint/contracts/trips';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import {
  routePicks,
  StepFooter,
  StepLayout,
  tripTitle,
} from '@/features/trip-flow';
import { Button, Text } from '@/shared/components';
import { plural } from '@/shared/utils/text';
import { usePlanStep } from '../hooks/usePlanStep';
import { dayMeta, dayTab } from '../utils/planModel';
import { DayTabs } from './DayTabs';
import { DayTimeline } from './DayTimeline';
import { NotPlanned } from './NotPlanned';
import { StopActionsSheet } from './StopActionsSheet';

/** Step 6: the days, built around the spots, the stay and the flights. */
export const PlanStepForm = ({
  trip,
  spots,
}: {
  readonly trip: TripDetail;
  readonly spots: readonly Spot[];
}) => {
  const { theme } = useUnistyles();
  const step = usePlanStep(trip, spots);
  const { day } = step;
  const spotCount = trip.days.reduce(
    (sum, d) => sum + d.stops.filter((stop) => stop.kind === 'spot').length,
    0,
  );

  return (
    <StepLayout
      step="plan"
      tripTitle={tripTitle(trip)}
      picks={routePicks(trip)}
      question={`Your ${String(trip.days.length)}-day plan`}
      hint={`We built it around your ${plural(spotCount, 'spot')}. Move or remove anything.`}
      onBack={step.navigation.back}
      onClose={step.navigation.close}
      footer={
        <StepFooter
          caption="Your plan"
          value={`${plural(trip.days.length, 'day')} · ${plural(spotCount, 'stop')}`}
          action={{
            label: 'Review trip',
            onPress: () => {
              step.navigation.finish('plan');
            },
            isDisabled: day === undefined,
            isLoading: step.isBuilding,
          }}
          {...(step.error === undefined ? {} : { error: step.error })}
        />
      }
    >
      {day === undefined ? (
        <View style={styles.status}>
          <ActivityIndicator
            animating={step.isBuilding}
            hidesWhenStopped
            color={theme.colors['midnight-900']}
          />
          <Text color="ink-muted" align="center">
            {step.isBuilding
              ? 'Building your days…'
              : 'No days to plan yet. Check your dates in step 3.'}
          </Text>
        </View>
      ) : (
        <>
          <DayTabs
            days={step.days}
            shownIndex={step.shownIndex}
            onShow={step.show}
          />
          <DayTimeline
            day={day}
            meta={dayMeta(day, trip.pace)}
            spotsById={step.spotsById}
            onEdit={step.edit}
          />
          <NotPlanned
            spots={step.notPlanned}
            dayLabel={dayTab(day, step.shownIndex).label}
            onAdd={step.addBack}
          />
          <Button
            label="Rebuild the plan"
            kind="ghost"
            onPress={step.rebuild}
          />
        </>
      )}
      {step.editing !== undefined && day !== undefined && (
        <StopActionsSheet
          stop={step.editing}
          days={step.days}
          currentDate={day.date}
          onMove={step.move}
          onRemove={step.remove}
          onClose={step.stopEditing}
        />
      )}
    </StepLayout>
  );
};

const styles = StyleSheet.create((theme) => ({
  status: {
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[8],
  },
}));
