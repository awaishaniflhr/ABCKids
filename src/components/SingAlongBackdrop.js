import React, { memo, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

// A cheerful sing-along scene drawn in code: sky, smiling sun, rainbow,
// drifting clouds, flowery hills and floating music notes. It scales to any
// screen size and orientation.

const NOTES = [
  {
    symbol: '♪',
    x: 0.08,
    size: 30,
    color: '#FF7FA8',
    duration: 9000,
    delay: 0,
  },
  {
    symbol: '♫',
    x: 0.9,
    size: 34,
    color: '#7E8CF5',
    duration: 11000,
    delay: 2500,
  },
  {
    symbol: '♪',
    x: 0.25,
    size: 24,
    color: '#FFB020',
    duration: 10000,
    delay: 5200,
  },
  {
    symbol: '♬',
    x: 0.72,
    size: 28,
    color: '#4CC9B0',
    duration: 12000,
    delay: 1200,
  },
  {
    symbol: '♫',
    x: 0.5,
    size: 22,
    color: '#E86AD8',
    duration: 9500,
    delay: 7000,
  },
];
const CLOUDS = [
  { top: 0.14, scale: 1, duration: 46000, delay: 0 },
  { top: 0.3, scale: 0.75, duration: 60000, delay: 20000 },
  { top: 0.06, scale: 0.6, duration: 52000, delay: 36000 },
];
const RAYS = Array.from({ length: 12 }, (_, index) => index * 30);
const RAINBOW = [
  '#FF6B6B',
  '#FFA94D',
  '#FFD43B',
  '#69DB7C',
  '#4DABF7',
  '#9775FA',
];
const FLOWERS = [
  [0.06, 0.9, '#FF7FA8'],
  [0.16, 0.95, '#FFD43B'],
  [0.33, 0.92, '#FFFFFF'],
  [0.52, 0.96, '#FF7FA8'],
  [0.66, 0.91, '#9775FA'],
  [0.82, 0.94, '#FFD43B'],
  [0.94, 0.9, '#FFFFFF'],
];

export function useReducedMotion() {
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

function useLoop(duration, delay, animate) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, delay, duration, value]);
  return value;
}

export function Sun({ size, animate }) {
  const spin = useLoop(24000, 0, animate);
  const c = size / 2;
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [
              {
                rotate: spin.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width={size} height={size}>
          {RAYS.map(angle => (
            <Path
              key={angle}
              d={`M${c} ${size * 0.02} L${c - size * 0.05} ${size * 0.16} L${
                c + size * 0.05
              } ${size * 0.16} Z`}
              fill="#FFC93C"
              rotation={angle}
              origin={`${c}, ${c}`}
            />
          ))}
        </Svg>
      </Animated.View>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={c} cy={c} r={size * 0.32} fill="#FFD93D" />
        <Circle
          cx={c}
          cy={c}
          r={size * 0.32}
          fill="none"
          stroke="#FFB627"
          strokeWidth={size * 0.025}
        />
        <Circle
          cx={c - size * 0.1}
          cy={c - size * 0.05}
          r={size * 0.035}
          fill="#5B3A1A"
        />
        <Circle
          cx={c + size * 0.1}
          cy={c - size * 0.05}
          r={size * 0.035}
          fill="#5B3A1A"
        />
        <Circle
          cx={c - size * 0.17}
          cy={c + size * 0.07}
          r={size * 0.05}
          fill="#FF9AA2"
          opacity={0.7}
        />
        <Circle
          cx={c + size * 0.17}
          cy={c + size * 0.07}
          r={size * 0.05}
          fill="#FF9AA2"
          opacity={0.7}
        />
        <Path
          d={`M${c - size * 0.12} ${c + size * 0.06} Q${c} ${c + size * 0.2} ${
            c + size * 0.12
          } ${c + size * 0.06}`}
          stroke="#5B3A1A"
          strokeWidth={size * 0.03}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

function Cloud({ width, screenWidth, top, duration, delay, animate }) {
  const drift = useLoop(duration, delay, animate);
  const height = width * 0.55;
  return (
    <Animated.View
      style={[
        styles.cloud,
        {
          top,
          width,
          height,
          transform: [
            {
              translateX: animate
                ? drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-width, screenWidth + width],
                  })
                : screenWidth * 0.3,
            },
          ],
        },
      ]}
    >
      <Svg width={width} height={height} viewBox="0 0 110 60">
        <Ellipse cx={55} cy={40} rx={50} ry={18} fill="#FFFFFF" />
        <Circle cx={38} cy={30} r={18} fill="#FFFFFF" />
        <Circle cx={62} cy={24} r={22} fill="#FFFFFF" />
        <Circle cx={82} cy={34} r={14} fill="#FFFFFF" />
      </Svg>
    </Animated.View>
  );
}

