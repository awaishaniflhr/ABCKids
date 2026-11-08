import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Image, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActionButton,
  ActivityScreen,
  LearningCard,
  ResponsiveGrid,
  useActivityLayout,
} from '../components/ActivityLayout';
import { PHONE_ANIMALS } from '../games/learningData';
import SoundPlayer from '../utills/SoundPlayer';
import useSpeech from '../games/useSpeech';
export default function Phone({ navigation }) {
  const [animal, setAnimal] = useState(PHONE_ANIMALS[2]);
  const [phase, setPhase] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const timers = useRef([]);
  const { wide, contentHeight } = useActivityLayout();
  const speak = useSpeech();
  const endCall = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    SoundPlayer.stop();
    setPhase('idle');
    setSeconds(0);
  }, []);
  useFocusEffect(
    useCallback(() => {
      const listener = AppState.addEventListener('change', state => {
        if (state !== 'active') endCall();
      });
      return () => {
        listener.remove();
        endCall();
      };
    }, [endCall]),
  );
  useEffect(() => {
    if (phase !== 'talking') return;
    const timer = setInterval(() => setSeconds(value => value + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);
  function call() {
    if (phase !== 'idle') {
      endCall();
      return;
    }
    setPhase('ringing');
    SoundPlayer.playSoundFile('ringing', 'mp3');
    timers.current.push(
      setTimeout(() => {
        setPhase('talking');
        SoundPlayer.playSoundFile(animal.sound, 'mp3');
        timers.current.push(setTimeout(endCall, 3000));
      }, 3000),
    );
  }
  return (
    <ActivityScreen
      navigation={navigation}
      title="Animal Phone"
      subtitle="Choose a friend and give them a call"
    >
      <View style={[styles.scene, wide && styles.wide]}>
        <View style={styles.display}>
          <Image
            source={animal.image}
            resizeMode="contain"
            style={styles.art}
          />
          <Text style={styles.name}>{animal.name}</Text>
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {phase === 'ringing'
              ? 'Calling…'
              : phase === 'talking'
              ? `00:${String(seconds).padStart(2, '0')}`
              : 'Who shall we call?'}
          </Text>
        </View>
        <View style={styles.dialer}>
          <ResponsiveGrid
            data={PHONE_ANIMALS}
            minWidth={65}
            maxColumns={3}
            itemHeight={
              wide
                ? Math.max(52, Math.min(76, (contentHeight - 72) / 3 - 12))
                : 76
            }
            renderItem={({ item, width, height }) => (
              <LearningCard
                width={width}
                height={height}
                image={item.image}
                label={`Call ${item.name}`}
                selected={animal.id === item.id}
                onPress={() => {
                  if (phase === 'idle') {
                    setAnimal(item);
                    speak(item.name);
                  }
                }}
              />
            )}
          />
          <ActionButton
            label={phase === 'idle' ? 'Start call' : 'End call'}
            onPress={call}
          />
        </View>
      </View>
    </ActivityScreen>
  );
}
const styles = StyleSheet.create({
  scene: { flex: 1, gap: 12 },
  wide: { flexDirection: 'row' },
  display: {
    flex: 1,
    minHeight: 100,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#F2C580',
    backgroundColor: '#DFF6FC',
    alignItems: 'center',
    padding: 12,
  },
  art: { flex: 1, width: '85%', maxHeight: 260 },
  name: { fontSize: 26, color: '#31516B', fontFamily: 'Poppins-SemiBold' },
  status: { fontSize: 15, color: '#54768A', paddingVertical: 6 },
  dialer: { flex: 1.1, gap: 8, minHeight: 100 },
});
