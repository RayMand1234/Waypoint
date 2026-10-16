import type { Profile } from '@waypoint/contracts/trips';
import { Controller } from 'react-hook-form';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Input, Text } from '@/shared/components';
import { useProfileForm } from '../hooks/useProfileForm';
import { CurrencyPicker } from './CurrencyPicker';

export const ProfileForm = ({ profile }: { readonly profile: Profile }) => {
  const { control, submit, isDirty, isSaving, wasSaved, error } =
    useProfileForm(profile);

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <Input
            ref={field.ref}
            label="Name"
            placeholder="What should we call you?"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            autoComplete="name"
            textContentType="givenName"
            {...(fieldState.error?.message === undefined
              ? {}
              : { error: fieldState.error.message })}
          />
        )}
      />
      <Controller
        control={control}
        name="homeAirport"
        render={({ field, fieldState }) => (
          <Input
            ref={field.ref}
            label="Home airport"
            placeholder="TLV"
            help="We search flights from here."
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={3}
            {...(fieldState.error?.message === undefined
              ? {}
              : { error: fieldState.error.message })}
          />
        )}
      />
      <Controller
        control={control}
        name="currency"
        render={({ field }) => (
          <CurrencyPicker value={field.value} onChange={field.onChange} />
        )}
      />
      {error !== undefined && (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
      {wasSaved && (
        <Text
          variant="caption"
          color="savings"
          accessibilityLiveRegion="polite"
        >
          Saved.
        </Text>
      )}
      <Button
        label="Save changes"
        isBlock
        isDisabled={!isDirty}
        isLoading={isSaving}
        onPress={() => void submit()}
      />
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  form: {
    gap: theme.space[4],
  },
}));
