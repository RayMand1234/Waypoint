import { useState } from 'react';
import { OfferCard, TripSummaryBar } from '@/shared/components';
import { GallerySection } from './GallerySection';

const noop = (): void => undefined;

// Sample data: Tel Aviv → Lisbon, 12–16 May, 2 adults. Names and prices are placeholders.
const OFFERS = [
  {
    id: 'tap',
    title: 'TAP Air Portugal',
    meta: 'Direct · 5h 10m · 1 checked bag',
    price: '€ 189',
    delta: { text: '−€84 vs avg', direction: 'down' as const },
    isBestValue: true,
  },
  {
    id: 'iberia',
    title: 'Iberia',
    meta: '1 stop in Madrid · 8h 20m',
    price: '€ 214',
    delta: { text: '+€25 vs best', direction: 'up' as const },
    isBestValue: false,
  },
] as const;

/** OfferCard (best value, selected, plain) and the TripSummaryBar. */
export const OffersDemo = () => {
  const [selected, setSelected] = useState<string>('tap');

  return (
    <>
      <GallerySection title="OfferCard">
        {OFFERS.map((offer) => (
          <OfferCard
            key={offer.id}
            title={offer.title}
            meta={offer.meta}
            price={offer.price}
            unit="per person"
            delta={offer.delta}
            isBestValue={offer.isBestValue}
            isSelected={selected === offer.id}
            badges={
              offer.isBestValue ? [{ kind: 'value', label: 'Best value' }] : []
            }
            onPress={() => {
              setSelected(offer.id);
            }}
          />
        ))}
      </GallerySection>
      <GallerySection title="TripSummaryBar">
        <TripSummaryBar
          tripLine="Lisbon · 12–16 May · 2 travelers"
          total="€ 880"
          completedSteps={4}
          buttonLabel="Continue to stay"
          onButtonPress={noop}
        />
      </GallerySection>
    </>
  );
};
