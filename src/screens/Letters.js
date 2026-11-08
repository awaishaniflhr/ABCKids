import React from 'react';
import {
  ActivityScreen,
  LearningCard,
  ResponsiveGrid,
} from '../components/ActivityLayout';
import { ALPHABET } from '../games/learningData';
export const Alphabet = ALPHABET;
export default function Letters({ navigation }) {
  return (
    <ActivityScreen
      navigation={navigation}
      title="ABC Puzzles"
      subtitle="Choose a letter to start matching"
    >
      <ResponsiveGrid
        data={ALPHABET}
        minWidth={115}
        renderItem={({ item, width, height }) => (
          <LearningCard
            width={width}
            height={height}
            text={item.name}
            image={item.Image}
            label={`Choose ${item.Letter}`}
            onPress={() =>
              navigation.navigate('DragLetters', {
                Letter: item.Letter,
                Pic: item.Image,
                ImageName: item.ImageName,
                pronounce: item.pronounce,
              })
            }
          />
        )}
      />
    </ActivityScreen>
  );
}
