import type { ReactNode } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { featureFlags } from '../../utils/featureFlags';

export type ScreenProps = {
  readonly children: ReactNode;
  /** Scrolls the content; off for screens that lay out their own scrolling list. */
  readonly scrolls?: boolean;
  /** Pinned below the content (a summary bar or the step's primary button). */
  readonly footer?: ReactNode;
  /** A tab screen: the content ends clear of the tab bar floating over it (when the bar is shown). */
  readonly hasTabBar?: boolean;
};

/** A full screen on the `surface` background, clear of the status bar and home indicator. */
export const Screen = ({
  children,
  scrolls = true,
  footer,
  hasTabBar = false,
}: ScreenProps) => {
  styles.useVariants({ hasTabBar: hasTabBar && featureFlags.tabBar });

  return (
    <View style={styles.screen}>
      {scrolls ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill]}>{children}</View>
      )}
      {footer}
    </View>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingTop: rt.insets.top,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: theme.size['content-max'],
    alignSelf: 'center',
    paddingHorizontal: theme.space[4],
    variants: {
      // iOS's tab bar floats over the content; Android's sits below it.
      hasTabBar: {
        true: {
          paddingBottom:
            Platform.OS === 'ios'
              ? rt.insets.bottom + theme.size['tab-bar-clearance']
              : theme.space[8],
        },
        false: { paddingBottom: theme.space[8] },
      },
    },
  },
  fill: {
    flex: 1,
  },
}));
