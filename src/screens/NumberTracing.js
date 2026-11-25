import React from 'react';
import { TracingRound } from './LetterTracing';
import { getTracingNumber, TRACING_NUMBERS } from '../games/tracingNumbers';
import { saveNumberTracingStar } from '../games/tracingProgress';
import { numberWord } from '../games/numberWords';

export const NUMBER_MODE = {
  title: 'Number Tracing',
  noun: 'Number',
  param: 'number',
  allLabel: 'All numbers',
  finishText: 'Back to your numbers',
  items: TRACING_NUMBERS,
  save: saveNumberTracingStar,
  reminder: 'numbers',
  lesson(number) {
    const item = numberWord(number);
    return {
      word: item.word,
      image: item.image,
      badge: item.image,
      pronounce: item.word,
      doneText: `Wonderful! You traced ${number}, ${item.word}.`,
    };
  },
};

export default function NumberTracing({ navigation, route }) {
  const template = getTracingNumber(route?.params?.number);
  return (
    <TracingRound
      key={template.letter}
      navigation={navigation}
      template={template}
      mode={NUMBER_MODE}
    />
  );
}
