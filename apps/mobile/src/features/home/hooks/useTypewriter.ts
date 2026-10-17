import { useEffect, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { typingDelay } from '../utils/typewriter';

const START_MS = 400;
const PER_CHAR_MS = 75;
const LINE_BREAK_MS = 280;
const BLINK_MS = 530;

/**
 * Types `text` out once per mount (remount to replay), a letter at a time,
 * then leaves the caret blinking after it: how many characters show, and
 * whether the caret is lit. With reduce motion on, the text is all there at
 * once and the caret stays lit without blinking.
 */
export const useTypewriter = (text: string) => {
  const reduceMotion = useReducedMotion();
  const [count, setCount] = useState(reduceMotion ? text.length : 0);
  const [isCaretOn, setCaretOn] = useState(true);
  const isTyped = count >= text.length;

  // The next letter.
  useEffect(() => {
    if (isTyped) return;

    const timer = setTimeout(
      () => {
        setCount((typed) => typed + 1);
      },
      count === 0
        ? START_MS
        : typingDelay(text[count - 1], {
            perChar: PER_CHAR_MS,
            lineBreak: LINE_BREAK_MS,
          }),
    );

    return () => {
      clearTimeout(timer);
    };
  }, [count, isTyped, text]);

  // The caret blinks for as long as the headline is on screen.
  useEffect(() => {
    if (reduceMotion) return;

    const timer = setInterval(() => {
      setCaretOn((on) => !on);
    }, BLINK_MS);

    return () => {
      clearInterval(timer);
    };
  }, [reduceMotion]);

  return { count, isCaretVisible: reduceMotion || isCaretOn };
};
