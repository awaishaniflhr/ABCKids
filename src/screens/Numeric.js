import React, { memo, useEffect, useRef, useState } from 'react';
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
import {
  ActivityScreen,
  useActivityLayout,
} from '../components/ActivityLayout';
import TraceBuddy from '../components/TraceBuddy';
import SoundPlayer from '../utills/SoundPlayer';
import useSpeech from '../games/useSpeech';
import {
  chooseAnswer,
  FRUITS,
  makeQuestion,
  STREAK_CHEER,
} from '../games/addition';

export const NEXT_QUESTION_MS = 2200;
const BUBBLES = [
  { face: '#FF7FA8', edge: '#D9557F' },
  { face: '#FFC23D', edge: '#D99A17' },
  { face: '#4CC9B0', edge: '#2B9C85' },
];
const PLATE_A = '#FF8A65';
const PLATE_B = '#7E8CF5';
const BURST = Array.from({ length: 10 }, (_, index) => {
  const angle = (index / 10) * Math.PI * 2;
  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
    color: ['#FFC23D', '#FF7FA8', '#4CC9B0', '#7E8CF5', '#FF8A65'][index % 5],
  };
});

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

// ---------------------------------------------------------------- fruit
const Fruit = memo(function Fruit({
  image,
  size,
  delay,
  count,
  color,
  label,
  onPress,
  animate,
}) {
  const pop = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!animate) return;
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.spring(pop, {
        toValue: 1,
        friction: 4,
        tension: 90,
        useNativeDriver: true,
        isInteraction: false,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [animate, delay, pop]);
  useEffect(() => {
    if (!count || !animate) return;
    bounce.setValue(0);
    const animation = Animated.timing(bounce, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animate, bounce, count]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ width: size, height: size }}
    >
      <Animated.View
        style={[
          styles.fruit,
          {
            opacity: pop,
            transform: [
              { scale: pop },
              {
                translateY: bounce.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0, -size * 0.28, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Image
          source={image}
          resizeMode="contain"
          style={[styles.fruitImage, count ? null : styles.fruitWaiting]}
        />
        {count ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: color, minWidth: size * 0.42 },
            ]}
          >
            <Text style={[styles.badgeText, { fontSize: size * 0.24 }]}>
              {count}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
});

function Plate({
  amount,
  fitFor,
  start,
  fruit,
  color,
  counted,
  onCount,
  animate,
}) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  // Try every grid shape and keep the one that makes the fruit biggest, so
  // tall portrait plates stack fruit and wide landscape plates line them up.
  const room = { width: box.width, height: Math.max(0, box.height - 34) };
  let size = 0;
  // Both plates size their fruit for the bigger group so amounts compare
  // fairly at a glance.
  for (let columns = 1; columns <= fitFor; columns++) {
    const rows = Math.ceil(fitFor / columns);
    size = Math.max(size, Math.min(room.width / columns, room.height / rows));
  }
  size = Math.max(26, Math.min(130, size * 0.9));
  return (
    <View style={[styles.plate, { borderColor: color }]}>
      <View
        style={styles.plateFruits}
        onLayout={({ nativeEvent: { layout } }) =>
          setBox(previous =>
            previous.width === layout.width && previous.height === layout.height
              ? previous
              : { width: layout.width, height: layout.height },
          )
        }
      >
        {box.width > 0 &&
          Array.from({ length: amount }, (_, index) => {
            const id = start + index;
            const order = counted.indexOf(id);
            return (
              <Fruit
                key={id}
                image={fruit.image}
                size={size}
                delay={id * 110}
                count={order >= 0 ? order + 1 : 0}
                color={color}
                label={`Count ${fruit.name} ${id + 1}`}
                onPress={() => onCount(id)}
                animate={animate}
              />
            );
          })}
      </View>
      <View style={[styles.plateLabel, { backgroundColor: color }]}>
        <Text style={styles.plateNumber}>{amount}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- answers
function Bubble({ value, index, state, onPress, animate, size }) {
  const bob = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const grow = useRef(new Animated.Value(1)).current;
  const colors = BUBBLES[index % BUBBLES.length];
  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 900 + index * 170,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 900 + index * 170,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, bob, index]);
  useEffect(() => {
    if (!animate) return;
    let animation;
    if (state === 'wrong') {
      shake.setValue(0);
      animation = Animated.timing(shake, {
        toValue: 1,
        duration: 420,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      });
    } else if (state === 'right') {
      animation = Animated.spring(grow, {
        toValue: 1.22,
        friction: 3,
        useNativeDriver: true,
        isInteraction: false,
      });
    }
    animation?.start();
    return () => animation?.stop();
  }, [animate, grow, shake, state]);
  return (
    <Animated.View
      style={[
        state === 'wrong' && styles.faded,
        {
          transform: [
            {
              translateY: bob.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -6],
              }),
            },
            {
              translateX: shake.interpolate({
                inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
                outputRange: [0, -10, 10, -7, 5, 0],
              }),
            },
            { scale: grow },
          ],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={String(value)}
        accessibilityState={{ disabled: state !== 'ready' }}
        disabled={state !== 'ready'}
        onPress={onPress}
        style={({ pressed }) => [
          styles.bubble,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: state === 'wrong' ? '#C9CED6' : colors.face,
            borderBottomColor: state === 'wrong' ? '#A8AEB8' : colors.edge,
          },
          state === 'right' && styles.rightBubble,
          pressed && styles.pressed,
        ]}
      >
        <View pointerEvents="none" style={styles.shine} />
        <Text style={[styles.bubbleText, { fontSize: size * 0.42 }]}>
          {value}
        </Text>
        {state === 'wrong' && <Text style={styles.cross}>{'✕'}</Text>}
      </Pressable>
    </Animated.View>
  );
}

function Burst({ animate }) {
  const fly = useRef(new Animated.Value(animate ? 0 : 1)).current;
  useEffect(() => {
    if (!animate) return;
    const animation = Animated.timing(fly, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animate, fly]);
  return (
    <View pointerEvents="none" style={styles.burst}>
      {BURST.map((star, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.burstStar,
            {
              color: star.color,
              opacity: fly.interpolate({
                inputRange: [0, 0.15, 0.7, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                {
                  translateX: fly.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, star.x * 150],
                  }),
                },
                {
                  translateY: fly.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, star.y * 110],
                  }),
                },
                {
                  scale: fly.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0.3, 1.3, 0.7],
                  }),
                },
              ],
            },
          ]}
        >
          {'★'}
        </Animated.Text>
      ))}
    </View>
  );
}

