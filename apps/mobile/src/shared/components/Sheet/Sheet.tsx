import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '../Text';

export type SheetProps = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  /** The sheet's one action, pinned at the bottom (usually a Button). */
  readonly footer?: ReactNode;
};

/** A bottom sheet on `surface-card` for one focused choice (dates, travelers, an airport). */
export const Sheet = ({
  isOpen,
  title,
  onClose,
  children,
  footer,
}: SheetProps) => {
  const { theme } = useUnistyles();

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={styles.dismissArea}
          accessibilityLabel="Close"
          onPress={onClose}
        />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text variant="title" accessibilityRole="header">
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={styles.close}
            >
              <X
                size={theme.size['icon-lg']}
                strokeWidth={theme.size['icon-stroke']}
                color={theme.colors.ink}
              />
            </Pressable>
          </View>
          <View style={styles.body}>{children}</View>
          {footer}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.scrim,
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    maxHeight: '88%',
    gap: theme.space[4],
    paddingTop: theme.space[4],
    paddingHorizontal: theme.space[4],
    paddingBottom: theme.space[4] + rt.insets.bottom,
    backgroundColor: theme.colors['surface-card'],
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    boxShadow: theme.shadow.bar,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  close: {
    width: theme.size['tap-min'],
    height: theme.size['tap-min'],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -theme.space[2],
  },
  body: {
    flexShrink: 1,
  },
}));
