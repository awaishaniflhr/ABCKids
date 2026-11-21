import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import {
  Arrow,
  Backdrop,
  HomeButton,
  Pill,
  SuccessCard,
} from '../components/TracingScene';
import {
  createDotTrace,
  DOT_BOX,
  DOT_LETTERS,
  DOT_RADIUS,
  drawDots,
  isDotFilled,
  WRITING_LINES,
} from '../games/dotTracing';
import { canvasGeometry, canvasPoint } from '../games/tracingLetters';
import { ALPHABET } from '../games/learningData';
import { createTracingAudio } from '../games/tracingAudio';
import useSpeech from '../games/useSpeech';

export const DOT_SUCCESS_MS = 3000;
const PEN = '#F0567A';
const FILLED = '#22B573';
const PEN_WIDTH = 13;

export function dotLesson(letter) {
  const item = ALPHABET.find(entry => entry.Letter === letter);
  const word = item?.ImageName === 'IceCream' ? 'Ice cream' : item?.ImageName;
  return {
    word: word || letter,
    image: item?.Image || null,
    pronounce: item?.pronounce || letter,
  };
}

const toPath = points =>
  points
    .map(
      (point, index) =>
        `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
    )
    .join(' ');

// ---------------------------------------------------------------- board
const DotBoard = memo(function DotBoard({
  letter,
  trace,
  active,
  onChange,
  onMotion,
}) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [ink, setInk] = useState([]);
  const latest = useRef();
  const pen = useRef(null);
  latest.current = { letter, trace, active, onChange, onMotion, layout };

  const lift = useCallback(() => {
    pen.current = null;
    latest.current.onMotion?.(false);
  }, []);
  useEffect(() => {
    if (!active) lift();
  }, [active, lift]);

  function touch(event, start) {
    const current = latest.current;
    if (!current.active || !current.layout.width) return;
    const native = event.nativeEvent;
    const contact = start
      ? native.touches?.[0] || native
      : (native.touches || [native]).find(
          item => (item.identifier ?? 0) === pen.current?.id,
        );
    if (!contact) return;
    const point = canvasPoint(
      { x: contact.locationX, y: contact.locationY },
      current.layout.width,
      current.layout.height,
      DOT_BOX,
    );
    const { scale } = canvasGeometry(
      current.layout.width,
      current.layout.height,
      DOT_BOX,
    );
    const from = start ? null : pen.current?.last;
    if (start) {
      pen.current = { id: contact.identifier ?? 0, last: point };
      setInk(lines => [...lines, [point]]);
    } else {
      if (!pen.current) return;
      // Skip tiny jitters so the ink stays smooth and cheap to draw.
      if (Math.hypot(point.x - from.x, point.y - from.y) < 2) return;
      pen.current.last = point;
      setInk(lines => {
        const copy = lines.slice();
        copy[copy.length - 1] = [...copy[copy.length - 1], point];
        return copy;
      });
      current.onMotion?.(true);
    }
    if (current.trace.complete) return;
    const radius = Math.max(24, Math.min(40, 22 / scale));
    const next = drawDots(current.trace, current.letter, from, point, radius);
    if (next !== current.trace) {
      current.trace = next;
      current.onChange(next);
    }
  }

  const nextDot =
    !trace.complete && letter.strokes[trace.strokeIndex]?.dots[trace.filled];
  return (
    <View
      testID="dot-board"
      accessibilityLabel={`Draw the letter ${letter.letter}. Draw over the dots.`}
      style={styles.board}
      onLayout={({ nativeEvent: { layout: next } }) => {
        if (next.width !== layout.width || next.height !== layout.height) {
          lift();
          setLayout({ width: next.width, height: next.height });
        }
      }}
      onStartShouldSetResponder={() => active}
      onMoveShouldSetResponder={() => active}
      onResponderGrant={event => touch(event, true)}
      onResponderMove={event => touch(event, false)}
      onResponderRelease={lift}
      onResponderTerminate={lift}
      onResponderTerminationRequest={() => true}
    >
      <Svg
        pointerEvents="none"
        width="100%"
        height="100%"
        viewBox={`${DOT_BOX.x} ${DOT_BOX.y} ${DOT_BOX.width} ${DOT_BOX.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {WRITING_LINES.map(y => (
          <Line
            key={y}
            x1={DOT_BOX.x - 400}
            x2={DOT_BOX.x + DOT_BOX.width + 400}
            y1={y}
            y2={y}
            stroke="#5D72D8"
            strokeWidth={3}
            strokeLinecap="round"
          />
        ))}
        {letter.strokes.map((stroke, strokeIndex) => (
          <G
            key={`arrow-${strokeIndex}`}
            opacity={
              trace.complete || strokeIndex >= trace.strokeIndex ? 0.95 : 0.35
            }
            transform={`translate(${stroke.arrow.x} ${stroke.arrow.y}) rotate(${stroke.arrow.angle})`}
          >
            <Path
              d="M-13 0 L13 0 M4 -8 L13 0 L4 8"
              stroke="#FFFFFF"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </G>
        ))}
        {letter.strokes.map((stroke, strokeIndex) =>
          stroke.dots.map((dot, dotIndex) => (
            <Circle
              key={`dot-${strokeIndex}-${dotIndex}`}
              testID={
                isDotFilled(trace, strokeIndex, dotIndex)
                  ? 'dot-filled'
                  : 'dot-empty'
              }
              cx={dot.x}
              cy={dot.y}
              r={DOT_RADIUS}
              fill={
                isDotFilled(trace, strokeIndex, dotIndex) ? FILLED : '#FFFFFF'
              }
            />
          )),
        )}
        {nextDot && (
          <Circle
            cx={nextDot.x}
            cy={nextDot.y}
            r={DOT_RADIUS + 5}
            fill="none"
            stroke="#FFD34E"
            strokeWidth={4}
          />
        )}
        {ink.map((points, index) =>
          points.length > 1 ? (
            <Path
              key={`ink-${index}`}
              d={toPath(points)}
              stroke={PEN}
              strokeWidth={PEN_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ) : (
            <Circle
              key={`ink-${index}`}
              cx={points[0].x}
              cy={points[0].y}
              r={PEN_WIDTH / 2}
              fill={PEN}
            />
          ),
        )}
      </Svg>
    </View>
  );
});

