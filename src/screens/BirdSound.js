import React from 'react';
import SoundBoard from '../components/SoundBoard';
import { BIRDS } from '../games/learningData';
export const SoundCards = BIRDS;
export default function BirdSound({ navigation }) {
  return (
    <SoundBoard navigation={navigation} title="Bird Sounds" data={BIRDS} />
  );
}
