import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHomeReady } from '../services/splash';

// The opening screen (from the ABC Kids splash artwork): the two children
// with the book and logo float gently, the A, B and C letters bob, stars rise
// up the sky, and "Developed by Pixerve" fades in, while Home loads
// underneath. It fades away once Home is ready and the animation has played
// (never longer than MAX_MS, so it can't get stuck).
export const SPLASH_BACKGROUND = '#FFDDEC'; // same as the Android launch screen
const MIN_MS = 2400;
const MAX_MS = 6000;
const EXIT_MS = 380;

const BACKGROUND = require('../assets/splash/background.jpg');
const HERO = require('../assets/splash/hero.png');

// Where each layer sat in the original 756 x 1344 artwork. The art area
// (the children, book, logo and letters) is drawn at the screen's size and
// every layer keeps its place inside it.
const ART = { x: 30, y: 215, width: 696, height: 645 };
const HERO_BOX = { x: 44, y: 228, width: 675, height: 629 };
const LETTERS = [
  {
    key: 'a',
    source: require('../assets/splash/letter_a.png'),
    box: { x: 70, y: 255, width: 82, height: 92 },
  },
  {
    key: 'b',
    source: require('../assets/splash/letter_b.png'),
    box: { x: 384, y: 222, width: 72, height: 88 },
  },
  {
    key: 'c',
    source: require('../assets/splash/letter_c.png'),
    box: { x: 578, y: 245, width: 84, height: 97 },
  },
];
const DOT_COLORS = ['#FF5A6A', '#FFC21A', '#2FB0EE'];

// Stars rising up the sky: where they start across the screen (0 to 1),
// size, colour, how long one trip takes, and when they start.
const STARS = [
  { x: 0.06, size: 16, color: '#FFD84D', duration: 6200, delay: 0 },
  { x: 0.18, size: 11, color: '#FFF3B0', duration: 7600, delay: 1400 },
  { x: 0.3, size: 20, color: '#FFD84D', duration: 6800, delay: 600 },
  { x: 0.42, size: 12, color: '#FFC1DA', duration: 8000, delay: 2600 },
  { x: 0.55, size: 15, color: '#FFE27A', duration: 7000, delay: 300 },
  { x: 0.66, size: 22, color: '#FFD84D', duration: 6000, delay: 1900 },
  { x: 0.78, size: 12, color: '#FFF3B0', duration: 7400, delay: 900 },
  { x: 0.9, size: 18, color: '#FFE27A', duration: 6600, delay: 2200 },
  { x: 0.12, size: 13, color: '#FFC1DA', duration: 8200, delay: 3200 },
  { x: 0.48, size: 17, color: '#FFD84D', duration: 7200, delay: 3800 },
  { x: 0.84, size: 11, color: '#FFC1DA', duration: 6900, delay: 3400 },
  { x: 0.24, size: 14, color: '#FFE27A', duration: 6400, delay: 4300 },
];
const STAR_PATH =
  'M12 1.8l3.05 6.2 6.85 1-4.95 4.8 1.17 6.8L12 17.4l-6.12 3.2 1.17-6.8L2.1 9l6.85-1z';

function loop(value, duration, easing = Easing.inOut(Easing.sin)) {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 0,
        duration,
        easing,
        useNativeDriver: true,
      }),
    ]),
  );
}

