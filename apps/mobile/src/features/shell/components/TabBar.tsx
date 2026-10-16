import type { Tabs } from 'expo-router';
import { Compass, Map, User, type LucideIcon } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { TabBarItem } from './TabBarItem';

export type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0];

const ICONS: Readonly<Record<string, LucideIcon>> = {
  index: Map,
  explore: Compass,
  profile: User,
};

/** The bottom bar from the Home design: Waypoints, Explore, Profile. */
export const TabBar = ({ state, descriptors, navigation }: TabBarProps) => (
  <View accessibilityRole="tablist" style={styles.bar}>
    {state.routes.map((route, index) => {
      const title = descriptors[route.key]?.options.title ?? route.name;
      const isActive = state.index === index;

      const onPress = (): void => {
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });

        if (!isActive && !event.defaultPrevented)
          navigation.navigate(route.name);
      };

      return (
        <TabBarItem
          key={route.key}
          label={title}
          Icon={ICONS[route.name] ?? Map}
          isActive={isActive}
          onPress={onPress}
        />
      );
    })}
  </View>
);

const styles = StyleSheet.create((theme, rt) => ({
  bar: {
    flexDirection: 'row',
    paddingTop: theme.space[2],
    paddingHorizontal: theme.space[4],
    paddingBottom: Math.max(theme.space[6], rt.insets.bottom),
    backgroundColor: theme.colors['surface-card'],
    borderTopWidth: theme.size.hairline,
    borderColor: theme.colors.border,
  },
}));
