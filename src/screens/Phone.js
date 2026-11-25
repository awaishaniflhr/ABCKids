import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityScreen,
  useActivityLayout,
} from '../components/ActivityLayout';
import { useReducedMotion } from '../components/SingAlongBackdrop';
import { PHONE_ANIMALS } from '../games/learningData';
import SoundPlayer from '../utills/SoundPlayer';
import { GLASS_PINK } from '../components/glass';

export const RING_MS = 3000; // the ringtone plays this long
export const TALK_MS = 4000; // then the animal "talks" this long
const TALK_GAP_MS = 350; // pause between repeats of a short animal sound
const KEY_GAP = 12;

// A looping 0 → 1 → 0 animation value, still when motion is reduced.
function usePulse(active, duration) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    value.setValue(0);
    if (!active || reduced) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, reduced, duration, value]);
  return value;
}

// Rings that spread out from the portrait while the phone rings.
function RingWaves({ size, active }) {
  const reduced = useReducedMotion();
  const waves = useRef([0, 1].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (!active || reduced) return undefined;
    const loops = waves.map((wave, index) => {
      wave.setValue(0);
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 600),
          Animated.timing(wave, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
    });
    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
  }, [active, reduced, waves]);
  if (!active || reduced) return null;
  return waves.map((wave, index) => (
    <Animated.View
      key={index}
      pointerEvents="none"
      style={[
        styles.wave,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: wave.interpolate({
            inputRange: [0, 1],
            outputRange: [0.6, 0],
          }),
          transform: [
            {
              scale: wave.interpolate({
                inputRange: [0, 1],
                outputRange: [0.85, 1.45],
              }),
            },
          ],
        },
      ]}
    />
  ));
}