function Note({ note, width, height, animate }) {
  const rise = useLoop(note.duration, note.delay, animate);
  if (!animate) return null;
  return (
    <Animated.Text
      style={[
        styles.note,
        {
          left: width * note.x,
          top: height * 0.85,
          fontSize: note.size,
          color: note.color,
          opacity: rise.interpolate({
            inputRange: [0, 0.1, 0.8, 1],
            outputRange: [0, 0.9, 0.9, 0],
          }),
          transform: [
            {
              translateY: rise.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -height * 0.75],
              }),
            },
            {
              translateX: rise.interpolate({
                inputRange: [0, 0.25, 0.5, 0.75, 1],
                outputRange: [0, 14, 0, -14, 0],
              }),
            },
            {
              rotate: rise.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: ['-12deg', '12deg', '-12deg'],
              }),
            },
          ],
        },
      ]}
    >
      {note.symbol}
    </Animated.Text>
  );
}

export default memo(function SingAlongBackdrop({ sun: showSun = true }) {
  const { width, height } = useWindowDimensions();
  const animate = !useReducedMotion();
  const short = Math.min(width, height);
  const sun = Math.min(150, short * 0.32);
  const rainbow = Math.min(width * 0.9, short * 0.95);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#7FD3FF" />
            <Stop offset="0.55" stopColor="#BDEBFF" />
            <Stop offset="1" stopColor="#FFE3F1" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#sky)" />
      </Svg>
      <Svg
        width={rainbow}
        height={rainbow / 2}
        viewBox="0 0 200 100"
        style={[styles.rainbow, { top: height * 0.06, left: -rainbow * 0.18 }]}
      >
        {RAINBOW.map((color, index) => (
          <Path
            key={color}
            d={`M${10 + index * 8} 100 A${90 - index * 8} ${
              90 - index * 8
            } 0 0 1 ${190 - index * 8} 100`}
            stroke={color}
            strokeWidth={8.5}
            fill="none"
            opacity={0.55}
          />
        ))}
      </Svg>
      {CLOUDS.map((cloud, index) => (
        <Cloud
          key={index}
          width={Math.min(200, short * 0.42) * cloud.scale}
          screenWidth={width}
          top={height * cloud.top}
          duration={cloud.duration}
          delay={cloud.delay}
          animate={animate}
        />
      ))}
      {showSun ? (
        <View style={[styles.sun, { width: sun, height: sun }]}>
          <Sun size={sun} animate={animate} />
        </View>
      ) : null}
      <Svg
        width="100%"
        height={Math.max(110, height * 0.22)}
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        style={styles.hills}
      >
        <Path d="M0 45 Q70 5 150 40 T300 30 T400 35 V100 H0 Z" fill="#8FD86B" />
        <Path d="M0 70 Q90 30 190 62 T400 55 V100 H0 Z" fill="#6CC24A" />
        {FLOWERS.map(([x, y, color], index) => (
          <G key={index}>
            <Circle cx={x * 400} cy={y * 100 - 8} r={3.2} fill={color} />
            <Circle cx={x * 400} cy={y * 100 - 8} r={1.3} fill="#FFB020" />
          </G>
        ))}
      </Svg>
      {NOTES.map((note, index) => (
        <Note
          key={index}
          note={note}
          width={width}
          height={height}
          animate={animate}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  rainbow: { position: 'absolute' },
  cloud: { position: 'absolute', left: 0, opacity: 0.95 },
  sun: { position: 'absolute', top: 8, right: 8 },
  hills: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  note: { position: 'absolute', fontWeight: '900' },
});
