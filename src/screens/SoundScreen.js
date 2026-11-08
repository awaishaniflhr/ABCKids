import React from 'react';
import SoundBoard from '../components/SoundBoard';
import { ANIMALS } from '../games/learningData';
export const SoundCards = ANIMALS;
export default function SoundScreen({ navigation }) {
  return (
    <SoundBoard navigation={navigation} title="Animal Sounds" data={ANIMALS} />
  );
}
