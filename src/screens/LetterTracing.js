import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../components/BackButton';
import TraceBuddy from '../components/TraceBuddy';
import TracingCanvas from '../components/TracingCanvas';
import {
  createTrace,
  getTracingLetter,
  pauseTrace,
  TRACING_LETTERS,
} from '../games/tracingLetters';
import { saveTracingStar } from '../games/tracingProgress';
import { ALPHABET } from '../games/learningData';
import useSpeech from '../games/useSpeech';
import { createTracingAudio } from '../games/tracingAudio';

export const TRACING_SUCCESS_MS = 3000;

const PAINTS = [
  { name: 'red', color: '#F26468' },
  { name: 'orange', color: '#F4AC45' },
  { name: 'blue', color: '#48A9E3' },
  { name: 'green', color: '#42B99A' },
  { name: 'purple', color: '#A17BDD' },
  { name: 'pink', color: '#EB89BD' },
];
const SPARKLES = [
  { x: 0.12, y: 0.2, color: '#F4B844' },
  { x: 0.8, y: 0.15, color: '#A17BDD' },
  { x: 0.2, y: 0.65, color: '#48A9E3' },
  { x: 0.75, y: 0.7, color: '#42B99A' },
  { x: 0.5, y: 0.1, color: '#EB89BD' },
  { x: 0.9, y: 0.45, color: '#F26468' },
];

function Celebration({ animate, nextLetter, compact }) {
  const reveal = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const badgeOpacity = animate
    ? reveal.interpolate({
        inputRange: [0, 0.08, 0.9, 1],
        outputRange: [0, 1, 1, 0],
      })
    : 1;
  const badgeScale = animate
    ? reveal.interpolate({
        inputRange: [0, 0.1, 0.18, 1],
        outputRange: [0.65, 1.08, 1, 1],
      })
    : 1;
  useEffect(() => {
    if (!animate) return;
    const animation = Animated.timing(reveal, {
      toValue: 1,
      duration: TRACING_SUCCESS_MS,
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animate, reveal]);
  return (
    <View
      testID="tracing-success"
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.celebration]}
    >
      {animate &&
        SPARKLES.map((star, index) => (
          <Animated.Text
            key={index}
            style={[
              styles.sparkle,
              {
                left: `${star.x * 100}%`,
                top: `${star.y * 100}%`,
                color: star.color,
                opacity: reveal.interpolate({
                  inputRange: [0, 0.15, 0.75, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateY: reveal.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-28, 45],
                    }),
                  },
                  {
                    rotate: reveal.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-30deg', '45deg'],
                    }),
                  },
                  {
                    scale: reveal.interpolate({
                      inputRange: [0, 0.2, 1],
                      outputRange: [0.3, 1.2, 0.8],
                    }),
                  },
                ],
              },
            ]}
          >
            {'\u2605'}
          </Animated.Text>
        ))}
      <Animated.View
        style={[
          styles.successBadge,
          compact && styles.compactSuccessBadge,
          {
            opacity: badgeOpacity,
            transform: [{ scale: badgeScale }],
          },
        ]}
      >
        <View
          style={[
            styles.successHeading,
            compact && styles.compactSuccessHeading,
          ]}
        >
          <Text
            style={[styles.successStars, compact && styles.compactSuccessStars]}
          >
            {compact ? '\u2605' : '\u2605 \u2605 \u2605'}
          </Text>
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.successTitle, compact && styles.compactSuccessTitle]}
          >
            Great job!
          </Text>
        </View>
        <Text style={styles.successNext}>
          {nextLetter ? `Next: ${nextLetter}` : 'Back to your letters'}
        </Text>
      </Animated.View>
    </View>
  );
}

