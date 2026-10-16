import { useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Badge, Button, Chip, Input } from '@/shared/components';
import { GallerySection } from './GallerySection';

const noop = (): void => undefined;

const STYLES = ['Beautiful views', 'Food & markets', 'Nightlife'] as const;

/** Button, Chip, Badge and Input in every variant. */
export const ControlsDemo = () => {
  const [picked, setPicked] = useState<readonly string[]>(['Food & markets']);

  const toggle = (label: string): void => {
    setPicked((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  };

  return (
    <>
      <GallerySection title="Button">
        <Button label="Continue to stay" onPress={noop} isBlock />
        <Button
          label="Continue with Google"
          kind="secondary"
          onPress={noop}
          isBlock
        />
        <Button label="Send a new code" kind="ghost" onPress={noop} />
        <Button
          label="Choose a destination first"
          onPress={noop}
          isBlock
          isDisabled
        />
        <Button label="Saving" onPress={noop} isBlock isLoading />
      </GallerySection>
      <GallerySection title="Chip">
        <View style={styles.wrap}>
          {STYLES.map((label) => (
            <Chip
              key={label}
              label={label}
              isSelected={picked.includes(label)}
              onPress={() => {
                toggle(label);
              }}
            />
          ))}
        </View>
      </GallerySection>
      <GallerySection title="Badge">
        <View style={styles.wrap}>
          <Badge kind="value" label="Best value" />
          <Badge kind="savings" label="Booked" />
          <Badge kind="warning" label="2 rooms left" />
          <Badge kind="danger" label="Price up" />
          <Badge kind="neutral" label="Draft" />
        </View>
      </GallerySection>
      <GallerySection title="Input">
        <Input label="Email" placeholder="you@example.com" />
        <Input
          label="Home airport"
          placeholder="TLV"
          help="We search flights from here."
        />
        <Input
          label="Code"
          value="12"
          error="Enter the 6-digit code from the email."
        />
      </GallerySection>
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[3],
  },
}));
