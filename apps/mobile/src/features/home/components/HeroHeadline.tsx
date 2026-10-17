import { Text } from '@/shared/components';
import { useTypewriter } from '../hooks/useTypewriter';
import { typedParts, type TypedSegment } from '../utils/typewriter';

const SEGMENTS: readonly TypedSegment[] = [
  { text: 'Where to\n', color: 'on-midnight' },
  { text: 'next?', color: 'sunshine-400' },
];
const FULL_TEXT = SEGMENTS.map((segment) => segment.text).join('');
const CARET = '|';

/**
 * "Where to next?" typing itself out, the caret blinking after it for good. The letters still
 * to come are laid out but transparent, so the headline never changes size
 * and nothing below it moves. Read whole by screen readers.
 */
export const HeroHeadline = () => {
  const { count, isCaretVisible } = useTypewriter(FULL_TEXT);
  const parts = typedParts(SEGMENTS, count);
  // The caret sits in the segment being typed (the last one once it's done).
  const caretAt = Math.max(
    parts.findIndex((part) => part.hidden !== ''),
    0,
  );
  const atEnd = parts.every((part) => part.hidden === '');

  return (
    <Text
      variant="display-xl"
      color="on-midnight"
      accessibilityRole="header"
      accessibilityLabel="Where to next?"
    >
      {parts.map((part, index) => {
        const hasCaret = atEnd ? index === parts.length - 1 : index === caretAt;

        return (
          <Text key={index} variant="display-xl" color={part.color}>
            {part.shown}
            {hasCaret && (
              <Text
                variant="display-xl"
                color={isCaretVisible ? 'sunshine-400' : 'transparent'}
              >
                {CARET}
              </Text>
            )}
            <Text variant="display-xl" color="transparent">
              {part.hidden}
            </Text>
          </Text>
        );
      })}
    </Text>
  );
};