export default function SplashScreen({ onDone }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const homeReady = useHomeReady();
  const [minDone, setMinDone] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [still, setStill] = useState(false);
  const exit = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const leaving = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then(value => setStill(Boolean(value)))
      .catch(() => {});
    const min = setTimeout(() => setMinDone(true), MIN_MS);
    const max = setTimeout(() => setTimedOut(true), MAX_MS);
    return () => {
      clearTimeout(min);
      clearTimeout(max);
    };
  }, []);

  // The sky slowly drifts closer.
  useEffect(() => {
    if (still) return undefined;
    const animation = loop(drift, 5000);
    animation.start();
    return () => animation.stop();
  }, [drift, still]);

  useEffect(() => {
    if (leaving.current || !((homeReady && minDone) || timedOut)) return;
    leaving.current = true;
    Animated.timing(exit, {
      toValue: 1,
      duration: EXIT_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => onDone?.());
  }, [homeReady, minDone, timedOut, exit, onDone]);

  // The art fills the width (a little margin), but leaves room for the text
  // below on short or wide screens.
  const artWidth = Math.min(
    width * 0.96,
    ((height * 0.52) / ART.height) * ART.width,
    560,
  );
  const scale = artWidth / ART.width;
  const fontScale = Math.min(1.25, Math.max(0.8, artWidth / 380));

  return (
    <Animated.View
      accessible
      accessibilityLabel="ABC Kids. Little steps, big discoveries. Developed by Pixerve. Loading."
      style={[
        styles.screen,
        {
          opacity: exit.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
          transform: [
            {
              scale: exit.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.06],
              }),
            },
          ],
        },
      ]}
    >
      <Animated.Image
        source={BACKGROUND}
        resizeMode="cover"
        style={[
          styles.background,
          {
            transform: [
              {
                scale: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.02, 1.08],
                }),
              },
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]}
      />
      {!still &&
        STARS.map((star, index) => <RisingStar key={index} {...star} />)}
      <View style={styles.center}>
        <Art scale={scale} still={still} />
        <Tagline fontScale={fontScale} still={still} />
        <LoadingDots still={still} />
      </View>
      <Credit fontScale={fontScale} bottom={Math.max(insets.bottom, 12) + 22} />
    </Animated.View>
  );
}

// The children, book and logo: pop in, then float and "breathe".
// The A, B and C letters pop in one by one, then each bobs on its own.
function Art({ scale, still }) {
  const enter = useRef(new Animated.Value(still ? 1 : 0)).current;
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) {
      enter.setValue(1);
      return undefined;
    }
    const intro = Animated.spring(enter, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    });
    const breathe = loop(float, 1600);
    intro.start(({ finished }) => finished && breathe.start());
    return () => {
      intro.stop();
      breathe.stop();
    };
  }, [enter, float, still]);
  const place = box => ({
    position: 'absolute',
    left: (box.x - ART.x) * scale,
    top: (box.y - ART.y) * scale,
    width: box.width * scale,
    height: box.height * scale,
  });
  return (
    <Animated.View
      style={{
        width: ART.width * scale,
        height: ART.height * scale,
        opacity: enter.interpolate({
          inputRange: [0, 0.35, 1],
          outputRange: [0, 1, 1],
        }),
        transform: [
          {
            translateY: Animated.add(
              enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }),
              float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }),
            ),
          },
          {
            scale: Animated.multiply(
              enter.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
              float.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.025],
              }),
            ),
          },
        ],
      }}
    >
      <Image source={HERO} resizeMode="contain" style={place(HERO_BOX)} />
      {LETTERS.map((letter, index) => (
        <BobbingLetter
          key={letter.key}
          source={letter.source}
          style={place(letter.box)}
          index={index}
          still={still}
        />
      ))}
    </Animated.View>
  );
}

function BobbingLetter({ source, style, index, still }) {
  const pop = useRef(new Animated.Value(still ? 1 : 0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) {
      pop.setValue(1);
      return undefined;
    }
    const intro = Animated.sequence([
      Animated.delay(380 + index * 180),
      Animated.spring(pop, {
        toValue: 1,
        friction: 4,
        tension: 110,
        useNativeDriver: true,
      }),
    ]);
    const bobbing = loop(bob, 900 + index * 140);
    intro.start(({ finished }) => finished && bobbing.start());
    return () => {
      intro.stop();
      bobbing.stop();
    };
  }, [pop, bob, index, still]);
  const lean = index === 1 ? 5 : -6;
  return (
    <Animated.Image
      source={source}
      resizeMode="contain"
      style={[
        style,
        {
          opacity: pop.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0, 1, 1],
          }),
          transform: [
            {
              translateY: bob.interpolate({
                inputRange: [0, 1],
                outputRange: [0, index === 1 ? 9 : -9],
              }),
            },
            {
              rotate: bob.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', `${lean}deg`],
              }),
            },
            { scale: pop },
          ],
        },
      ]}
    />
  );
}

