import React, { useState } from 'react';
import { ActivityScreen, LearningCard, ResponsiveGrid } from './ActivityLayout';
import SoundPlayer from '../utills/SoundPlayer';

export default function SoundBoard({ navigation, title, data }) {
  const [selected, setSelected] = useState(null);
  return (
    <ActivityScreen
      navigation={navigation}
      title={title}
      subtitle="Tap a picture to hear its sound"
    >
      <ResponsiveGrid
        data={data}
        minWidth={100}
        maxColumns={6}
        itemHeight={120}
        renderItem={({ item, width, height }) => (
          <LearningCard
            width={width}
            height={height}
            image={item.Image}
            selected={selected === item.id}
            label={`Play ${item.sound.replace(/sound$/, '')} sound`}
            onPress={() => {
              setSelected(item.id);
              SoundPlayer.playSoundFile(item.sound, 'mp3');
            }}
          />
        )}
      />
    </ActivityScreen>
  );
}
