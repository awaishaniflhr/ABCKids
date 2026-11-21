import React from 'react';
import SoundBoard from '../components/SoundBoard';
import { INSTRUMENTS } from '../games/learningData';

export default function InstrumentSound({ navigation }) {
  return (
    <SoundBoard
      navigation={navigation}
      title="Music Sounds"
      data={INSTRUMENTS}
    />
  );
}
