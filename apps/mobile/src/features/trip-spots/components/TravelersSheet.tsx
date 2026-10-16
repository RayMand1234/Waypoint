import {
  MAX_ADULTS,
  MAX_CHILD_AGE,
  MAX_CHILDREN,
} from '@waypoint/contracts/common';
import { useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Sheet } from '@/shared/components';
import { Stepper } from './Stepper';

/** A new child starts at this age; the traveler sets the real one. */
const DEFAULT_CHILD_AGE = 8;

type TravelersSheetProps = {
  readonly isOpen: boolean;
  readonly adults: number;
  readonly childrenAges: readonly number[];
  readonly onClose: () => void;
  readonly onDone: (adults: number, childrenAges: number[]) => void;
};

/** Adults, and each child's age — prices for children depend on it. */
export const TravelersSheet = ({
  isOpen,
  adults,
  childrenAges,
  onClose,
  onDone,
}: TravelersSheetProps) => {
  const [draftAdults, setAdults] = useState(adults);
  const [ages, setAges] = useState<readonly number[]>(childrenAges);

  return (
    <Sheet
      isOpen={isOpen}
      title="Who's going?"
      onClose={onClose}
      footer={
        <Button
          label="Done"
          isBlock
          onPress={() => {
            onDone(draftAdults, [...ages]);
            onClose();
          }}
        />
      }
    >
      <View style={styles.body}>
        <Stepper
          label="Adults"
          hint="18 or older"
          value={draftAdults}
          min={1}
          max={MAX_ADULTS}
          onChange={setAdults}
        />
        <Stepper
          label="Children"
          hint="Under 18"
          value={ages.length}
          min={0}
          max={MAX_CHILDREN}
          onChange={(count) => {
            setAges(
              count > ages.length
                ? [...ages, DEFAULT_CHILD_AGE]
                : ages.slice(0, count),
            );
          }}
        />
        {ages.map((age, index) => (
          <Stepper
            key={index}
            label={`Child ${String(index + 1)}'s age`}
            value={age}
            min={0}
            max={MAX_CHILD_AGE}
            onChange={(next) => {
              setAges(ages.map((current, i) => (i === index ? next : current)));
            }}
          />
        ))}
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create((theme) => ({
  body: {
    gap: theme.space[2],
  },
}));
