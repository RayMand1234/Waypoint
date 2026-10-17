import { render, screen, userEvent } from '@testing-library/react-native';
import { tripListItemSchema } from '@waypoint/contracts/trips';
import { toTripCard } from '../utils/tripCardModel';
import { TripPostcard } from './TripPostcard';

const card = (status: 'draft' | 'booked') =>
  toTripCard(
    tripListItemSchema.parse({
      id: '6f0c6f3a-3c55-4b8e-9a8a-1f1b2c3d4e5f',
      status,
      styles: ['views'],
      pace: 'balanced',
      destinationId: 'lisbon',
      destinationName: 'Lisbon',
      startDate: '2027-05-12',
      endDate: '2027-05-16',
      adults: 2,
      originAirport: 'TLV',
      childrenAges: [],
      updatedAt: '2027-04-01T10:00:00.000Z',
      planDays: 0,
      selections: [],
      destinationPhoto: null,
    }),
  );

describe('TripPostcard', () => {
  it('deletes a draft from its trash button, without opening it', async () => {
    const onPress = jest.fn();
    const onDelete = jest.fn();

    await render(
      <TripPostcard
        card={card('draft')}
        onPress={onPress}
        onDelete={onDelete}
      />,
    );
    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Delete draft Lisbon' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('has no trash button on a trip that is not a draft', async () => {
    await render(
      <TripPostcard
        card={card('booked')}
        onPress={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Delete draft Lisbon' }),
    ).not.toBeOnTheScreen();
  });
});
