import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  AppState,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TracingCanvas from '../components/TracingCanvas';
import {
  Arrow,
  Backdrop,
  HomeButton,
  Pill,
  SuccessCard,
} from '../components/TracingScene';
import { createTrace, pauseTrace } from '../games/tracingLetters';
import { TRACING_WORDS } from '../games/tracingWords';
import { createTracingAudio } from '../games/tracingAudio';
import useSpeech from '../games/useSpeech';
import AppIcon from '../components/AppIcon';
import {
  nextUnfinished,
  readWordTracingDone,
  saveWordTracingDone,
} from '../games/tracingProgress';
import { useScreenMusic } from '../services/audio';
import { usePlayReminder } from '../services/reminders';

export const WORD_SUCCESS_MS = 3000;

const BOARD_THEME = {
  outline: '#8A4B23',
  paper: '#FFFDF7',
  dots: '#F0A33A',
  idleDots: '#F2D2A4',
  beacon: 28,
  startDots: true,
};
const PAINTS = ['#4FC3F7', '#7BD389', '#FFB74D', '#B98AE0', '#F48FB1'];

// ---------------------------------------------------------------- one word
// `onDone` is told once the word is fully traced, so it can be saved.
function WordRound({ item, index, total, onMove, onHome, onDone, active }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width > height;
  const activeRef = useRef(active);
  activeRef.current = active;
  const speak = useSpeech();
  const tracingAudio = useRef(null);
  const [trace, setTrace] = useState(createTrace);
  const [helpKey, setHelpKey] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const color = PAINTS[index % PAINTS.length];
  const next = TRACING_WORDS[index + 1];

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
    if (!active) return;
    const audio = createTracingAudio();
    tracingAudio.current = audio;
    return () => {
      audio?.release();
      if (tracingAudio.current === audio) tracingAudio.current = null;
    };
  }, [active]);
  useEffect(() => {
    if (!active)
      setTrace(previous =>
        previous.drawing ? pauseTrace(previous) : previous,
      );
  }, [active]);
  const tracingMotion = useCallback(moving => {
    if (moving && activeRef.current) tracingAudio.current?.move();
    else tracingAudio.current?.stop();
  }, []);

  // Say the word when it first appears.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeRef.current) speak(item.word);
    }, 450);
    return () => clearTimeout(timer);
  }, [item.word, speak]);

  // Celebrate once, then move on by itself after the success message.
  useEffect(() => {
    if (!trace.complete || !activeRef.current) return;
    tracingAudio.current?.celebrate();
    const timer = setTimeout(() => {
      if (activeRef.current) speak(`Great job! ${item.word}`);
    }, 700);
    return () => clearTimeout(timer);
  }, [trace.complete, item.word, speak]);
  // Save the word as finished straight away, so it's kept even if the child
  // leaves or the app closes before moving on.
  useEffect(() => {
    if (trace.complete) onDone?.(item.word);
  }, [trace.complete, item.word, onDone]);
  useEffect(() => {
    if (!trace.complete || !active) return;
    const timer = setTimeout(() => onMove(index + 1), WORD_SUCCESS_MS);
    return () => clearTimeout(timer);
  }, [trace.complete, active, index, onMove]);

  function restart() {
    tracingAudio.current?.reset();
    setTrace(createTrace());
    setHelpKey(key => key + 1);
  }
  function hear() {
    tracingAudio.current?.stop();
    speak(item.word);
    if (!trace.complete) {
      setTrace(previous => pauseTrace(previous));
      setHelpKey(key => key + 1);
    }
  }

  const arrowSize = wide ? Math.min(84, height * 0.2) : 62;
  const board = (
    <View style={styles.board}>
      <TracingCanvas
        template={item}
        trace={trace}
        color={color}
        active={active}
        reducedMotion={reducedMotion}
        helpKey={helpKey}
        onChange={setTrace}
        onMotion={tracingMotion}
        theme={BOARD_THEME}
      />
      {trace.complete && (
        <SuccessCard
          word={item.word}
          image={item.image}
          nextLabel={
            next ? `Next word: ${next.word}` : 'You traced every word!'
          }
          animate={active && !reducedMotion}
          compact={height < 420 || width < 420}
        />
      )}
    </View>
  );
  const back = (
    <Arrow
      direction="back"
      label="Previous word"
      size={arrowSize}
      disabled={index === 0}
      onPress={() => onMove(index - 1)}
    />
  );
  const forward = (
    <Arrow
      direction="next"
      label="Next word"
      size={arrowSize}
      disabled={index === total - 1 && !trace.complete}
      onPress={() => onMove(index + 1)}
    />
  );

  return (
    <View
      style={[
        styles.round,
        {
          paddingTop: insets.top + 6,
          paddingBottom: insets.bottom + 8,
          paddingLeft: insets.left + 10,
          paddingRight: insets.right + 10,
        },
      ]}
    >
      <View style={styles.topBar}>
        <HomeButton onPress={onHome} />
        <View style={styles.topRight}>
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {index + 1} / {total}
            </Text>
          </View>
          <Pill label={`Hear ${item.word}`} icon="sound" onPress={hear} />
          <Pill label="Start again" icon="replay" onPress={restart} />
        </View>
      </View>
      {wide ? (
        <View style={styles.wideStage}>
          {back}
          {board}
          {forward}
        </View>
      ) : (
        <>
          <View style={styles.tallStage}>{board}</View>
          <View style={styles.bottomArrows}>
            {back}
            <Text style={styles.tip} numberOfLines={2}>
              {trace.complete
                ? `You traced ${item.word}!`
                : 'Follow the numbered dots'}
            </Text>
            {forward}
          </View>
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------- screen
export default function WordTracing({ navigation, route }) {
  const start = Number(route?.params?.index);
  const startGiven =
    Number.isInteger(start) && start >= 0 && start < TRACING_WORDS.length;
  const [index, setIndex] = useState(startGiven ? start : 0);
  // Calm, quiet music while tracing.
  useScreenMusic('tracing');
  // When a child comes back with some words already finished, offer to
  // continue from the next unfinished word (or start over).
  const [resumeAt, setResumeAt] = useState(null);
  useEffect(() => {
    if (startGiven) return undefined;
    let mounted = true;
    readWordTracingDone()
      .then(done => {
        const next = nextUnfinished(
          TRACING_WORDS.map(item => item.word),
          done,
        );
        if (mounted && next) {
          setResumeAt(TRACING_WORDS.findIndex(item => item.word === next));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
    // Only when the game opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onDone = useCallback(word => {
    saveWordTracingDone(word).catch(() => {});
  }, []);
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(
    AppState.currentState !== 'background' &&
      AppState.currentState !== 'inactive',
  );
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state =>
      setForeground(state === 'active'),
    );
    return () => subscription.remove();
  }, []);
  // Leaving with words still to trace sets a play reminder for later.
  usePlayReminder('words', focused && foreground);
  const onMove = useCallback(
    target => {
      if (target < 0) return;
      if (target >= TRACING_WORDS.length) navigation.goBack();
      else setIndex(target);
    },
    [navigation],
  );
  const onHome = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <Backdrop />
      <WordRound
        key={index}
        item={TRACING_WORDS[index]}
        index={index}
        total={TRACING_WORDS.length}
        onMove={onMove}
        onHome={onHome}
        onDone={onDone}
        active={focused && foreground && resumeAt === null}
      />
      {resumeAt !== null && (
        <ResumeCard
          word={TRACING_WORDS[resumeAt].word}
          onContinue={() => {
            setIndex(resumeAt);
            setResumeAt(null);
          }}
          onStartOver={() => {
            setIndex(0);
            setResumeAt(null);
          }}
        />
      )}
    </View>
  );
}

// "Welcome back" card: Continue with the next unfinished word, or start over.
function ResumeCard({ word, onContinue, onStartOver }) {
  return (
    <View accessibilityViewIsModal style={styles.resumeLayer}>
      <View style={styles.resumeCard}>
        <Text accessibilityRole="header" style={styles.resumeTitle}>
          Welcome back!
        </Text>
        <Text style={styles.resumeText}>Ready for the next word?</Text>
        <View style={styles.resumeActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start over"
            onPress={onStartOver}
            hitSlop={8}
            style={({ pressed }) => [
              styles.resumeOption,
              pressed && styles.resumePressed,
            ]}
          >
            <AppIcon name="replay" size={52} />
            <Text style={styles.resumeLabel}>Start over</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Continue with ${word}`}
            onPress={onContinue}
            hitSlop={8}
            style={({ pressed }) => [
              styles.resumeOption,
              pressed && styles.resumePressed,
            ]}
          >
            <AppIcon name="next" size={68} />
            <Text style={[styles.resumeLabel, styles.resumeMain]}>
              Continue: {word}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#1A30A8' },
  round: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counter: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF22',
  },
  counterText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    includeFontPadding: false,
  },
  wideStage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -24,
  },
  tallStage: { flex: 1, justifyContent: 'center', paddingVertical: 12 },
  board: { flex: 1, alignSelf: 'stretch', minWidth: 0, minHeight: 0 },
  bottomArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  resumeLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    elevation: 10,
    backgroundColor: '#0D1A5ACC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  resumeCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 28,
    backgroundColor: '#FFFAE9',
    borderWidth: 4,
    borderColor: '#F5CE6D',
  },
  resumeTitle: {
    color: '#2B3A8C',
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    includeFontPadding: false,
  },
  resumeText: {
    color: '#5A6795',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    marginTop: 4,
  },
  resumeActions: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 32,
    marginTop: 16,
  },
  resumeOption: { alignItems: 'center', gap: 4 },
  resumePressed: { opacity: 0.75, transform: [{ scale: 0.95 }] },
  resumeLabel: {
    color: '#5A6795',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
  },
  resumeMain: { color: '#1E7A4C', fontFamily: 'Poppins-Bold', fontSize: 15 },
  tip: {
    flex: 1,
    textAlign: 'center',
    color: '#DDE4FF',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
});
