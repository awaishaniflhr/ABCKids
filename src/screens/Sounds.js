import React from 'react';
import {
  ActivityScreen,
  LearningCard,
  ResponsiveGrid,
} from '../components/ActivityLayout';
export const SoundCards = [
  {
    id: 1,
    name: 'Animals',
    Image: require('../assets/tiger.png'),
    screen: 'SoundScreen',
  },
  {
    id: 2,
    name: 'Letters',
    Image: require('../assets/abc2.png'),
    screen: 'LetterSound',
  },
  {
    id: 3,
    name: 'Birds',
    Image: require('../assets/birds.png'),
    screen: 'BirdSound',
  },
];
export default function Sounds({ navigation }) {
  return (
    <ActivityScreen
      navigation={navigation}
      title="Sounds"
      subtitle="Choose something fun to listen to"
    >
      <ResponsiveGrid
        data={SoundCards}
        minWidth={135}
        maxColumns={3}
        itemHeight={170}
        renderItem={({ item, width, height }) => (
          <LearningCard
            width={width}
            height={height}
            image={item.Image}
            caption={item.name}
            label={`Hear ${item.name.toLowerCase()}`}
            onPress={() => navigation.navigate(item.screen)}
          />
        )}
      />
    </ActivityScreen>
  );
}
