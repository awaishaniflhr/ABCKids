import React from 'react';
import {
  ActivityScreen,
  LearningCard,
  ResponsiveGrid,
} from '../components/ActivityLayout';
// The Letters board (LetterSound) keeps its screen and route but is no longer
// listed here.
export const SoundCards = [
  {
    id: 1,
    name: 'Animals',
    Image: require('../assets/tiger.png'),
    screen: 'SoundScreen',
  },
  {
    id: 2,
    name: 'Birds',
    Image: require('../assets/birds.png'),
    screen: 'BirdSound',
  },
  {
    id: 3,
    name: 'Vehicles',
    Image: require('../assets/redcar.png'),
    screen: 'VehicleSound',
  },
  {
    id: 4,
    name: 'Music',
    Image: require('../assets/drumkit.png'),
    screen: 'InstrumentSound',
  },
];
export default function Sounds({ navigation }) {
  return (
    <ActivityScreen
      navigation={navigation}
      title="Sounds"
      glassHeader
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
