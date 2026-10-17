import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useUnistyles } from 'react-native-unistyles';
import { featureFlags } from '@/shared/utils/featureFlags';

/**
 * Waypoints and Explore as the platform's own tab bar: on iOS 26 it
 * floats over the content in Liquid Glass and shrinks while scrolling down;
 * elsewhere it is the system bar. Hidden unless the `tabBar` feature flag is on.
 */
export const TabsLayout = () => {
  const { theme } = useUnistyles();

  return (
    <NativeTabs
      hidden={!featureFlags.tabBar}
      minimizeBehavior="onScrollDown"
      tintColor={theme.colors['midnight-900']}
      iconColor={{
        default: theme.colors['ink-muted'],
        selected: theme.colors['midnight-900'],
      }}
    >
      {/* Home's photo runs under the status bar and pads its own end. */}
      <NativeTabs.Trigger name="index" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>Waypoints</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'map', selected: 'map.fill' }}
          md="map"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'safari', selected: 'safari.fill' }}
          md="explore"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};
