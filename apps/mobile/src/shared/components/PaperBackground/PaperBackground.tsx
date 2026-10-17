import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Mask,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

/** Where the glows sit, as shares of the screen width (design: `docs/design/screens/home-photos/HomePhotos.html`). */
const SUN = { cx: 0.85, rx: 1.2 } as const;
const MIDNIGHT = { cx: 0, rx: 0.9 } as const;
/** Each glow fades out by 70% of its radius. */
const GLOW_END = 0.7;

/**
 * The paper behind a screen's content: a faint dot grid that fades out going
 * down, over two soft glows
 * (sunshine top-right, midnight-100 lower-left) where asked for — Home and
 * the planning steps have them. Fills its parent; decorative, so
 * touches and screen readers pass through.
 */
export const PaperBackground = ({
  hasGlows = false,
}: {
  readonly hasGlows?: boolean;
}) => {
  const { theme, rt } = useUnistyles();
  const width = rt.screen.width;
  const gap = theme.size['dot-grid-gap'];

  return (
    <View
      style={styles.fill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient
            id="sun"
            gradientUnits="userSpaceOnUse"
            cx={width * SUN.cx}
            cy={0}
            rx={width * SUN.rx}
            ry={theme.size['glow-sun-ry']}
          >
            <Stop offset={0} stopColor={theme.colors['sunshine-100']} />
            <Stop
              offset={GLOW_END}
              stopColor={theme.colors['sunshine-100']}
              stopOpacity={0}
            />
          </RadialGradient>
          <RadialGradient
            id="midnight"
            gradientUnits="userSpaceOnUse"
            cx={width * MIDNIGHT.cx}
            cy={theme.size['glow-midnight-y']}
            rx={width * MIDNIGHT.rx}
            ry={theme.size['glow-midnight-ry']}
          >
            <Stop offset={0} stopColor={theme.colors['midnight-100']} />
            <Stop
              offset={GLOW_END}
              stopColor={theme.colors['midnight-100']}
              stopOpacity={0}
            />
          </RadialGradient>
          <Pattern
            id="dots"
            patternUnits="userSpaceOnUse"
            width={gap}
            height={gap}
          >
            <Circle
              cx={gap / 2}
              cy={gap / 2}
              r={theme.size['dot-r']}
              fill={theme.colors.dot}
            />
          </Pattern>
          {/* The dots at full strength at the top, gone by `dot-fade-h`. */}
          <LinearGradient
            id="dotFade"
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={0}
            y2={theme.size['dot-fade-h']}
          >
            <Stop offset={0} stopColor={theme.colors['surface-card']} />
            <Stop
              offset={1}
              stopColor={theme.colors['surface-card']}
              stopOpacity={0}
            />
          </LinearGradient>
          <Mask id="dotMask">
            <Rect width="100%" height="100%" fill="url(#dotFade)" />
          </Mask>
        </Defs>
        {hasGlows && (
          <>
            <Rect width="100%" height="100%" fill="url(#sun)" />
            <Rect width="100%" height="100%" fill="url(#midnight)" />
          </>
        )}
        <Rect
          width="100%"
          height="100%"
          fill="url(#dots)"
          mask="url(#dotMask)"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
});
