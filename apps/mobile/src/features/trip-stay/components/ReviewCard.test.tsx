import {
  fireEvent,
  render,
  screen,
  userEvent,
} from '@testing-library/react-native';
import { isoDateTimeSchema } from '@waypoint/contracts/common';
import { ReviewCard } from './ReviewCard';

const review = {
  score: 10,
  name: 'Zeynep',
  countryCode: null,
  travelerType: 'solo' as const,
  date: isoDateTimeSchema.parse('2026-09-18T00:00:00Z'),
  headline: 'Fabulous hotel!',
  liked: 'Location is excellent, a few steps from the Luxembourg gardens.',
  disliked: null,
};

const lines = (count: number) => ({
  nativeEvent: { lines: Array.from({ length: count }, () => ({})) },
});

describe('ReviewCard', () => {
  it('has nothing to open while the review fits', async () => {
    await render(<ReviewCard review={review} />);

    expect(screen.queryByText('Read more')).not.toBeOnTheScreen();
  });

  it('opens a long review in full, and closes it again', async () => {
    await render(<ReviewCard review={review} />);

    // The unseen full-length copy is the second; it reports more lines than the cut.
    const [, measured] = screen.getAllByText(review.liked, {
      includeHiddenElements: true,
    });

    if (measured === undefined) throw new Error('no measuring copy');

    await fireEvent(measured, 'textLayout', lines(6));

    const user = userEvent.setup();

    await user.press(screen.getByText('Read more'));
    expect(screen.getByText('Show less')).toBeOnTheScreen();

    await user.press(screen.getByText('Show less'));
    expect(screen.getByText('Read more')).toBeOnTheScreen();
  });
});
