import React from 'react';
import SoundBoard from '../components/SoundBoard';
import { VEHICLES } from '../games/learningData';

export default function VehicleSound({ navigation }) {
  return (
    <SoundBoard
      navigation={navigation}
      title="Vehicle Sounds"
      data={VEHICLES}
    />
  );
}
