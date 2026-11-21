import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Sound from 'react-native-sound';
import SingAlongBackdrop from './SingAlongBackdrop';
import { activeLine, activeWord, formatTime } from '../games/poemLyrics';

export const TICK_MS = 100;
// Light each word up a moment early, so the highlight lands as the word is
// sung rather than just after (polling and drawing take a little time).
export const LEAD_SECONDS = 0.15;

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

// ---------------------------------------------------------------- audio
// Loads, plays and reports progress for one song at a time.
function useSong(song, { visible, autoPlay, onEnded }) {
  const soundRef = useRef(null);
  const endedRef = useRef(onEnded);
  endedRef.current = onEnded;
  const [state, setState] = useState({
    ready: false,
    playing: false,
    time: 0,
    duration: 0,
    error: false,
  });

  useEffect(() => {
    if (!visible || !song) return undefined;
    let alive = true;
    setState({
      ready: false,
      playing: false,
      time: 0,
      duration: 0,
      error: false,
    });
    // react-native-sound expects a URI rather than a Metro asset id.
    const uri = Image.resolveAssetSource(song.audio)?.uri;
    if (!uri) {
      setState(previous => ({ ...previous, error: true }));
      return undefined;
    }
    const sound = new Sound(uri, '', error => {
      if (!alive) {
        sound.release();
        return;
      }
      if (error) {
        setState(previous => ({ ...previous, error: true }));
        return;
      }
      soundRef.current = sound;
      setState(previous => ({
        ...previous,
        ready: true,
        duration: sound.getDuration(),
      }));
      if (autoPlay) start();
    });
    function start() {
      setState(previous => ({ ...previous, playing: true }));
      sound.play(success => {
        if (!alive) return;
        setState(previous => ({ ...previous, playing: false }));
        if (success) endedRef.current?.();
      });
    }
    return () => {
      alive = false;
      soundRef.current = null;
      sound.stop();
      sound.release();
    };
    // autoPlay is read once per song on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song, visible]);

  // Follow the playback position while playing.
  useEffect(() => {
    if (!state.playing) return undefined;
    const timer = setInterval(() => {
      soundRef.current?.getCurrentTime(seconds =>
        setState(previous =>
          previous.playing ? { ...previous, time: seconds } : previous,
        ),
      );
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [state.playing]);

  const pause = useCallback(() => {
    soundRef.current?.pause();
    setState(previous => ({ ...previous, playing: false }));
  }, []);
  const play = useCallback(() => {
    const sound = soundRef.current;
    if (!sound) return;
    setState(previous => ({ ...previous, playing: true }));
    sound.play(success => {
      if (soundRef.current !== sound) return;
      setState(previous => ({ ...previous, playing: false }));
      if (success) endedRef.current?.();
    });
  }, []);

  // Pause when the app goes to the background.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      if (next !== 'active') pause();
    });
    return () => subscription.remove();
  }, [pause]);

  return { ...state, play, pause };
}

// ---------------------------------------------------------------- lyrics
const Word = memo(function Word({ text, state, color, animate }) {
  const pop = useRef(new Animated.Value(state === 'now' ? 1 : 0)).current;
  useEffect(() => {
    if (!animate) return;
    Animated.spring(pop, {
      toValue: state === 'now' ? 1 : 0,
      friction: 4,
      tension: 140,
      useNativeDriver: true,
      isInteraction: false,
    }).start();
  }, [animate, pop, state]);
  return (
    <Animated.Text
      style={[
        styles.word,
        state === 'sung' && { color },
        state === 'now' && [styles.wordNow, { color }],
        {
          transform: [
            {
              scale: pop.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.18],
              }),
            },
            {
              translateY: pop.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -4],
              }),
            },
          ],
        },
      ]}
    >
      {text}
    </Animated.Text>
  );
});

function BouncingStar({ animate }) {
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!animate) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, bounce]);
  return (
    <Animated.Text
      style={[
        styles.star,
        {
          transform: [
            {
              translateY: bounce.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -10],
              }),
            },
          ],
        },
      ]}
    >
      {'★'}
    </Animated.Text>
  );
}

const Line = memo(function Line({
  text,
  state,
  word,
  color,
  animate,
  onLayout,
}) {
  const words = text.split(' ');
  if (state !== 'now') {
    return (
      <Text
        onLayout={onLayout}
        style={[
          styles.line,
          state === 'sung' ? styles.lineSung : styles.lineNext,
        ]}
      >
        {text}
      </Text>
    );
  }
  return (
    <View
      onLayout={onLayout}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={text}
      style={[styles.lineNow, { borderColor: color }]}
    >
      {words.map((item, index) => (
        <View key={index} style={styles.wordBox}>
          {index === word ? <BouncingStar animate={animate} /> : null}
          <Word
            text={item}
            state={index < word ? 'sung' : index === word ? 'now' : 'next'}
            color={color}
            animate={animate}
          />
        </View>
      ))}
    </View>
  );
});

