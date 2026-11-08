import React from 'react';
import {
  ActivityScreen,
  LearningCard,
  ResponsiveGrid,
} from '../components/ActivityLayout';
import { BALLOON_LETTERS } from '../games/learningData';
export const Number = BALLOON_LETTERS;
export default function PoppBalloonsTemplate({ navigation }) {
  return (
    <ActivityScreen
      navigation={navigation}
      title="Popped Letters"
      subtitle="Which letter shall we pop today?"
    >
      <ResponsiveGrid
        data={BALLOON_LETTERS}
        minWidth={75}
        maxColumns={8}
        itemHeight={104}
        renderItem={({ item, width, height }) => (
          <LearningCard
            width={width}
            height={height}
            text={item.name}
            color={item.color}
            label={`Pop letter ${item.name}`}
            onPress={() =>
              navigation.navigate('BalloonPopping', {
                Letter: item.name,
                ImageName: item.ImageName,
              })
            }
          />
        )}
      />
    </ActivityScreen>
  );
}
