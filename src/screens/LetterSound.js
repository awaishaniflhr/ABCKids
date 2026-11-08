import React, { useState } from 'react';
import {
  ActivityScreen,
  LearningCard,
  ResponsiveGrid,
} from '../components/ActivityLayout';
import { LETTER_SOUNDS } from '../games/learningData';
import useSpeech from '../games/useSpeech';
export const LetterData = LETTER_SOUNDS;
export default function LetterSound({ navigation }) {
  const [selected, setSelected] = useState(null);
  const speak = useSpeech();
  return (
    <ActivityScreen
      navigation={navigation}
      title="Tap the Letters"
      subtitle="Tap a letter and say it with me"
    >
      <ResponsiveGrid
        data={LETTER_SOUNDS}
        minWidth={70}
        maxColumns={8}
        itemHeight={88}
        renderItem={({ item, width, height }) => (
          <LearningCard
            width={width}
            height={height}
            text={item.Letter}
            color={item.color}
            selected={selected === item.id}
            label={`Say ${item.Letter}`}
            onPress={() => {
              setSelected(item.id);
              speak(item.Letter);
            }}
          />
        )}
      />
    </ActivityScreen>
  );
}
