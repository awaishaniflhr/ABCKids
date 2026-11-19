import React from 'react';
import { TracingRound } from './LetterTracing';
import { getTracingNumber, TRACING_NUMBERS } from '../games/tracingNumbers';
import { saveNumberTracingStar } from '../games/tracingProgress';
import { COUNTING } from '../games/learningData';

export const NUMBER_MODE = {
  title: 'Number Tracing',
  noun: 'Number',
  param: 'number',
  allLabel: 'All numbers',
  finishText: 'Back to your numbers',
  items: TRACING_NUMBERS,
  save: saveNumberTracingStar,
  lesson(number) {
    const item = COUNTING.find(entry => String(entry.count) === number);
    return {
      word: item.numbers,
      image: item.imgf,
      badge: item.imgf,
      pronounce: item.numbers,
      doneText: `Wonderful! You traced ${number}, ${item.numbers}.`,
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
