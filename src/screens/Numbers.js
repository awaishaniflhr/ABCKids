import React from 'react';
import {
  ActivityScreen,
  LearningCard,
  ResponsiveGrid,
} from '../components/ActivityLayout';
import { NUMBER_PUZZLES } from '../games/learningData';
export const Number = NUMBER_PUZZLES;
export default function Numbers({ navigation }) {
  return (
    <ActivityScreen
      navigation={navigation}
      title="Number Puzzles"
      subtitle="Choose a number to start matching"
    >
      <ResponsiveGrid
        data={NUMBER_PUZZLES}
        minWidth={115}
        renderItem={({ item, width, height }) => (
          <LearningCard
            width={width}
            height={height}
            image={item.Picture}
            caption={item.ImageName}
            color={item.color}
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
