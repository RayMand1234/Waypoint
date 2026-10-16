import type { FlightSearchRequest } from '@waypoint/contracts/flights';
import { formatParty } from '@/shared/utils/format';

/** Under the question: "Round trip TLV ⇄ JFK · 2 adults · 1 child". */
export const flightHint = (
  request: FlightSearchRequest | undefined,
  childrenAges: readonly number[],
): string | undefined =>
  request === undefined
    ? undefined
    : `${request.returnDate === null ? `One way ${request.origin} → ${request.destination}` : `Round trip ${request.origin} ⇄ ${request.destination}`} · ${formatParty(request.adults, childrenAges)}`;