// A star that rises from below the screen to above it, twinkling and
// turning slowly, then starts again.
function RisingStar({ x, size, color, duration, delay }) {
  const { width, height } = useWindowDimensions();
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const trip = Animated.loop(
      Animated.timing(rise, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const timer = setTimeout(() => trip.start(), delay);
    return () => {
      clearTimeout(timer);
      trip.stop();
    };
  }, [rise, duration, delay]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.star,
        {
          left: x * width - size / 2,
          width: size,
          height: size,
          opacity: rise.interpolate({
            inputRange: [0, 0.1, 0.3, 0.45, 0.6, 0.8, 1],
            outputRange: [0, 0.95, 0.5, 1, 0.55, 0.9, 0],
          }),
          transform: [
            {
              translateY: rise.interpolate({
                inputRange: [0, 1],
                outputRange: [height + size, -size * 2],
              }),
            },
            {
              translateX: rise.interpolate({
                inputRange: [0, 0.25, 0.5, 0.75, 1],
                outputRange: [0, 10, 0, -10, 0],
              }),
            },
            {
              rotate: rise.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '200deg'],
              }),
            },
          ],
        },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d={STAR_PATH}
          fill={color}
          stroke="#FFFFFF"
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}

function useFadeIn(delay, still) {
  const value = useRef(new Animated.Value(still ? 1 : 0)).current;
  useEffect(() => {
    if (still) {
      value.setValue(1);
      return undefined;
    }
    const intro = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(value, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    intro.start();
    return () => intro.stop();
  }, [value, delay, still]);
  return value;
}

function Tagline({ fontScale, still }) {
  const fade = useFadeIn(800, still);
  return (
    <Animated.Text
      style={[
        styles.tagline,
        {
          fontSize: 19 * fontScale,
          opacity: fade,
          transform: [
            {
              translateY: fade.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      Little steps. Big discoveries.
    </Animated.Text>
  );
}

function LoadingDots({ still }) {
  const dots = useRef(DOT_COLORS.map(() => new Animated.Value(0))).current;
  const show = useFadeIn(1050, still);
  useEffect(() => {
    if (still) return undefined;
    const bounce = Animated.loop(
      Animated.stagger(
        150,
        dots.map(dot =>
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 280,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 280,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ),
      ),
    );
    bounce.start();
    return () => bounce.stop();
  }, [dots, still]);
  return (
    <Animated.View style={[styles.dots, { opacity: show }]}>
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            { backgroundColor: DOT_COLORS[index] },
            {
              transform: [
                {
                  translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

function Credit({ fontScale, bottom }) {
  const fade = useFadeIn(1200, false);
  return (
    <Animated.View style={[styles.credit, { bottom, opacity: fade }]}>
      <Text style={[styles.creditSmall, { fontSize: 15 * fontScale }]}>
        Developed by
      </Text>
      <Text style={[styles.creditName, { fontSize: 23 * fontScale }]}>
        Pixerve
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    elevation: 100,
    backgroundColor: SPLASH_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  background: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  // A little above the middle, like the artwork.
  center: { alignItems: 'center', marginBottom: '14%' },
  tagline: {
    marginTop: 18,
    textAlign: 'center',
    color: '#1F2A5C',
    fontFamily: 'Poppins-SemiBold',
    includeFontPadding: false,
  },
  dots: {
    marginTop: 26,
    flexDirection: 'row',
    gap: 16,
    height: 30,
    alignItems: 'flex-end',
  },
  dot: { width: 16, height: 16, borderRadius: 8 },
  credit: { position: 'absolute', alignItems: 'center' },
  creditSmall: {
    color: '#5B6690',
    fontFamily: 'Poppins-Medium',
    includeFontPadding: false,
  },
  creditName: {
    color: '#1F2A5C',
    fontFamily: 'Poppins-Bold',
    includeFontPadding: false,
    marginTop: 2,
  },
  star: { position: 'absolute', top: 0 },
});
