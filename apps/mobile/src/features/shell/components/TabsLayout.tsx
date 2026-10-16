import { Tabs } from 'expo-router';
import { TabBar, type TabBarProps } from './TabBar';

const renderTabBar = (props: TabBarProps) => <TabBar {...props} />;

export const TabsLayout = () => (
  <Tabs screenOptions={{ headerShown: false }} tabBar={renderTabBar}>
    <Tabs.Screen name="index" options={{ title: 'Waypoints' }} />
    <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
  </Tabs>
);