function Control({ label, symbol, onPress, disabled, primary }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        primary && styles.primaryControl,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.controlSymbol, primary && styles.primaryText]}>
        {symbol}
      </Text>
      <Text
        numberOfLines={2}
        style={[styles.controlText, primary && styles.primaryText]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function TracingRound({ navigation, template }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width > height;
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(
    AppState.currentState !== 'background' &&
      AppState.currentState !== 'inactive',
  );
  const active = focused && foreground;
  const activeRef = useRef(active);
  activeRef.current = active;
  const [reducedMotion, setReducedMotion] = useState(false);
  const [trace, setTrace] = useState(createTrace);
  const [color, setColor] = useState(PAINTS[0].color);
  const [helpKey, setHelpKey] = useState(0);
  const [starError, setStarError] = useState(false);
  const tracingAudio = useRef(null);
  const advanceTimer = useRef(null);
  const celebrationRemaining = useRef(TRACING_SUCCESS_MS);
  const transitioned = useRef(false);
  const speak = useSpeech();
  const letter = template.letter;
  const index = TRACING_LETTERS.indexOf(template);
  const lesson = ALPHABET.find(item => item.Letter === letter);
  const word = lesson.ImageName === 'IceCream' ? 'Ice cream' : lesson.ImageName;
  const totalLength = template.strokes.reduce(
    (sum, stroke) => sum + stroke.length,
    0,
  );
  const paintedLength =
    template.strokes
      .slice(0, trace.strokeIndex)
      .reduce((sum, stroke) => sum + stroke.length, 0) + trace.progress;
  const percent = Math.min(
    100,
    Math.round((paintedLength / totalLength) * 100),
  );
  const instruction = trace.complete
    ? `Wonderful! ${letter} is for ${word}.`
    : trace.offTrack
    ? 'Find the glowing dot to keep going.'
    : trace.drawing
    ? 'Lovely! Keep following the dots.'
    : trace.strokeIndex > 0
    ? 'Great! Lift your finger, then find the next dot.'
    : 'Start at the glowing dot. Follow the dots!';

  useEffect(() => {
    const subscriptions = [
      AppState.addEventListener('change', state =>
        setForeground(state === 'active'),
      ),
      AppState.addEventListener('blur', () => setForeground(false)),
      AppState.addEventListener('focus', () =>
        setForeground(AppState.currentState === 'active'),
      ),
    ];
    return () => subscriptions.forEach(subscription => subscription.remove());
  }, []);
  useEffect(() => {
    if (!active) return;
    const audio = createTracingAudio();
    tracingAudio.current = audio;
    return () => {
      audio.release();
      if (tracingAudio.current === audio) tracingAudio.current = null;
    };
  }, [active]);
  const tracingMotion = useCallback(moving => {
    if (moving && activeRef.current) tracingAudio.current?.move();
    else tracingAudio.current?.stop();
  }, []);
  useEffect(() => {
    let mounted = true;
    Promise.resolve(AccessibilityInfo.isReduceMotionEnabled())
      .then(value => {
        if (mounted) setReducedMotion(Boolean(value));
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    if (!active)
      setTrace(previous =>
        previous.drawing ? pauseTrace(previous) : previous,
      );
  }, [active]);
  useEffect(() => {
    if (!trace.complete) return;
    let mounted = true;
    let narrationTimer;
    if (activeRef.current) {
      tracingAudio.current?.celebrate();
      narrationTimer = setTimeout(() => {
        if (activeRef.current) speak(lesson.pronounce);
      }, 1000);
    }
    saveTracingStar(letter).catch(() => {
      if (mounted) setStarError(true);
    });
    return () => {
      mounted = false;
      clearTimeout(narrationTimer);
    };
  }, [trace.complete, letter, lesson.pronounce, speak]);

  const nextLetter = useCallback(
    next => {
      if (next < 0 || transitioned.current) return;
      transitioned.current = true;
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
      tracingAudio.current?.reset();
      if (next >= TRACING_LETTERS.length) navigation.goBack();
      else navigation.setParams({ letter: TRACING_LETTERS[next].letter });
    },
    [navigation],
  );
  useEffect(() => {
    if (!trace.complete) {
      celebrationRemaining.current = TRACING_SUCCESS_MS;
      transitioned.current = false;
      return;
    }
    if (!active || transitioned.current) return;
    const started = Date.now();
    const timer = setTimeout(() => {
      if (activeRef.current) nextLetter(index + 1);
    }, celebrationRemaining.current);
    advanceTimer.current = timer;
    return () => {
      clearTimeout(timer);
      if (advanceTimer.current === timer) advanceTimer.current = null;
      celebrationRemaining.current = Math.max(
        0,
        celebrationRemaining.current - (Date.now() - started),
      );
    };
  }, [active, trace.complete, index, nextLetter]);

  function reset() {
    clearTimeout(advanceTimer.current);
    tracingAudio.current?.reset();
    setTrace(createTrace());
    setStarError(false);
    setHelpKey(key => key + 1);
  }
  function showGuide() {
    tracingAudio.current?.stop();
    if (trace.complete) {
      speak(lesson.pronounce);
      return;
    }
    setTrace(previous => pauseTrace(previous));
    setHelpKey(key => key + 1);
    speak(`Trace ${letter}. Start at dot ${trace.strokeIndex + 1}.`);
  }

  return (
    <View style={styles.screen}>
      <Image
        source={require('../assets/letterbg.jpg')}
        resizeMode="cover"
        pointerEvents="none"
        style={styles.background}
      />
      <StatusBar hidden />
      <View pointerEvents="none" style={styles.wash} />
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 6,
            paddingLeft: insets.left + 10,
            paddingRight: insets.right + 12,
          },
        ]}
      >
        <BackButton navigation={navigation} />
        <View style={styles.heading}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.title}>
            Letter Tracing
          </Text>
          <Text style={styles.subtitle}>Little strokes, big discoveries</Text>
        </View>
        <View style={styles.letterBadge}>
          <Text style={styles.letterBadgeText}>{letter}</Text>
        </View>
      </View>
      <View
        style={[
          styles.scene,
          wide && styles.wide,
          { paddingLeft: insets.left + 10, paddingRight: insets.right + 10 },
        ]}
      >
        <ScrollView
          style={[
            wide ? styles.wideBuddy : styles.portraitBuddy,
            wide && { width: Math.max(110, Math.min(180, width * 0.2)) },
          ]}
          contentContainerStyle={[
            styles.buddyPanel,
            wide && styles.wideBuddyContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <TraceBuddy
            size={wide ? Math.min(135, height * 0.35) : 78}
            happy={trace.complete}
            animate={active && !reducedMotion}
          />
          <View style={[styles.speech, wide && styles.wideSpeech]}>
            <Text style={styles.buddyTitle}>
              {trace.complete ? 'You did it!' : "Let's trace!"}
            </Text>
            <Text accessibilityLiveRegion="polite" style={styles.buddyText}>
              {instruction}
            </Text>
          </View>
          {trace.complete && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Hear ${lesson.pronounce}`}
              onPress={() => speak(lesson.pronounce)}
              style={[styles.wordCard, wide && styles.wideWordCard]}
            >
              <Image
                source={lesson.Image}
                resizeMode="contain"
                style={wide ? styles.wideWordImage : styles.wordImage}
              />
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.word}>
                {word}
              </Text>
            </Pressable>
          )}
        </ScrollView>
        <View style={styles.board}>
          <View style={styles.boardHeading}>
            <Text style={styles.strokeLabel}>
              {trace.complete
                ? '\u2605 Letter star earned!'
                : `Stroke ${trace.strokeIndex + 1} of ${
                    template.strokes.length
                  }`}
            </Text>
            <Text
              accessibilityLabel={`Tracing progress ${percent} percent`}
              style={styles.percent}
            >
              {percent}%
            </Text>
          </View>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Letter progress"
            accessibilityValue={{ min: 0, max: 100, now: percent }}
            style={styles.track}
          >
            <View
              style={[
                styles.trackFill,
                { width: `${percent}%`, backgroundColor: color },
              ]}
            />
          </View>
          <TracingCanvas
            template={template}
            trace={trace}
            color={color}
            active={active}
            reducedMotion={reducedMotion}
            helpKey={helpKey}
            onChange={setTrace}
            onMotion={tracingMotion}
          />
          {trace.complete && (
            <Celebration
              key={letter}
              animate={active && !reducedMotion}
              nextLetter={TRACING_LETTERS[index + 1]?.letter}
              compact={height < 400}
            />
          )}
          {starError && (
            <Text style={styles.saveError}>
              Letter finished! Your star could not be saved on this phone.
            </Text>
          )}
        </View>
        <ScrollView
          horizontal={!wide}
          style={wide ? styles.widePalette : styles.palette}
          contentContainerStyle={[
            styles.paintContent,
            wide && styles.verticalPaints,
          ]}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          {PAINTS.map(paint => (
            <Pressable
              key={paint.name}
              accessibilityRole="button"
              accessibilityLabel={`Use ${paint.name} paint`}
              accessibilityState={{ selected: color === paint.color }}
              onPress={() => setColor(paint.color)}
              style={[
                styles.swatch,
                { backgroundColor: paint.color },
                color === paint.color && styles.selectedPaint,
              ]}
            >
              {color === paint.color && (
                <Text style={styles.check}>{'\u2713'}</Text>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View
        style={[
          styles.controls,
          {
            paddingBottom: insets.bottom + 7,
            paddingLeft: insets.left + 10,
            paddingRight: insets.right + 10,
          },
        ]}
      >
        <Control
          label="Previous"
          symbol={'\u2039'}
          disabled={index === 0}
          onPress={() => nextLetter(index - 1)}
        />
        <Control label="Start again" symbol={'\u21bb'} onPress={reset} />
        <Control
          label={trace.complete ? 'Hear word' : 'Show me'}
          symbol={trace.complete ? '\u266b' : '\u261d'}
          onPress={showGuide}
        />
        <Control
          label={index === 25 ? 'All letters' : 'Next letter'}
          symbol={index === 25 ? '\u2605' : '\u203a'}
          disabled={!trace.complete}
          primary
          onPress={() => nextLetter(index + 1)}
        />
      </View>
    </View>
  );
}

export default function LetterTracing({ navigation, route }) {
  const template = getTracingLetter(route?.params?.letter);
  return (
    <TracingRound
      key={template.letter}
      navigation={navigation}
      template={template}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#DAF5F7' },
  background: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  wash: { ...StyleSheet.absoluteFill, backgroundColor: '#D8F6F54D' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 6,
    backgroundColor: '#FFFCF0EC',
  },
  heading: { flex: 1 },
  title: {
    color: '#354A77',
    fontFamily: 'Poppins-Bold',
    fontSize: 23,
    includeFontPadding: false,
  },
  subtitle: { color: '#71859B', fontSize: 11 },
  letterBadge: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#EDE9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterBadgeText: { color: '#8C78D5', fontSize: 28, fontWeight: '900' },
  scene: { flex: 1, minHeight: 0, paddingTop: 8, gap: 8 },
  wide: { flexDirection: 'row' },
  buddyPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  wideBuddy: { flexGrow: 0, flexShrink: 0 },
  portraitBuddy: { flexGrow: 0, maxHeight: 88 },
  wideBuddyContent: {
    flexDirection: 'column',
    flexGrow: 1,
    paddingVertical: 4,
  },
  wordImage: { width: 48, height: 48 },
  wideWordImage: { width: 70, height: 70 },
  speech: {
    flex: 1,
    backgroundColor: '#FFFFFFE8',
    padding: 10,
    borderRadius: 17,
  },
  wideSpeech: { flex: 0, alignSelf: 'stretch', padding: 8 },
  buddyTitle: { color: '#4A6990', fontFamily: 'Poppins-Bold', fontSize: 16 },
  buddyText: { color: '#607C8E', fontSize: 12, lineHeight: 17 },
  board: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    backgroundColor: '#FFFFFFD9',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 25,
    overflow: 'hidden',
    paddingTop: 6,
  },
  boardHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 6,
  },
  strokeLabel: { flex: 1, fontSize: 12, fontWeight: '800', color: '#7E76B7' },
  percent: { fontSize: 12, fontWeight: '800', color: '#7894A4' },
  track: {
    height: 5,
    backgroundColor: '#EBE9F6',
    marginHorizontal: 13,
    borderRadius: 3,
    marginTop: 5,
  },
  trackFill: { height: '100%', borderRadius: 3 },
  palette: { flexGrow: 0, maxHeight: 62 },
  widePalette: { flexGrow: 0, width: 66 },
  paintContent: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 6,
  },
  verticalPaints: { flexDirection: 'column', justifyContent: 'flex-start' },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 18,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPaint: { borderColor: '#405C7B' },
  check: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  controls: { flexDirection: 'row', gap: 8, paddingTop: 7 },
  control: {
    flex: 1,
    minHeight: 52,
    borderRadius: 17,
    backgroundColor: '#FFFFFFF5',
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#CFDFE9',
  },
  controlSymbol: {
    color: '#6789A6',
    fontSize: 22,
    lineHeight: 25,
    fontWeight: '800',
  },
  controlText: {
    color: '#4A6A86',
    fontWeight: '800',
    fontSize: 10,
    textAlign: 'center',
  },
  primaryControl: { backgroundColor: '#6ABEA5', borderBottomColor: '#39987F' },
  primaryText: { color: '#FFFFFF' },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.7 },
  wordCard: {
    backgroundColor: '#FFF5D9',
    borderRadius: 17,
    padding: 6,
    alignItems: 'center',
    minWidth: 68,
  },
  wideWordCard: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  word: { color: '#A6782D', fontSize: 14, fontWeight: '800', flexShrink: 1 },
  sparkle: { position: 'absolute', fontSize: 29 },
  successBadge: {
    alignSelf: 'center',
    maxWidth: '90%',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFFAE9F5',
    borderWidth: 3,
    borderColor: '#F5CE6D',
  },
  celebration: { alignItems: 'center', justifyContent: 'center', padding: 8 },
  successHeading: { alignItems: 'center' },
  compactSuccessHeading: { flexDirection: 'row', gap: 8 },
  compactSuccessBadge: { paddingVertical: 8, paddingHorizontal: 18 },
  compactSuccessStars: { fontSize: 24 },
  compactSuccessTitle: { fontSize: 22 },
  successStars: { color: '#EFB43E', fontSize: 30 },
  successTitle: { color: '#4A6990', fontFamily: 'Poppins-Bold', fontSize: 26 },
  successNext: {
    color: '#8B7BAA',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  saveError: {
    color: '#9D6E43',
    textAlign: 'center',
    padding: 6,
    fontSize: 10,
  },
});
