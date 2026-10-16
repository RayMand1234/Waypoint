import { render, screen, userEvent } from '@testing-library/react-native';
import { Route } from './Route';

describe('Route', () => {
  it('is a progress bar naming the current step', async () => {
    await render(
      <Route
        step={4}
        stepName="Day plan"
        picks={['Views +2', 'Lisbon', '5 days']}
      />,
    );

    // Not an accessible *element* on purpose: that would hide its jump-back
    // buttons from VoiceOver. So it's found by label, and its role is checked.
    const route = screen.getByLabelText('Step 4 of 6, Day plan');

    expect(route).toHaveProp('accessibilityRole', 'progressbar');
    expect(route).toHaveAccessibilityValue({ min: 1, max: 6, now: 4 });
    expect(screen.getByText('Day plan')).toBeOnTheScreen();
    expect(screen.getByText('Lisbon')).toBeOnTheScreen();
  });

  it('jumps back to a passed step', async () => {
    const onCheckpointPress = jest.fn();

    await render(
      <Route
        step={3}
        stepName="Spots & dates"
        picks={['Views +2', 'Lisbon']}
        onCheckpointPress={onCheckpointPress}
      />,
    );
    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Back to step 2: Lisbon' }));

    expect(onCheckpointPress).toHaveBeenCalledWith(2);
  });
});