// A running score: one star per solved sum, plus a streak for sums solved
// right on the first try.
function Score({ stars, streak }) {
  return (
    <View style={styles.score}>
      <View
        accessible
        accessibilityLabel={`${stars} stars`}
        style={[styles.scorePill, styles.starPill]}
      >
        <Text style={styles.scoreIcon}>{'★'}</Text>
        <Text style={styles.scoreText}>{stars}</Text>
      </View>
      {streak >= 2 && (
        <View
          accessible
          accessibilityLabel={`${streak} in a row`}
          style={[styles.scorePill, styles.streakPill]}
        >
          <Text style={styles.scoreText}>{streak} in a row!</Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------- screen
export default function Numeric({ navigation }) {
  const { wide, width, height } = useActivityLayout();
  const reduced = useReducedMotion();
  const animate = !reduced;
  const speak = useSpeech();
  const [question, setQuestion] = useState(() => makeQuestion(0));
  const [counted, setCounted] = useState([]);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const fruit = FRUITS[question.fruit];
  const sum = question.a + question.b;
  const solved = question.answer !== null;

  useEffect(() => {
    const timer = setTimeout(
      () => speak(`${question.a} plus ${question.b}`),
      500,
    );
    return () => clearTimeout(timer);
  }, [question.a, question.b, question.number, speak]);

  useEffect(() => {
    if (!solved) return;
    // The game never ends: a fresh sum follows every solved one.
    const timer = setTimeout(() => {
      setCounted([]);
      setQuestion(previous =>
        makeQuestion(previous.number + 1, undefined, previous),
      );
    }, NEXT_QUESTION_MS);
    return () => clearTimeout(timer);
  }, [solved, question.number]);

  function count(id) {
    if (counted.includes(id)) return;
    const next = [...counted, id];
    setCounted(next);
    speak(String(next.length));
  }
  function answer(value) {
    const next = chooseAnswer(question, value);
    if (next === question) return;
    setQuestion(next);
    if (next.answer !== null) {
      const nextStreak = next.firstTry ? streak + 1 : 0;
      setStars(total => total + 1);
      setStreak(nextStreak);
      setCounted(Array.from({ length: sum }, (_, index) => index));
      if (nextStreak > 0 && nextStreak % STREAK_CHEER === 0) {
        SoundPlayer.playSoundFile('modalsound', 'mp3');
        speak(`${nextStreak} in a row! You are a superstar!`);
      } else {
        SoundPlayer.playSoundFile('done', 'mp3');
        speak(`${question.a} plus ${question.b} is ${sum}. Great job!`);
      }
    } else {
      SoundPlayer.playSoundFile('wrong', 'mp3');
      speak('Try again!');
    }
  }
  const cheer = solved && streak > 0 && streak % STREAK_CHEER === 0;
  const message = cheer
    ? `${streak} in a row! Superstar!`
    : solved
    ? `Yay! ${question.a} + ${question.b} = ${sum}`
    : question.wrong.length
    ? `Oops! Tap the ${fruit.plural} to count them.`
    : `How many ${fruit.plural} altogether?`;
  const bubbleSize = wide
    ? Math.max(58, Math.min(84, (height - 150) / 3.6))
    : Math.max(64, Math.min(96, (width - 70) / 3.4));

  return (
    <ActivityScreen
      navigation={navigation}
      title="Addition Adventure"
      subtitle="Tap the fruit to count, then pop the answer!"
    >
      <View style={[styles.scene, wide && styles.wide]}>
        <View style={styles.main}>
          <View style={styles.topRow}>
            <Score stars={stars} streak={streak} />
          </View>
          <View style={styles.card}>
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.equation, solved && styles.equationSolved]}
            >
              {question.a} + {question.b} = {question.answer ?? '?'}
            </Text>
            <View key={question.number} style={styles.plates}>
              <Plate
                amount={question.a}
                fitFor={Math.max(question.a, question.b)}
                start={0}
                fruit={fruit}
                color={PLATE_A}
                counted={counted}
                onCount={count}
                animate={animate}
              />
              <Text style={styles.plus}>+</Text>
              <Plate
                amount={question.b}
                fitFor={Math.max(question.a, question.b)}
                start={question.a}
                fruit={fruit}
                color={PLATE_B}
                counted={counted}
                onCount={count}
                animate={animate}
              />
            </View>
            {solved && (
              <Burst key={`burst-${question.number}`} animate={animate} />
            )}
          </View>
        </View>
        <View style={[styles.side, wide && styles.wideSide]}>
          <View style={styles.helper}>
            <TraceBuddy
              size={wide ? 54 : 58}
              happy={solved}
              animate={animate}
            />
            <View style={styles.speech}>
              <Text style={styles.speechText}>{message}</Text>
            </View>
          </View>
          <View style={[styles.answers, wide && styles.wideAnswers]}>
            {question.options.map((option, index) => (
              <Bubble
                key={`${question.number}-${option}`}
                value={option}
                index={index}
                size={bubbleSize}
                animate={animate}
                state={
                  question.answer === option
                    ? 'right'
                    : question.wrong.includes(option)
                    ? 'wrong'
                    : solved
                    ? 'done'
                    : 'ready'
                }
                onPress={() => answer(option)}
              />
            ))}
          </View>
        </View>
      </View>
    </ActivityScreen>
  );
}

const styles = StyleSheet.create({
  scene: { flex: 1, gap: 10 },
  wide: { flexDirection: 'row' },
  main: { flex: 1, minHeight: 0, gap: 8 },
  topRow: { alignItems: 'center' },
  score: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  starPill: { backgroundColor: '#FFC23D' },
  streakPill: { backgroundColor: '#FF7FA8' },
  scoreIcon: { color: '#FFFFFF', fontSize: 18 },
  scoreText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    includeFontPadding: false,
  },
  card: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#FFFFFFEE',
    borderWidth: 4,
    borderColor: '#FFE08A',
    borderRadius: 26,
    padding: 10,
    gap: 6,
  },
  equation: {
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 40,
    color: '#3D5A80',
    textAlign: 'center',
    includeFontPadding: false,
    letterSpacing: 2,
  },
  equationSolved: { color: '#22A06B' },
  plates: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
  },
  plate: {
    flex: 1,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderRadius: 22,
    backgroundColor: '#FFF8EC',
    paddingHorizontal: 6,
    paddingTop: 6,
    overflow: 'hidden',
  },
  plateFruits: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
  },
  plateLabel: {
    alignSelf: 'center',
    minWidth: 40,
    paddingHorizontal: 10,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    alignItems: 'center',
  },
  plateNumber: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    includeFontPadding: false,
    paddingVertical: 2,
  },
  plus: {
    alignSelf: 'center',
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 38,
    color: '#FF7FA8',
    includeFontPadding: false,
  },
  fruit: { flex: 1, padding: 3 },
  fruitImage: { width: '100%', height: '100%' },
  fruitWaiting: { opacity: 0.92 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderRadius: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: { color: '#FFFFFF', fontWeight: '900' },
  burst: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burstStar: { position: 'absolute', fontSize: 30 },
  side: { gap: 8 },
  wideSide: { width: 190, justifyContent: 'center' },
  helper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  speech: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    backgroundColor: '#FFFFFFEE',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  speechText: {
    color: '#4A6990',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    textAlign: 'center',
  },
  answers: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 6,
  },
  wideAnswers: { flexDirection: 'column', gap: 8 },
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 6,
    overflow: 'hidden',
  },
  rightBubble: { backgroundColor: '#22B573', borderBottomColor: '#178A56' },
  shine: {
    position: 'absolute',
    top: '12%',
    left: '18%',
    width: '30%',
    height: '18%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF66',
    transform: [{ rotate: '-25deg' }],
  },
  bubbleText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-ExtraBold',
    includeFontPadding: false,
  },
  cross: {
    position: 'absolute',
    color: '#FFFFFFCC',
    fontSize: 40,
    fontWeight: '900',
  },
  pressed: { opacity: 0.8 },
  faded: { opacity: 0.45 },
});
