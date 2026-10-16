import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';

export const GallerySection = ({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) => (
  <View style={styles.section}>
    <Text variant="title" accessibilityRole="header">
      {title}
    </Text>
    {children}
  </View>
);

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.space[3],
  },
}));
