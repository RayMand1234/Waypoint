import type { TripDetail, TripStyle } from '@waypoint/contracts/trips';
import { tripDays } from '@/shared/utils/dates';
import { formatDateRange } from '@/shared/utils/format';
import { plural } from '@/shared/utils/text';

/** The one- or two-word name of each style on the Route. */
export const STYLE_SHORT_NAMES: Readonly<Record<TripStyle, string>> = {
  chill: 'Chill',
  trails: 'Trails',
  views: 'Views',
  culture: 'Culture',
  food: 'Food',
  beach: 'Beaches',
  night: 'Nightlife',
  family: 'Family',
};

const stylesPick = (styles: readonly TripStyle[]): string | undefined => {
  const [first, ...rest] = styles;

  if (first === undefined) return undefined;

  return rest.length === 0
    ? STYLE_SHORT_NAMES[first]
    : `${STYLE_SHORT_NAMES[first]} +${String(rest.length)}`;
};

/** What the traveler picked at each passed step, as the Route labels them: "Views +2", "Lisbon", "5 days". */
export const routePicks = (
  trip: Pick<
    TripDetail,
    'styles' | 'destinationName' | 'startDate' | 'endDate'
  >,
): string[] => {
  const picks = [
    stylesPick(trip.styles),
    trip.destinationName ?? undefined,
    trip.startDate === null || trip.endDate === null
      ? undefined
      : plural(tripDays(trip.startDate, trip.endDate), 'day'),
  ];
  const firstGap = picks.indexOf(undefined);

  return (firstGap === -1 ? picks : picks.slice(0, firstGap)).flatMap((pick) =>
    pick === undefined ? [] : [pick],
  );
};

/** The step header's title: "New waypoint", then "Lisbon", then "Lisbon · 12–16 May". */
export const tripTitle = (
  trip: Pick<TripDetail, 'destinationName' | 'startDate' | 'endDate'>,
): string => {
  if (trip.destinationName === null) return 'New waypoint';

  return trip.startDate === null || trip.endDate === null
    ? trip.destinationName
    : `${trip.destinationName} · ${formatDateRange(trip.startDate, trip.endDate)}`;
};