// ---------------------------------------------------------------- player
export default function PoemPlayer({
  songs,
  index,
  visible,
  color = '#FF7FA8',
  onClose,
  onChangeIndex,
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const animate = !useReducedMotion();
  const song = songs[index];
  const hasNext = index < songs.length - 1;
  const hasPrevious = index > 0;
  const next = useCallback(() => {
    if (index < songs.length - 1) onChangeIndex(index + 1);
  }, [index, onChangeIndex, songs.length]);
  const audio = useSong(song, {
    visible,
    autoPlay: true,
    onEnded: hasNext ? next : undefined,
  });
  const lines = song?.lyrics || [];
  const singTime = audio.time + LEAD_SECONDS;
  const lineIndex = activeLine(lines, singTime);
  const wordIndex = activeWord(lines, lineIndex, singTime, audio.duration);

  // Keep the line being sung in the middle of the lyrics area.
  const scroll = useRef(null);
  const offsets = useRef({});
  const [area, setArea] = useState(0);
  useEffect(() => {
    offsets.current = {};
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [song]);
  useEffect(() => {
    const y = offsets.current[lineIndex];
    if (y === undefined || !area) return;
    scroll.current?.scrollTo({
      y: Math.max(0, y - area * 0.35),
      animated: true,
    });
  }, [area, lineIndex]);

  if (!song) return null;
  const progress = audio.duration
    ? Math.min(1, audio.time / audio.duration)
    : 0;
  const compact = height < 500;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.screen,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 10,
            paddingLeft: insets.left + 12,
            paddingRight: insets.right + 12,
          },
        ]}
      >
        <SingAlongBackdrop sun={false} />
        <View style={styles.header}>
          <View style={[styles.artBubble, { borderColor: color }]}>
            <Image
              source={song.cover || song.img}
              style={song.cover ? styles.cover : styles.art}
              resizeMode={song.cover ? 'cover' : 'contain'}
            />
          </View>
          <View style={styles.titleBox}>
            <Text numberOfLines={2} style={styles.title}>
              {song.title}
            </Text>
            <Text style={styles.counter}>
              Song {index + 1} of {songs.length}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close player"
            onPress={onClose}
            hitSlop={10}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
          >
            <Text style={styles.closeText}>{'✕'}</Text>
          </Pressable>
        </View>

        <View
          style={styles.lyricsCard}
          onLayout={({ nativeEvent }) => setArea(nativeEvent.layout.height)}
        >
          {lines.length ? (
            <ScrollView
              ref={scroll}
              contentContainerStyle={[
                styles.lyrics,
                { paddingBottom: area * 0.6 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {lines.map((line, position) => (
                <Line
                  key={`${song.id}-${position}`}
                  text={line.text}
                  state={
                    position < lineIndex
                      ? 'sung'
                      : position === lineIndex
                      ? 'now'
                      : 'next'
                  }
                  word={position === lineIndex ? wordIndex : -1}
                  color={color}
                  animate={animate}
                  onLayout={({ nativeEvent }) => {
                    offsets.current[position] = nativeEvent.layout.y;
                  }}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noLyrics}>
              {'♫'} Sing along! {'♫'}
            </Text>
          )}
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.time}>{formatTime(audio.time)}</Text>
          <View style={styles.track}>
            <View
              style={[
                styles.trackFill,
                { width: `${progress * 100}%`, backgroundColor: color },
              ]}
            />
          </View>
          <Text style={styles.time}>{formatTime(audio.duration)}</Text>
        </View>

        <View style={[styles.controls, compact && styles.controlsCompact]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous poem"
            accessibilityState={{ disabled: !hasPrevious }}
            disabled={!hasPrevious}
            onPress={() => onChangeIndex(index - 1)}
            style={({ pressed }) => [
              styles.skip,
              !hasPrevious && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.skipText}>{'⏮'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={audio.playing ? 'Pause' : 'Play'}
            disabled={!audio.ready}
            onPress={audio.playing ? audio.pause : audio.play}
            style={({ pressed }) => [
              styles.playButton,
              { backgroundColor: color },
              !audio.ready && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.playText}>{audio.playing ? '❚❚' : '▶'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next poem"
            accessibilityState={{ disabled: !hasNext }}
            disabled={!hasNext}
            onPress={next}
            style={({ pressed }) => [
              styles.skip,
              !hasNext && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.skipText}>{'⏭'}</Text>
          </Pressable>
        </View>
        {audio.error ? (
          <Text style={styles.error}>Sorry, this song could not play.</Text>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  artBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    backgroundColor: '#FFFFFFEE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  art: { width: 46, height: 46 },
  cover: { width: '100%', height: '100%' },
  titleBox: {
    flex: 1,
    backgroundColor: '#FFFFFFD9',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  title: {
    color: '#3D3A8C',
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 19,
    includeFontPadding: false,
  },
  counter: {
    color: '#6B6FA8',
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    includeFontPadding: false,
  },
  close: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF6B6B',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  closeText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  lyricsCard: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#FFFFFFD9',
    borderRadius: 26,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  lyrics: {
    paddingHorizontal: 14,
    paddingTop: 18,
    alignItems: 'center',
    gap: 10,
  },
  line: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    textAlign: 'center',
    includeFontPadding: false,
  },
  lineSung: { color: '#9AA3BF' },
  lineNext: { color: '#56607F' },
  lineNow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 8,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: '#FFFBEA',
  },
  wordBox: { alignItems: 'center', marginHorizontal: 4 },
  word: {
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 26,
    color: '#8A93AE',
    includeFontPadding: false,
  },
  wordNow: { textShadowColor: '#FFFFFF', textShadowRadius: 6 },
  star: {
    position: 'absolute',
    top: -16,
    fontSize: 16,
    color: '#FFB020',
  },
  noLyrics: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#56607F',
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  time: {
    minWidth: 40,
    textAlign: 'center',
    color: '#31416B',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFFAA',
    overflow: 'hidden',
  },
  trackFill: { height: '100%', borderRadius: 5 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  controlsCompact: { gap: 18 },
  skip: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFFEE',
    borderWidth: 3,
    borderColor: '#7E8CF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: { fontSize: 24, color: '#5B5FD6' },
  playButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  playText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    includeFontPadding: false,
  },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.95 }] },
  error: {
    textAlign: 'center',
    color: '#B0413E',
    fontFamily: 'Poppins-SemiBold',
  },
});