// ---------------------------------------------------------------- one letter
function DotRound({ index, onMove, onHome, active }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width > height;
  const letter = DOT_LETTERS[index];
  const lesson = dotLesson(letter.letter);
  const next = DOT_LETTERS[index + 1];
  const activeRef = useRef(active);
  activeRef.current = active;
  const speak = useSpeech();
  const audio = useRef(null);
  const [trace, setTrace] = useState(createDotTrace);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!active) return;
    const player = createTracingAudio();
    audio.current = player;
    return () => {
      player?.release();
      if (audio.current === player) audio.current = null;
    };
  }, [active]);
  const motion = useCallback(moving => {
    if (moving && activeRef.current) audio.current?.move();
    else audio.current?.stop();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeRef.current) speak(lesson.pronounce);
    }, 450);
    return () => clearTimeout(timer);
  }, [lesson.pronounce, speak]);
  useEffect(() => {
    if (!trace.complete || !activeRef.current) return;
    audio.current?.celebrate();
    const timer = setTimeout(() => {
      if (activeRef.current) speak(`Great job! ${lesson.pronounce}`);
    }, 700);
    return () => clearTimeout(timer);
  }, [trace.complete, lesson.pronounce, speak]);
  useEffect(() => {
    if (!trace.complete || !active) return;
    const timer = setTimeout(() => onMove(index + 1), DOT_SUCCESS_MS);
    return () => clearTimeout(timer);
  }, [trace.complete, active, index, onMove]);

  function restart() {
    audio.current?.reset();
    setTrace(createDotTrace());
    setAttempt(value => value + 1);
  }

  const arrowSize = wide ? Math.min(84, height * 0.2) : 62;
  const caption = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Hear ${lesson.pronounce}`}
      onPress={() => speak(lesson.pronounce)}
      style={({ pressed }) => [styles.caption, pressed && styles.pressed]}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.captionText, !wide && styles.captionTall]}
      >
        {letter.letter} for {lesson.word.toUpperCase()}
      </Text>
      {lesson.image && (
        <Image
          source={lesson.image}
          resizeMode="contain"
          style={wide ? styles.captionImage : styles.captionImageTall}
        />
      )}
    </Pressable>
  );
  const stage = (
    <View style={styles.stage}>
      <View style={styles.boardWrap}>
        <DotBoard
          key={`${letter.letter}-${attempt}`}
          letter={letter}
          trace={trace}
          active={active}
          onChange={setTrace}
          onMotion={motion}
        />
        {trace.complete && (
          <SuccessCard
            word={`${letter.letter} for ${lesson.word}`}
            image={lesson.image}
            nextLabel={
              next ? `Next letter: ${next.letter}` : 'All letters done!'
            }
            animate={active}
            compact={height < 420 || width < 420}
          />
        )}
      </View>
      {caption}
    </View>
  );
  const back = (
    <Arrow
      direction="back"
      label="Previous letter"
      size={arrowSize}
      disabled={index === 0}
      onPress={() => onMove(index - 1)}
    />
  );
  const forward = (
    <Arrow
      direction="next"
      label="Next letter"
      size={arrowSize}
      disabled={index === DOT_LETTERS.length - 1 && !trace.complete}
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
              {index + 1} / {DOT_LETTERS.length}
            </Text>
          </View>
          <Pill label="Start again" symbol={'↻'} onPress={restart} />
        </View>
      </View>
      {wide ? (
        <View style={styles.wideStage}>
          {back}
          {stage}
          {forward}
        </View>
      ) : (
        <>
          <View style={styles.tallStage}>{stage}</View>
          <View style={styles.bottomArrows}>
            {back}
            <Text style={styles.tip} numberOfLines={2}>
              {trace.complete
                ? 'Well done!'
                : 'Draw over the dots. Follow the arrows!'}
            </Text>
            {forward}
          </View>
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------- screen
export default function DotTracing({ navigation, route }) {
  const requested = DOT_LETTERS.findIndex(
    item => item.letter === String(route?.params?.letter ?? '').toUpperCase(),
  );
  const [index, setIndex] = useState(Math.max(0, requested));
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
      if (target >= DOT_LETTERS.length) navigation.goBack();
      else setIndex(target);
    },
    [navigation],
  );
  const onHome = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <Backdrop />
      <DotRound
        key={index}
        index={index}
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
    marginTop: -30,
  },
  tallStage: { flex: 1, justifyContent: 'center', paddingVertical: 12 },
  stage: { flex: 1, alignSelf: 'stretch', minWidth: 0, minHeight: 0 },
  boardWrap: { flex: 1, minHeight: 0 },
  board: { flex: 1, overflow: 'hidden' },
  caption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 2,
  },
  captionText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 28,
    includeFontPadding: false,
    flexShrink: 1,
  },
  captionTall: { fontSize: 30 },
  captionImage: { width: 56, height: 56 },
  captionImageTall: { width: 84, height: 84 },
  pressed: { opacity: 0.7 },
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
