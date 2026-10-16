import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export type ScreenProps = {
  readonly children: ReactNode;
  /** Scrolls the content; off for screens that lay out their own scrolling list. */
  readonly scrolls?: boolean;
  /** Pinned below the content (a summary bar or the step's primary button). */
  readonly footer?: ReactNode;
};

/** A full screen on the `surface` background, clear of the status bar and home indicator. */
export const Screen = ({ children, scrolls = true, footer }: ScreenProps) => (
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
    paddingBottom: theme.space[8],
  },
  fill: {
    flex: 1,
  },
}));
