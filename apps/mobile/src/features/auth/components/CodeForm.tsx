import { Controller } from 'react-hook-form';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Input, Text } from '@/shared/components';
import { useCodeForm } from '../hooks/useCodeForm';

type CodeFormProps = {
  readonly email: string;
  readonly onChangeEmail: () => void;
};

export const CodeForm = ({ email, onChangeEmail }: CodeFormProps) => {
  const {
    control,
    submit,
    resend,
    isVerifying,
    isResending,
    wasResent,
    error,
  } = useCodeForm(email);

  return (
    <View style={styles.form}>
      <Text color="ink-muted">We sent a 6-digit code to {email}.</Text>
      <Controller
        control={control}
        name="code"
        render={({ field, fieldState }) => (
          <Input
            ref={field.ref}
            label="Code"
            placeholder="123456"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={() => void submit()}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            autoFocus
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
      {wasResent && error === undefined && (
        <Text
          variant="caption"
          color="savings"
          accessibilityLiveRegion="polite"
        >
          We sent a new code.
        </Text>
      )}
      <Button
        label="Sign in"
        isBlock
        isLoading={isVerifying}
        onPress={() => void submit()}
      />
      <View style={styles.links}>
        <Button
          label="Send a new code"
          kind="ghost"
          isLoading={isResending}
          onPress={resend}
        />
        <Button
          label="Use another email"
          kind="ghost"
          onPress={onChangeEmail}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  form: {
    gap: theme.space[4],
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
}));
