import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Text } from '@/shared/components';

export type StepAction = {
  readonly label: string;
  readonly onPress: () => void;
  readonly isDisabled?: boolean;
  readonly isLoading?: boolean;
};

type StepFooterProps = {
  /** Small line: "3 styles selected", "Going to". */
  readonly caption: string;
  /** Bold value beside the button ("Lisbon, Portugal"); without it the button sits under the caption. */
  readonly value?: string;
  readonly action: StepAction;
  /** Shown above the footer when saving fails. */
  readonly error?: string;
};

/** The pinned bottom of steps 1–3: a short selection summary and the one primary button. */
export const StepFooter = ({
  caption,
  value,
  action,
  error,
}: StepFooterProps) => {
  styles.useVariants({ inline: value !== undefined });

  const button = (
    <Button
      label={action.label}
      onPress={action.onPress}
      isBlock={value === undefined}
      isDisabled={action.isDisabled ?? false}
      isLoading={action.isLoading ?? false}
    />
  );

  return (
    <View style={styles.footer}>
      {error !== undefined && (
        <Text
          variant="caption"
          color="danger"
          align="center"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
      <View style={styles.content}>
        {value === undefined ? (
          <Text variant="caption" color="ink-muted" align="center">
            {caption}
          </Text>
        ) : (
          <View style={styles.summary}>
            <Text variant="caption" color="ink-muted">
              {caption}
            </Text>
            <Text variant="price" numberOfLines={1}>
              {value}
            </Text>
          </View>
        )}
        {button}
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  footer: {
    gap: theme.space[2],
    paddingTop: theme.space[3],
    paddingHorizontal: theme.space[4],
    paddingBottom: Math.max(theme.space[6], rt.insets.bottom + theme.space[2]),
    backgroundColor: theme.colors['surface-card'],
    borderTopWidth: theme.size.hairline,
    borderColor: theme.colors.border,
    boxShadow: theme.shadow.bar,
  },
  content: {
    gap: theme.space[2],
    variants: {
      inline: {
        true: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space[3],
        },
        false: {},
      },
    },
  },
  summary: {
    flex: 1,
    minWidth: 0,
    gap: theme.size['focus-ring'],
  },
}));
