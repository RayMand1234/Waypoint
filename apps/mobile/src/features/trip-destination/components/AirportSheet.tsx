import { useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Input, Sheet } from '@/shared/components';
import { useAirportSearch } from '../hooks/useAirportSearch';
import { AirportResults } from './AirportResults';

type AirportSheetProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onPick: (code: string) => void;
};

/** Search an airport by city, name or code. */
export const AirportSheet = ({
  isOpen,
  onClose,
  onPick,
}: AirportSheetProps) => {
  const [text, setText] = useState('');
  const search = useAirportSearch(text);
  const code = text.trim().toUpperCase();

  const pick = (picked: string): void => {
    onPick(picked);
    setText('');
    onClose();
  };

  return (
    <Sheet isOpen={isOpen} title="Where do you fly from?" onClose={onClose}>
      <View style={styles.body}>
        <Input
          label="Airport or city"
          placeholder="Tel Aviv or TLV"
          value={text}
          onChangeText={setText}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
        />
        <AirportResults
          state={search}
          typedCode={/^[A-Z]{3}$/.test(code) ? code : undefined}
          onPick={pick}
        />
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create((theme) => ({
  body: {
    gap: theme.space[3],
  },
}));