function Display({ animal, phase, seconds, width, height, onHangUp }) {
  const calling = phase !== 'idle';
  const wiggle = usePulse(phase === 'ringing', 260);
  const bounce = usePulse(phase === 'talking', 520);
  const portrait = Math.min(width * 0.62, height * 0.56);
  const big = Math.max(16, Math.min(30, width * 0.085));
  const small = Math.max(12, Math.min(18, width * 0.05));
  const rotate = wiggle.interpolate({
    inputRange: [0, 1],
    outputRange: ['-7deg', '7deg'],
  });
  const translateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -portrait * 0.08],
  });
  return (
    <View style={[styles.screen, { width, height }]}>
      <View pointerEvents="none" style={styles.screenShine} />
      {animal ? (
        <>
          <View
            style={[styles.portraitWrap, { width: portrait, height: portrait }]}
          >
            <RingWaves size={portrait} active={phase === 'ringing'} />
            <Animated.View
              style={[
                styles.portrait,
                {
                  width: portrait,
                  height: portrait,
                  borderRadius: portrait / 2,
                  backgroundColor: animal.key,
                  transform: [{ rotate }, { translateY }],
                },
              ]}
            >
              <Image
                source={animal.image}
                resizeMode="contain"
                style={{ width: portrait * 0.78, height: portrait * 0.78 }}
              />
            </Animated.View>
            {phase === 'talking' ? (
              <View style={styles.bubble}>
                <Text style={[styles.bubbleText, { fontSize: small + 2 }]}>
                  {animal.says}
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            numberOfLines={1}
            style={[styles.callerName, { fontSize: big }]}
          >
            {animal.name}
          </Text>
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.status, { fontSize: small }]}
          >
            {phase === 'ringing'
              ? 'Calling…'
              : phase === 'talking'
              ? `00:${String(seconds).padStart(2, '0')}`
              : 'Tap again to call!'}
          </Text>
        </>
      ) : (
        <Text style={[styles.hint, { fontSize: big }]}>
          {'Tap an animal\nto call! 📞'}
        </Text>
      )}
      {calling ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="End call"
          onPress={onHangUp}
          style={({ pressed }) => [
            styles.hangUp,
            { width: small * 2.6, height: small * 2.6 },
            pressed && styles.keyPressed,
          ]}
        >
          <Text style={[styles.hangUpIcon, { fontSize: small * 1.1 }]}>
            {'✕'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function AnimalKey({ animal, size, active, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Call ${animal.name}`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: animal.key,
        },
        active && styles.keyActive,
        pressed && styles.keyPressed,
      ]}
    >
      <View
        pointerEvents="none"
        style={[styles.keyShine, { borderRadius: size * 0.3 }]}
      />
      <Image
        source={animal.image}
        resizeMode="contain"
        style={{ width: size * 0.74, height: size * 0.74 }}
      />
    </Pressable>
  );
}

// Sizes the toy phone to fit `width` × `height`: tall with the keypad under
// the screen, or on its side with the keypad to the right in landscape.
function phoneLayout(width, height) {
  const wide = width > height * 1.1;
  if (wide) {
    const bodyH = Math.min(height, width / 1.75);
    const bodyW = Math.min(width, bodyH * 1.75);
    const pad = Math.max(10, bodyH * 0.05);
    const innerH = bodyH - pad * 2 - 16;
    const key = (innerH - KEY_GAP * 2) / 3;
    const keypad = key * 3 + KEY_GAP * 2;
    return {
      wide,
      bodyW,
      bodyH,
      pad,
      key,
      screenW: bodyW - pad * 3 - 16 - keypad,
      screenH: innerH,
    };
  }
  const bodyW = Math.min(width, height * 0.66, 460);
  const bodyH = Math.min(height, bodyW / 0.66);
  const pad = Math.max(12, bodyW * 0.05);
  const innerW = bodyW - pad * 2 - 16;
  const innerH = bodyH - pad * 3 - 16;
  const key = Math.min(
    (innerW - KEY_GAP * 2) / 3,
    (innerH * 0.6 - KEY_GAP * 2) / 3,
  );
  return {
    wide,
    bodyW,
    bodyH,
    pad,
    key,
    screenW: innerW,
    screenH: innerH - (key * 3 + KEY_GAP * 2),
  };
}

export default function Phone({ navigation }) {
  const [animal, setAnimal] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [area, setArea] = useState(null);
  const timers = useRef([]);
  const { contentWidth, contentHeight } = useActivityLayout();

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const endCall = useCallback(() => {
    clearTimers();
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
    if (phase !== 'talking') return undefined;
    const timer = setInterval(() => setSeconds(value => value + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // Tapping a key calls that animal: ring, ring… then it answers.
  function call(next) {
    clearTimers();
    setAnimal(next);
    setSeconds(0);
    setPhase('ringing');
    SoundPlayer.playSoundFile('ringing', 'mp3', { repeat: true, gap: 200 });
    timers.current.push(
      setTimeout(() => {
        setPhase('talking');
        SoundPlayer.playSoundFile(next.sound, 'mp3', {
          repeat: true,
          gap: TALK_GAP_MS,
        });
        timers.current.push(setTimeout(endCall, TALK_MS));
      }, RING_MS),
    );
  }

  const size = area || { width: contentWidth, height: contentHeight };
  const layout = phoneLayout(size.width, size.height);
  return (
    <ActivityScreen
      navigation={navigation}
      title="Animal Phone"
      homeHeader
      headerTheme={PHONE_HEADER}
      subtitle="Tap an animal to give them a call"
    >
      <View
        style={styles.area}
        onLayout={({ nativeEvent }) =>
          setArea({
            width: nativeEvent.layout.width,
            height: nativeEvent.layout.height,
          })
        }
      >
        <View
          style={[styles.rim, { width: layout.bodyW, height: layout.bodyH }]}
        >
          <View
            style={[
              styles.body,
              { padding: layout.pad, gap: layout.pad },
              layout.wide && styles.bodyWide,
            ]}
          >
            <Display
              animal={animal}
              phase={phase}
              seconds={seconds}
              width={layout.screenW}
              height={layout.screenH}
              onHangUp={endCall}
            />
            <View
              style={[styles.keypad, { width: layout.key * 3 + KEY_GAP * 2 }]}
            >
              {PHONE_ANIMALS.map(item => (
                <AnimalKey
                  key={item.id}
                  animal={item}
                  size={layout.key}
                  active={phase !== 'idle' && animal?.id === item.id}
                  onPress={() => call(item)}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </ActivityScreen>
  );
}

// The phone fills the screen without scrolling, so the full-width glass bar
// (Home's baby pink) always shows.
const PHONE_HEADER = { glass: GLASS_PINK };

const styles = StyleSheet.create({
  area: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rim: {
    padding: 8,
    borderRadius: 48,
    backgroundColor: '#F8DC72',
    borderWidth: 2,
    borderColor: '#EBC85A',
    elevation: 8,
    shadowColor: '#8A6A2A',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  body: {
    flex: 1,
    borderRadius: 40,
    backgroundColor: '#7FD2B0',
    borderWidth: 3,
    borderColor: '#6CC3A0',
    alignItems: 'center',
  },
  bodyWide: { flexDirection: 'row' },
  screen: {
    borderRadius: 26,
    backgroundColor: '#DDF4FC',
    borderWidth: 5,
    borderColor: '#68BE9C',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  screenShine: {
    position: 'absolute',
    top: -40,
    left: -30,
    width: '70%',
    height: '60%',
    borderRadius: 200,
    backgroundColor: '#FFFFFF55',
  },
  portraitWrap: { alignItems: 'center', justifyContent: 'center' },
  wave: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: '#4FB08C',
  },
  portrait: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  bubble: {
    position: 'absolute',
    top: -6,
    right: -18,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    elevation: 3,
  },
  bubbleText: {
    color: '#E8457A',
    fontFamily: 'Poppins-ExtraBold',
    includeFontPadding: false,
  },
  callerName: {
    marginTop: 6,
    color: '#2B4A63',
    fontFamily: 'Poppins-ExtraBold',
    includeFontPadding: false,
  },
  status: {
    color: '#4E7A8C',
    fontFamily: 'Poppins-SemiBold',
    includeFontPadding: false,
  },
  hint: {
    color: '#4E7A8C',
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
  },
  hangUp: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    borderRadius: 100,
    backgroundColor: '#F0565C',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  hangUpIcon: { color: '#FFFFFF', fontWeight: '900' },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: KEY_GAP,
    alignContent: 'center',
  },
  key: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFFAA',
    borderBottomWidth: 6,
    borderBottomColor: '#00000022',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#2E6B55',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
  },
  keyShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: '#FFFFFF33',
  },
  keyActive: { borderColor: '#FFFFFF', transform: [{ scale: 1.06 }] },
  keyPressed: { transform: [{ scale: 0.92 }], borderBottomWidth: 3 },
});
