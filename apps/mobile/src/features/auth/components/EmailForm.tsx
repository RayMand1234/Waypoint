import { Controller } from 'react-hook-form';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Input, Text } from '@/shared/components';
import { useEmailForm } from '../hooks/useEmailForm';

type EmailFormProps = { readonly onSent: (email: string) => void };

export const EmailForm = ({ onSent }: EmailFormProps) => {
  const { control, submit, isSending, error } = useEmailForm(onSent);

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <Input
            ref={field.ref}
            label="Email"
            placeholder="you@example.com"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={() => void submit()}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            {...(fieldState.error?.message === undefined
              ? {}
              : { error: fieldState.error.message })}
          />
        )}
      />
      {error !== undefined && (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
      <Button
        label="Continue with email"
        isBlock
        isLoading={isSending}
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
