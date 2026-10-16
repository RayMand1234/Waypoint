import { render, screen, userEvent } from '@testing-library/react-native';
import { OfferCard } from './OfferCard';

const offer = {
  title: 'TAP Air Portugal',
  meta: 'Direct · 5h 10m',
  price: '€ 189',
  unit: 'per person',
  onPress: jest.fn(),
};

describe('OfferCard', () => {
  it('reads as title and full price', async () => {
    await render(<OfferCard {...offer} />);

    expect(
      screen.getByRole('button', {
        name: 'TAP Air Portugal, € 189 per person',
      }),
    ).toBeOnTheScreen();
  });

  it('shows the best-value badge and savings delta on the best option', async () => {
    await render(
      <OfferCard
        {...offer}
        isBestValue
        isSelected
        badges={[{ kind: 'value', label: 'Best value' }]}
        delta={{ text: '−€84 vs avg', direction: 'down' }}
      />,
    );

    expect(screen.getByText('BEST VALUE')).toBeOnTheScreen();
    expect(screen.getByText('−€84 vs avg')).toBeOnTheScreen();
    expect(screen.getByRole('button')).toBeSelected();
  });

  it('shows where it is, and opens details from its own button', async () => {
    const onInfo = jest.fn();

    await render(
      <OfferCard
        {...offer}
        note="≈ 12 min to your spots"
        info={{ label: 'Details for TAP Air Portugal', onPress: onInfo }}
      />,
    );

    expect(screen.getByText('≈ 12 min to your spots')).toBeOnTheScreen();
    await userEvent
      .setup()
      .press(
        screen.getByRole('button', { name: 'Details for TAP Air Portugal' }),
      );
    expect(onInfo).toHaveBeenCalled();
  });
});
