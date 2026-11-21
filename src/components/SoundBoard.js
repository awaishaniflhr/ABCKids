import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ActivityScreen, ResponsiveGrid } from './ActivityLayout';
import SoundPlayer from '../utills/SoundPlayer';

const NOTES = [
  { symbol: '♪', x: -0.32, color: '#FF7FA8', delay: 0 },
  { symbol: '♫', x: 0.3, color: '#4CC9B0', delay: 120 },
  { symbol: '♪', x: 0.05, color: '#FFB020', delay: 240 },
];
// Pause between repeats so a looping call stays pleasant, not nagging.
export const REPEAT_GAP_MS = 1200;
const COLORS = [
  '#43A4B5',
  '#E97665',
  '#8D83D7',
  '#F2B13D',
  '#30A58D',
  '#DD6D91',
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    Promise.resolve(AccessibilityInfo.isReduceMotionEnabled())
      .then(value => mounted && setReduced(Boolean(value)))
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

// A picture card that hops, wiggles and "sings" when tapped.
export const AnimalCard = memo(function AnimalCard({
  item,
  width,
  height,
  color,
  playing,
  taps,
  animate,
  onPress,
}) {
  const jump = useRef(new Animated.Value(0)).current;
  const notes = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!taps || !animate) return;
    jump.setValue(0);
    notes.setValue(0);
    const animation = Animated.parallel([
      Animated.timing(jump, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }),
      Animated.timing(notes, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
        isInteraction: false,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [animate, jump, notes, taps]);

  const name = item.name || item.sound.replace(/sound$/, '');
  const art = Math.min(width - 16, height - (item.name ? 46 : 22));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Play ${name.toLowerCase()} sound`}
      accessibilityState={{ selected: playing }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width, height, borderColor: color },
        playing && styles.playing,
        pressed && styles.pressed,
      ]}
    >
      <Animated.View
        style={[
          styles.artWrap,
          {
            transform: [
              {
                translateY: jump.interpolate({
                  inputRange: [0, 0.18, 0.36, 0.5, 1],
                  outputRange: [0, -height * 0.16, 0, -height * 0.05, 0],
                }),
              },
              {
                scale: jump.interpolate({
                  inputRange: [0, 0.18, 0.36, 0.45, 0.6, 1],
                  outputRange: [1, 1.16, 0.92, 1.06, 0.98, 1],
                }),
              },
              {
                rotate: jump.interpolate({
                  inputRange: [0, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
                  outputRange: [
                    '0deg',
                    '0deg',
                    '-9deg',
                    '8deg',
                    '-5deg',
                    '3deg',
                    '0deg',
                  ],
                }),
              },
            ],
          },
        ]}
      >
        <Image
          source={item.Image}
          resizeMode="contain"
          style={{ width: art, height: art }}
        />
      </Animated.View>
      {item.name ? (
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.name}>
          {item.name}
        </Text>
      ) : null}
      {taps > 0 && animate ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {NOTES.map((note, index) => (
            <Animated.Text
              key={index}
              style={[
                styles.note,
                {
                  left: width * (0.5 + note.x) - 10,
                  color: note.color,
                  opacity: notes.interpolate({
                    inputRange: [0, 0.1 + index * 0.08, 0.7, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [
                    {
                      translateY: notes.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -height * 0.55],
                      }),
                    },
                    {
                      translateX: notes.interpolate({
                        inputRange: [0, 0.33, 0.66, 1],
                        outputRange: [0, 6, -6, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {note.symbol}
            </Animated.Text>
          ))}
          {item.says ? (
            <Animated.View
              style={[
                styles.bubble,
                {
                  opacity: notes.interpolate({
                    inputRange: [0, 0.08, 0.75, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [
                    {
                      scale: notes.interpolate({
                        inputRange: [0, 0.12, 0.2, 1],
                        outputRange: [0.3, 1.15, 1, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text numberOfLines={1} style={styles.bubbleText}>
                {item.says}
              </Text>
            </Animated.View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
});

export default function SoundBoard({ navigation, title, data }) {
  const [selected, setSelected] = useState(null);
  // Counting taps restarts the animation even when the same card is tapped
  // again.
  const [taps, setTaps] = useState({});
  const reduced = useReducedMotion();
  const bump = useCallback(
    id => setTaps(previous => ({ ...previous, [id]: (previous[id] || 0) + 1 })),
    [],
  );
  // The chosen animal keeps calling (and hopping) until another one is
  // tapped or the child leaves this screen.
  const play = useCallback(
    item => {
      setSelected(item.id);
      bump(item.id);
      SoundPlayer.playSoundFile(item.sound, 'mp3', {
        repeat: true,
        gap: REPEAT_GAP_MS,
        onRepeat: () => bump(item.id),
      });
    },
    [bump],
  );
  useEffect(() => () => SoundPlayer.stop(), []);
  const named = data.some(item => item.name);
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
        itemHeight={named ? 138 : 120}
        renderItem={({ item, index, width, height }) => (
          <AnimalCard
            item={item}
            width={width}
            height={height}
            color={COLORS[index % COLORS.length]}
            playing={selected === item.id}
            taps={taps[item.id] || 0}
            animate={!reduced}
            onPress={() => play(item)}
          />
        )}
      />
    </ActivityScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 3,
    backgroundColor: '#FFFFFFF0',
    paddingTop: 4,
    paddingBottom: 6,
    overflow: 'visible',
  },
  playing: { backgroundColor: '#FFE6A1' },
  pressed: { opacity: 0.85 },
  artWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  name: {
    color: '#31516B',
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    includeFontPadding: false,
  },
  note: {
    position: 'absolute',
    bottom: '30%',
    fontSize: 22,
    fontWeight: '900',
  },
  bubble: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    maxWidth: '96%',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFB020',
    elevation: 4,
  },
  bubbleText: {
    color: '#E0661B',
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 14,
    includeFontPadding: false,
  },
});
