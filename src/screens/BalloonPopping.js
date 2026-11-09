import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  AppState,
  Easing,
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
import Tts from 'react-native-tts';
import BackButton from '../components/BackButton';
import SoundPlayer from '../utills/SoundPlayer';
import {
  createRound,
  getDifficulty,
  getDistractorLetters,
  getBalloonY,
  findBalloonAtPoint,
  roundReducer,
  ROUND_SECONDS,
  TARGET_SCORE,
  SPAWN_INTERVAL,
  BALLOON_TOUCH_PADDING,
} from '../games/poppedLetters';
const SPARKLES = [
  {
    left: '12%',
    top: '18%',
  },
  {
    left: '35%',
    top: '52%',
  },
  {
    left: '58%',
    top: '12%',
  },
  {
    left: '78%',
    top: '64%',
  },
  {
    left: '91%',
    top: '26%',
  },
];
function PopFeedback({ pop, targetLetter }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 850,
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [progress]);
  const message = pop.isBomb
    ? 'Oops! Avoid the bombs'
    : !pop.isTarget
    ? `Find ${targetLetter}!`
    : pop.streak >= 3
    ? `${pop.streak} in a row! +1`
    : 'Great pop! +1';
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.feedback,
        pop.isBomb && styles.bombFeedback,
        !pop.isBomb && !pop.isTarget && styles.wrongFeedback,
        {
          opacity: progress.interpolate({
            inputRange: [0, 0.12, 0.7, 1],
            outputRange: [0, 1, 1, 0],
          }),
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [12, -12],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.feedbackText}>{message}</Text>
    </Animated.View>
  );
}
function RoundResult({ round, navigation, onReplay, insets }) {
  const { width, height } = useWindowDimensions();
  const compact = height < 400;
  const stars =
    round.score >= TARGET_SCORE + 4
      ? 3
      : round.score >= TARGET_SCORE
      ? 2
      : round.score > 0
      ? 1
      : 0;
  return (
    <View
      testID="balloon-result-overlay"
      accessibilityViewIsModal
      style={[
        styles.overlay,
        {
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 12,
          paddingLeft: insets.left + 12,
          paddingRight: insets.right + 12,
        },
      ]}
    >
      <View
        style={[
          styles.resultCard,
          {
            width: Math.min(440, width - insets.left - insets.right - 24),
            maxHeight: height - insets.top - insets.bottom - 24,
          },
        ]}
      >
        <ScrollView
          style={styles.resultBody}
          contentContainerStyle={styles.resultBodyContent}
          showsVerticalScrollIndicator={false}
        >
          <View accessibilityLabel={`${stars} of 3 stars`} style={styles.stars}>
            {[0, 1, 2].map(index => (
              <Text
                key={index}
                style={[
                  styles.star,
                  compact && styles.smallStar,
                  index >= stars && styles.emptyStar,
                ]}
              >
                ★
              </Text>
            ))}
          </View>
          <Text accessibilityRole="header" style={styles.resultTitle}>
            {round.status === 'won' ? 'You did it!' : 'Nice try!'}
          </Text>
          <Text style={styles.resultText}>
            {round.status === 'won'
              ? `Amazing popping! You scored ${round.score}.`
              : `You scored ${round.score}. Let's try for ${TARGET_SCORE}!`}
          </Text>
          <Text style={styles.resultDetail}>
            Best streak: {round.bestStreak} · Bombs hit: {round.bombHits}
          </Text>
        </ScrollView>
        <View style={styles.actions}>
          <BackButton navigation={navigation} style={styles.resultBack} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Play again"
            onPress={onReplay}
            style={({ pressed }) => [styles.replay, pressed && styles.pressed]}
          >
            <Text style={styles.replayText}>Play again</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
const Balloon = memo(function Balloon({
  item,
  running,
  onPop,
  onExpire,
  onMotion,
}) {
  const position = useRef(new Animated.Value(item.startY)).current;
  const remaining = useRef(item.duration);
  const popped = useRef(false);
  const touchPadding = item.isBomb ? 0 : BALLOON_TOUCH_PADDING;
  useEffect(() => {
    if (!running || popped.current) {
      return;
    }
    const started = Date.now();
    const motion = {
      startedAt: started,
      startY:
        -item.size +
        ((item.startY + item.size) * remaining.current) / item.duration,
      endY: -item.size,
      duration: remaining.current,
    };
    position.setValue(motion.startY);
    onMotion(item.id, motion);
    const animation = Animated.timing(position, {
      toValue: -item.size,
      duration: remaining.current,
      easing: Easing.linear,
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start(({ finished }) => {
      if (finished) {
        onExpire(item.id, item.roundId);
      }
    });
    return () => {
      remaining.current = Math.max(
        0,
        remaining.current - (Date.now() - started),
      );
      animation.stop();
      position.setValue(getBalloonY(motion, Date.now()));
      onMotion(item.id, null);
    };
  }, [item, position, running, onExpire, onMotion]);
  function pop() {
    if (!running || popped.current) {
      return;
    }
    popped.current = true;
    onPop(item);
  }
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.balloon,
        {
          top: -touchPadding,
          left: item.x - touchPadding,
          width: item.size + touchPadding * 2,
          height: item.size + touchPadding * 2,
          transform: [
            {
              translateY: position,
            },
          ],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          item.isBomb ? 'Avoid bomb' : `Pop ${item.letter} balloon`
        }
        disabled={!running}
        onPressIn={pop}
        // Keep accessibility activation; pop() ignores a second event for this balloon.
        onPress={pop}
        style={styles.balloonTouch}
      >
        <View
          pointerEvents="none"
          style={[
            styles.balloonArtwork,
            {
              width: item.size,
              height: item.size,
            },
          ]}
        >
          <Image
            pointerEvents="none"
            resizeMode="contain"
            source={
              item.isBomb
                ? require('../assets/bomb.png')
                : item.color === 0
                ? require('../assets/balloontransparent.png')
                : require('../assets/balloon2.png')
            }
            style={styles.balloonImage}
          />
          {!item.isBomb && (
            <>
              <View pointerEvents="none" style={styles.string} />
              <Text
                pointerEvents="none"
                style={[
                  styles.letter,
                  item.color === 1 && styles.darkLetter,
                  {
                    fontSize: item.size * 0.46,
                  },
                ]}
              >
                {item.letter}
              </Text>
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});
export default function BalloonPopping({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const portraitHeader = width < 500;
  const requestedLetter = String(route?.params?.Letter ?? 'A').toUpperCase();
  const letter = /^[A-Z]$/.test(requestedLetter) ? requestedLetter : 'A';
  const distractors = useMemo(() => getDistractorLetters(letter), [letter]);
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(
    AppState.currentState !== 'background' &&
      AppState.currentState !== 'inactive',
  );
  const [board, setBoard] = useState({
    width: 0,
    height: 0,
  });
  const boardRef = useRef({
    width: 0,
    height: 0,
  });
  const [round, dispatch] = useReducer(roundReducer, undefined, createRound);
  const running =
    focused &&
    foreground &&
    board.width > 0 &&
    board.height > 0 &&
    round.status === 'playing';
  const remainingMs = useRef(ROUND_SECONDS * 1000);
  const deadline = useRef(0);
  const counter = useRef(0);
  const letterCounter = useRef(0);
  const consecutiveNonTargets = useRef(0);
  const motions = useRef(new Map());
  const readyToSpeak = useRef(false);
  const runningRef = useRef(false);
  const roundRef = useRef(round);
  const announcedRound = useRef(-1);
  const poppedIds = useRef(new Set());
  roundRef.current = round;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      const active = state === 'active';
      if (!active) {
        runningRef.current = false;
        SoundPlayer.stop();
        Tts.stop().catch(() => {});
      }
      setForeground(active);
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    let mounted = true;
    Tts.getInitStatus()
      .then(() => Tts.setDefaultLanguage('en-US'))
      .then(() => Tts.setDefaultRate(0.35))
      .then(() => {
        readyToSpeak.current = mounted;
      })
      .catch(error =>
        console.warn(
          'Speech is unavailable. The balloon game can still be played.',
          error,
        ),
      );
    return () => {
      mounted = false;
      readyToSpeak.current = false;
      Tts.stop().catch(() => {});
      SoundPlayer.stop();
    };
  }, []);
  useEffect(() => {
    if (!running) {
      runningRef.current = false;
      SoundPlayer.stop();
      Tts.stop().catch(() => {});
      return;
    }
    const roundId = round.roundId;
    const started = Date.now();
    const budget = remainingMs.current;
    deadline.current = started + budget;
    runningRef.current = true;
    function spawn() {
      if (!runningRef.current || Date.now() >= deadline.current) {
        return;
      }
      const size = Math.min(
        96,
        Math.max(48, Math.min(board.width / 5, board.height / 2.2)),
      );
      // Keep enlarged letter targets apart from neighboring bomb targets.
      const lanes = Math.max(
        1,
        Math.floor(board.width / (size + BALLOON_TOUCH_PADDING * 2 + 10)),
      );
      const lane = counter.current++ % lanes;
      const laneWidth = board.width / lanes;
      const difficulty = getDifficulty(
        Math.ceil((deadline.current - Date.now()) / 1000),
      );
      // Keep the selected letter common, with at most two non-targets in a row.
      const forceTarget = consecutiveNonTargets.current >= 2;
      const isBomb =
        counter.current > 1 &&
        !forceTarget &&
        Math.random() < difficulty.bombChance;
      const letterIndex = isBomb ? -1 : letterCounter.current++;
      const isDistractor = !isBomb && !forceTarget && letterIndex % 4 === 3;
      const balloonLetter = isDistractor
        ? distractors[Math.floor(letterIndex / 4) % distractors.length]
        : letter;
      const isTarget = !isBomb && !isDistractor;
      consecutiveNonTargets.current = isTarget
        ? 0
        : consecutiveNonTargets.current + 1;
      dispatch({
        type: 'spawn',
        roundId,
        balloon: {
          id: `${roundId}-${counter.current}`,
          roundId,
          x: Math.max(
            0,
            Math.min(
              board.width - size,
              lane * laneWidth + (laneWidth - size) / 2,
            ),
          ),
          size,
          startY: Math.max(0, board.height - size),
          duration: difficulty.flightMs + Math.random() * 800,
          color: counter.current % 2,
          isBomb,
          isTarget,
          letter: isBomb ? null : balloonLetter,
        },
      });
    }
    if (roundRef.current.balloons.length === 0) {
      spawn();
    }
    const spawning = setInterval(spawn, SPAWN_INTERVAL);
    const clock = setInterval(() => {
      const seconds = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000),
      );
      dispatch({
        type: 'tick',
        roundId,
        seconds,
      });
    }, 250);
    const ending = setTimeout(() => {
      runningRef.current = false;
      remainingMs.current = 0;
      dispatch({
        type: 'finish',
        roundId,
      });
    }, budget);
    return () => {
      runningRef.current = false;
      remainingMs.current = Math.max(0, budget - (Date.now() - started));
      clearInterval(spawning);
      clearInterval(clock);
      clearTimeout(ending);
    };
  }, [running, board.width, board.height, round.roundId, letter, distractors]);
  useEffect(() => {
    if (
      !focused ||
      !foreground ||
      round.status === 'playing' ||
      announcedRound.current === round.roundId
    ) {
      return;
    }
    announcedRound.current = round.roundId;
    SoundPlayer.playSoundFile(
      round.status === 'won' ? 'modalsound' : 'lose',
      'mp3',
    );
  }, [focused, foreground, round.status, round.roundId]);
  const expire = useCallback((id, roundId) => {
    dispatch({
      type: 'expire',
      roundId,
      id,
    });
  }, []);
  const trackMotion = useCallback((id, motion) => {
    if (motion) {
      motions.current.set(id, motion);
    } else {
      motions.current.delete(id);
    }
  }, []);
  const pop = useCallback(
    item => {
      const current = roundRef.current;
      if (
        !runningRef.current ||
        current.status !== 'playing' ||
        item.roundId !== current.roundId ||
        !current.balloons.some(balloon => balloon.id === item.id) ||
        poppedIds.current.has(item.id)
      ) {
        return;
      }
      if (Date.now() >= deadline.current) {
        runningRef.current = false;
        dispatch({
          type: 'finish',
          roundId: current.roundId,
        });
        return;
      }
      poppedIds.current.add(item.id);
      dispatch({
        type: 'pop',
        roundId: item.roundId,
        id: item.id,
      });
      if (item.isBomb || item.isTarget) {
        SoundPlayer.playSoundFile(item.isBomb ? 'bomb' : 'done', 'mp3');
      }
      if (item.isTarget && readyToSpeak.current) {
        Tts.stop()
          .then(() => {
            if (
              runningRef.current &&
              roundRef.current.roundId === item.roundId
            ) {
              return Tts.speak(letter);
            }
          })
          .catch(() => {});
      }
    },
    [letter],
  );
  const touchBoard = useCallback(
    ({ nativeEvent }) => {
      if (!runningRef.current) {
        return;
      }
      // This empty overlay is always the native touch target, so locationX/Y
      // stay relative to the board, independent of each animated child.
      const touches = nativeEvent.changedTouches?.length
        ? nativeEvent.changedTouches
        : [nativeEvent];
      for (const touch of touches) {
        const item = findBalloonAtPoint(
          roundRef.current.balloons,
          motions.current,
          { x: touch.locationX, y: touch.locationY },
          Date.now(),
          poppedIds.current,
        );
        if (item) {
          pop(item);
        }
      }
    },
    [pop],
  );
  const measureBoard = useCallback(({ nativeEvent: { layout } }) => {
    if (
      layout.width <= 0 ||
      layout.height <= 0 ||
      (boardRef.current.width === layout.width &&
        boardRef.current.height === layout.height)
    ) {
      return;
    }
    if (boardRef.current.width > 0) {
      dispatch({
        type: 'resize',
        roundId: roundRef.current.roundId,
      });
    }
    boardRef.current = {
      width: layout.width,
      height: layout.height,
    };
    setBoard(boardRef.current);
  }, []);
  function replay() {
    runningRef.current = false;
    remainingMs.current = ROUND_SECONDS * 1000;
    poppedIds.current.clear();
    counter.current = 0;
    letterCounter.current = 0;
    consecutiveNonTargets.current = 0;
    motions.current.clear();
    SoundPlayer.stop();
    dispatch({
      type: 'reset',
    });
  }
  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <Image
        source={require('../assets/bg.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
        pointerEvents="none"
      />
      <View
        style={styles.gameContent}
        accessibilityElementsHidden={round.status !== 'playing'}
        importantForAccessibility={
          round.status !== 'playing' ? 'no-hide-descendants' : 'auto'
        }
      >
        <View
          style={[
            styles.header,
            portraitHeader && styles.portraitHeader,
            {
              paddingTop: insets.top + 6,
              paddingLeft: insets.left + 12,
              paddingRight: insets.right + 12,
            },
          ]}
        >
          <View style={styles.headerMain}>
            <BackButton navigation={navigation} />
            <View style={styles.heading}>
              <Text style={styles.title}>Pop the letter {letter}</Text>
              <Text style={styles.instructions}>
                {round.timeLeft <= 8 && round.status === 'playing'
                  ? `Keep finding ${letter}! Avoid the bombs!`
                  : `Only ${letter}: +1. Other letters: 0. Bombs: -1.`}
              </Text>
              <View
                accessibilityRole="progressbar"
                accessibilityValue={{
                  min: 0,
                  max: TARGET_SCORE,
                  now: Math.min(TARGET_SCORE, round.score),
                }}
                accessibilityLabel="Balloon goal"
                style={styles.progressTrack}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        100,
                        (round.score / TARGET_SCORE) * 100,
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
          <View style={styles.stats}>
            <View
              accessibilityLabel={`Score ${round.score} of ${TARGET_SCORE}`}
              style={styles.stat}
            >
              <Text style={styles.statLabel}>SCORE</Text>
              <Text style={styles.statValue}>
                {round.score}/{TARGET_SCORE}
              </Text>
            </View>
            <View
              accessibilityLabel={`${round.timeLeft} seconds left`}
              style={styles.stat}
            >
              <Text style={styles.statLabel}>TIME</Text>
              <Text
                style={[styles.statValue, round.timeLeft <= 5 && styles.urgent]}
              >
                {round.timeLeft}s
              </Text>
            </View>
          </View>
        </View>
        <View
          testID="balloon-play-area"
          onLayout={measureBoard}
          style={[
            styles.board,
            {
              marginLeft: insets.left,
              marginRight: insets.right,
              marginBottom: insets.bottom,
            },
          ]}
        >
          <View
            pointerEvents="none"
            accessible={false}
            style={StyleSheet.absoluteFill}
          >
            {SPARKLES.map((position, index) => (
              <Text key={index} style={[styles.sparkle, position]}>
                ✦
              </Text>
            ))}
          </View>
          {round.status === 'playing' &&
            round.balloons.map(item => (
              <Balloon
                key={item.id}
                item={item}
                running={running}
                onPop={pop}
                onExpire={expire}
                onMotion={trackMotion}
              />
            ))}
          <View
            testID="balloon-touch-surface"
            accessible={false}
            pointerEvents={running ? 'box-only' : 'none'}
            style={StyleSheet.absoluteFill}
            onStartShouldSetResponder={() => running}
            onTouchStart={touchBoard}
          />
          {running && round.lastPop && (
            <PopFeedback
              key={round.lastPop.id}
              pop={round.lastPop}
              targetLetter={letter}
            />
          )}
          {round.status === 'playing' && !foreground && (
            <View style={styles.overlay}>
              <Text style={styles.resultTitle}>Game paused</Text>
            </View>
          )}
        </View>
      </View>
      {round.status !== 'playing' && (
        <RoundResult
          round={round}
          navigation={navigation}
          onReplay={replay}
          insets={insets}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#163b51',
  },
  gameContent: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    opacity: 0.88,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fffaf0f5',
    borderBottomWidth: 3,
    borderBottomColor: '#ffd56c',
  },
  heading: {
    flex: 1,
  },
  headerMain: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  portraitHeader: { flexDirection: 'column', alignItems: 'stretch', gap: 6 },
  stats: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  title: {
    fontFamily: 'Poppins-Bold',
    color: '#24496b',
    fontSize: 22,
    includeFontPadding: false,
  },
  instructions: {
    fontFamily: 'Poppins-Medium',
    color: '#48667b',
    fontSize: 11,
    includeFontPadding: false,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#dce8e7',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
    maxWidth: 260,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#24b890',
    borderRadius: 4,
  },
  stat: {
    minWidth: 68,
    alignItems: 'center',
    backgroundColor: '#e8f5fc',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statLabel: {
    fontSize: 10,
    color: '#48667b',
    fontWeight: '700',
  },
  statValue: {
    fontSize: 22,
    color: '#22486b',
    fontWeight: '800',
  },
  urgent: {
    color: '#ce3e45',
  },
  board: {
    flex: 1,
    overflow: 'hidden',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 24,
    color: '#fff6ab',
    opacity: 0.6,
  },
  string: {
    position: 'absolute',
    top: '90%',
    width: 2,
    height: 22,
    backgroundColor: '#fff9da',
    opacity: 0.8,
  },
  feedback: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    backgroundColor: '#18866a',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
  },
  bombFeedback: {
    backgroundColor: '#b74b39',
  },
  wrongFeedback: {
    backgroundColor: '#806216',
  },
  feedbackText: {
    color: 'white',
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
  },
  balloon: {
    position: 'absolute',
    top: 0,
  },
  balloonTouch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balloonArtwork: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  balloonImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  letter: {
    color: 'white',
    fontWeight: '900',
    textShadowColor: '#176c9b',
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 2,
  },
  darkLetter: {
    color: '#22486b',
    textShadowColor: 'white',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15364c99',
  },
  resultCard: {
    backgroundColor: '#fffaf0',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#ffd56c',
    padding: 14,
  },
  resultBody: {
    flexShrink: 1,
  },
  resultBodyContent: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  stars: {
    flexDirection: 'row',
    gap: 12,
  },
  star: {
    fontSize: 44,
    color: '#ffb62f',
    includeFontPadding: false,
  },
  smallStar: {
    fontSize: 32,
  },
  emptyStar: {
    color: '#dfded2',
  },
  resultTitle: {
    fontFamily: 'Poppins-Bold',
    color: '#22486b',
    fontSize: 26,
    textAlign: 'center',
  },
  resultText: {
    fontFamily: 'Poppins-Medium',
    color: '#48667b',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 6,
  },
  resultDetail: {
    color: '#48667b',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 8,
    flexShrink: 0,
  },
  resultBack: {
    backgroundColor: '#e8f5fc',
    borderRadius: 14,
  },
  replay: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#138dbb',
    borderRadius: 14,
    paddingHorizontal: 22,
  },
  pressed: {
    opacity: 0.8,
  },
  replayText: {
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
});
