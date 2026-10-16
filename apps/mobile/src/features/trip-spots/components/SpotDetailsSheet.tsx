import type { Spot } from '@waypoint/contracts/destinations';
import { ExternalLink } from 'lucide-react-native';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Badge, Button, DetailRows, Sheet, Text } from '@/shared/components';
import { categoryName, googleMapsUrl, spotFacts } from '../utils/spotDetails';
import { SpotPhoto } from './SpotPhoto';

type SpotDetailsSheetProps = {
  readonly spot: Spot;
  /** The trip's city, so the Maps search finds this spot and not a namesake. */
  readonly city: string | null;
  readonly isTopPick: boolean;
  readonly isSelected: boolean;
  readonly onToggle: (spotId: string) => void;
  readonly onClose: () => void;
};

/** One spot up close: photo, what it is, hours, entry and address, then Google Maps or Add. */
export const SpotDetailsSheet = ({
  spot,
  city,
  isTopPick,
  isSelected,
  onToggle,
  onClose,
}: SpotDetailsSheetProps) => {
  const { theme } = useUnistyles();
  const { website } = spot;

  return (
    <Sheet
      isOpen
      title={spot.name}
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <View style={styles.action}>
            <Button
              label="Google Maps"
              kind="secondary"
              isBlock
              onPress={() =>
                void Linking.openURL(googleMapsUrl(spot.name, city))
              }
            />
          </View>
          <View style={styles.action}>
            <Button
              label={isSelected ? 'Remove' : 'Add to trip'}
              kind={isSelected ? 'secondary' : 'primary'}
              isBlock
              onPress={() => {
                onToggle(spot.id);
                onClose();
              }}
            />
          </View>
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.body}>
        {spot.photo !== null && (
          <SpotPhoto key={spot.id} name={spot.name} photo={spot.photo} />
        )}
        <View style={styles.badges}>
          {isTopPick && <Badge kind="value" label="Top pick" />}
          <Badge kind="neutral" label={categoryName(spot.category)} />
        </View>
        {spot.description !== null && (
          <Text color="ink-muted">{spot.description}</Text>
        )}
        <DetailRows rows={spotFacts(spot)} />
        {website !== null && (
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(website)}
            style={styles.link}
          >
            <Text variant="label" color="midnight-900">
              Official website
            </Text>
            <ExternalLink
              size={theme.size['icon-sm']}
              strokeWidth={theme.size['icon-stroke']}
              color={theme.colors['midnight-900']}
            />
          </Pressable>
        )}
      </ScrollView>
    </Sheet>
  );
};

const styles = StyleSheet.create((theme) => ({
  body: {
    gap: theme.space[6],
    paddingBottom: theme.space[2],
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1],
    minHeight: theme.size['tap-min'],
  },
  footer: {
    flexDirection: 'row',
    gap: theme.space[2],
  },
  action: {
    flex: 1,
  },
}));
