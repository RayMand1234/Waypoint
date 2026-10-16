import { render, screen, userEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('says what happens next and runs the action', async () => {
    const onPress = jest.fn();

    await render(<Button label="Continue to stay" onPress={onPress} />);
    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Continue to stay' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('cannot be pressed while the step is incomplete', async () => {
    const onPress = jest.fn();

    await render(<Button label="Continue" onPress={onPress} isDisabled />);

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('shows it is busy and blocks presses while loading', async () => {
    await render(<Button label="Sign in" onPress={jest.fn()} isLoading />);

    const button = screen.getByRole('button', { name: 'Sign in' });

    expect(button).toBeBusy();
    expect(button).toBeDisabled();
  });
});
