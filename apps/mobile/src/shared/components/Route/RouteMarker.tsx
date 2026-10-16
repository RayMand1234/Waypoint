import { View } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import type { ViewStyle } from 'react-native';

type RouteMarkerProps = {
  readonly markerStyle: AnimatedStyle<ViewStyle>;
  readonly pulseStyle: AnimatedStyle<ViewStyle>;
};

/** The sunshine marker on the current checkpoint — the only sunshine on the route. */
export const RouteMarker = ({ markerStyle, pulseStyle }: RouteMarkerProps) => (
  <Animated.View style={[styles.anchor, markerStyle]} pointerEvents="none">
    <Animated.View style={[styles.pulse, pulseStyle]} />
    <View style={styles.marker} />
  </Animated.View>
);

const styles = StyleSheet.create((theme) => ({
  anchor: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: theme.size['route-marker'],
    height: theme.size['route-marker'],
  },
  pulse: {
    position: 'absolute',
    width: theme.size['route-marker'],
    height: theme.size['route-marker'],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors['sunshine-400'],
  },
  marker: {
    width: theme.size['route-marker'],
    height: theme.size['route-marker'],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors['sunshine-400'],
    borderWidth: theme.size['route-marker-border'],
    borderColor: theme.colors['midnight-900'],
  },
}));
