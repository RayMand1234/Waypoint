import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import Svg, { Circle, Rect } from 'react-native-svg';
import { Text } from '@/shared/components';

// The mark from the login design: three waypoints rising on a midnight tile.
const VIEWBOX = 28;
const TILE_RADIUS = 8;
const DOT_RADIUS = 2.5;
const RING_STROKE = 1.5;

/** No logo has been supplied, so the wordmark is "Waypoint" in sans 800 beside the mark. */
export const BrandMark = () => {
  const { theme } = useUnistyles();
  const markSize = theme.size['brand-mark'];

  return (
    <View
      style={styles.row}
      accessibilityRole="header"
      accessibilityLabel="Waypoint"
    >
      <Svg
        width={markSize}
        height={markSize}
        viewBox={`0 0 ${String(VIEWBOX)} ${String(VIEWBOX)}`}
      >
        <Rect
          width={VIEWBOX}
          height={VIEWBOX}
          rx={TILE_RADIUS}
          fill={theme.colors['midnight-900']}
        />
        <Circle
          cx={9}
          cy={18}
          r={DOT_RADIUS}
          fill={theme.colors['sunshine-400']}
        />
        <Circle
          cx={14}
          cy={13}
          r={DOT_RADIUS}
          fill={theme.colors['sunshine-400']}
        />
        <Circle
          cx={19}
          cy={8}
          r={DOT_RADIUS}
          fill="none"
          stroke={theme.colors['sunshine-400']}
          strokeWidth={RING_STROKE}
        />
      </Svg>
      <Text variant="wordmark">Waypoint</Text>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
  },
}));
