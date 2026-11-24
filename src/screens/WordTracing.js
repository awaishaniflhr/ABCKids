import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  AppState,
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
function WordRound({ item, index, total, onMove, onHome, active }) {
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
  const [index, setIndex] = useState(
    Number.isInteger(start) && start >= 0 && start < TRACING_WORDS.length
      ? start
      : 0,
  );
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
        active={focused && foreground}
      />
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
  tip: {
    flex: 1,
    textAlign: 'center',
    color: '#DDE4FF',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
});
