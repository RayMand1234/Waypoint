import { currencySchema } from '@waypoint/contracts/common';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useSignOut } from '@/features/auth';
import { Button, SegmentedControl, Text } from '@/shared/components';
import { useSession } from '@/shared/auth';
import { errorMessage } from '@/shared/utils/errorMessage';
import { useBubbleMorph, type Anchor } from '../hooks/useBubbleMorph';
import { useCurrency } from '../hooks/useCurrency';
import { useMe } from '../hooks/useMe';

const CURRENCIES = currencySchema.options.map((currency) => ({
  value: currency,
  label: currency,
}));

type ProfileBubbleProps = {
  /** The avatar tapped, where on screen; `null` when closed. */
  readonly anchor: Anchor | null;
  readonly initial: string;
  readonly onClose: () => void;
  /** Shrunk back into the avatar: the avatar underneath can show again. */
  readonly onClosed: () => void;
};

/**
 * The avatar growing into a small glass panel with the profile: who's signed
 * in, the currency prices show in (saved when picked), sign out. Tapping the
 * avatar again or anywhere else shrinks it back. Apple's Liquid Glass where
 * available, a frosted fill elsewhere.
 */
export const ProfileBubble = ({
  anchor,
  initial,
  onClose,
  onClosed,
}: ProfileBubbleProps) => {
  const { theme, rt } = useUnistyles();
  const morph = useBubbleMorph(
    anchor,
    { width: theme.size['profile-panel-w'], radius: theme.radius.lg },
    onClosed,
  );
  const me = useMe();
  const money = useCurrency(me.data);
  const session = useSession();
  const signOut = useSignOut();
  const email =
    session.status === 'signed-in' ? session.session.user.email : undefined;
  const at = morph.anchor;

  if (at === null) return null;

  return (
    <View style={styles.layer} pointerEvents="box-none">
      {/* Tapping anywhere else closes it; nothing behind is dimmed. */}
      <Pressable
        style={styles.layer}
        accessibilityLabel="Close profile"
        onPress={onClose}
      />
      <Animated.View
        style={[
          styles.panel(at.y, rt.screen.width - at.x - at.width),
          morph.shapeStyle,
        ]}
        accessibilityViewIsModal
      >
        <Animated.View style={[styles.fill, morph.glassStyle]}>
          {isLiquidGlassAvailable() ? (
            <GlassView
              style={styles.fill}
              glassEffectStyle="regular"
              colorScheme="light"
            />
          ) : (
            <View style={[styles.fill, styles.frost]} />
          )}
        </Animated.View>
        <Animated.View
          style={[styles.content, morph.contentStyle]}
          onLayout={(event) => {
            morph.onContentHeight(event.nativeEvent.layout.height);
          }}
        >
          <View style={styles.who}>
            <Text variant="body-strong" numberOfLines={1}>
              {me.data?.name ?? 'Your profile'}
            </Text>
            {email !== undefined && (
              <Text variant="caption" color="ink-muted" numberOfLines={1}>
                {email}
              </Text>
            )}
          </View>
          {me.isPending && (
            <ActivityIndicator color={theme.colors['midnight-900']} />
          )}
          {me.isError && (
            <Text variant="caption" color="danger">
              {errorMessage(me.error)}
            </Text>
          )}
          {money.currency !== undefined && (
            <View style={styles.currency}>
              <Text variant="caption" color="ink-muted">
                Show prices in
              </Text>
              <SegmentedControl
                label="Currency"
                tone="midnight"
                options={CURRENCIES}
                value={money.currency}
                onChange={money.setCurrency}
              />
            </View>
          )}
          {money.error !== undefined && (
            <Text
              variant="caption"
              color="danger"
              accessibilityLiveRegion="polite"
            >
              {money.error}
            </Text>
          )}
          <View style={styles.footer}>
            <Button
              label="Sign out"
              kind="ghost"
              isLoading={signOut.isPending}
              onPress={() => {
                signOut.mutate();
              }}
            />
            {__DEV__ && (
              <Button
                label="Gallery"
                kind="ghost"
                onPress={() => {
                  onClose();
                  router.push('/gallery');
                }}
              />
            )}
          </View>
        </Animated.View>
        {/* The avatar stays put in the corner the panel grows from; tapping it closes. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close profile"
          onPress={onClose}
          style={styles.avatar(at.width)}
        >
          <Animated.View style={[styles.avatarFill, morph.avatarFillStyle]} />
          <Text variant="body-strong" color="on-midnight">
            {initial}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  frost: {
    backgroundColor: theme.colors['glass-fallback'],
  },
  // Pinned by its top-right corner to the avatar's, growing left and down.
  panel: (top: number, right: number) => ({
    position: 'absolute',
    top,
    right,
    overflow: 'hidden',
    borderWidth: theme.size.hairline,
    borderColor: theme.colors['frost-border'],
  }),
  content: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: theme.size['profile-panel-w'],
    gap: theme.space[2],
    padding: theme.space[3],
    paddingTop: theme.space[3] + theme.space[1],
  },
  // Room on the right for the avatar.
  who: {
    minHeight: theme.size['tap-min'] - theme.space[2],
    paddingRight: theme.size['tap-min'],
    justifyContent: 'center',
  },
  currency: {
    gap: theme.space[1],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  avatar: (size: number) => ({
    position: 'absolute',
    top: 0,
    right: 0,
    width: size,
    height: size,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    borderWidth: theme.size.hairline,
    borderColor: theme.colors['frost-border'],
    backgroundColor: theme.colors['frost-fill'],
  }),
  avatarFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors['midnight-900'],
  },
}));
