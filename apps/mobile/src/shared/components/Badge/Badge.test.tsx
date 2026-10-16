import { render, screen } from '@testing-library/react-native';
import { Badge } from './Badge';

describe('Badge', () => {
  it('shows its words in uppercase (overline), so color is never the only signal', async () => {
    await render(<Badge kind="value" label="Best value" />);

    expect(screen.getByText('BEST VALUE')).toBeOnTheScreen();
  });
});
