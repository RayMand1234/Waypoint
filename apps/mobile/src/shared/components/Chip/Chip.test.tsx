import { render, screen, userEvent } from '@testing-library/react-native';
import { Chip } from './Chip';

describe('Chip', () => {
  it('reports its selected state and toggles on press', async () => {
    const onPress = jest.fn();

    await render(<Chip label="Food & markets" isSelected onPress={onPress} />);

    const chip = screen.getByRole('button', { name: 'Food & markets' });

    expect(chip).toBeSelected();
    await userEvent.setup().press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
