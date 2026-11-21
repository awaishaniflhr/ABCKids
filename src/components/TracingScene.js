import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Shared look for the full-screen tracing games (Word Tracing, Dot Tracing):
// a night-blue backdrop, a Home button, big side arrows and a success card.

// ---------------------------------------------------------------- backdrop
const FLOATING = [
  {
    char: 'A',
    x: '7%',
    y: '21%',
    size: 30,
    color: '#B4508F',
    rotate: '-12deg',
  },
  { char: 'B', x: '48%', y: '1%', size: 36, color: '#5A5F8C', rotate: '8deg' },
  {
    char: 'C',
    x: '26%',
    y: '72%',
    size: 78,
    color: '#2F9B87',
    rotate: '-8deg',
  },
  {
    char: 'D',
    x: '64%',
    y: '70%',
    size: 30,
    color: '#3F86D8',
    rotate: '10deg',
  },
  {
    char: 'E',
    x: '92%',
    y: '74%',
    size: 70,
    color: '#6E52D6',
    rotate: '12deg',
  },
];
const SPECKS = [
  ['34%', '9%', 5, '#B05FD0'],
  ['61%', '14%', 5, '#2BB3A3'],
  ['72%', '25%', 4, '#E06AA0'],
  ['23%', '26%', 5, '#2BB3A3'],
  ['20%', '52%', 8, '#B05FD0'],
  ['38%', '33%', 7, '#2BB3A3'],
  ['93%', '49%', 6, '#2BB3A3'],
  ['39%', '78%', 7, '#2BB3A3'],
  ['70%', '80%', 7, '#8A55D6'],
  ['84%', '68%', 3, '#E0607A'],
  ['22%', '75%', 5, '#4C66E0'],
  ['3%', '65%', 5, '#E06AA0'],
];
const STARS = [
  ['31%', '48%'],
  ['82%', '17%'],
];

export function Backdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 1000 450"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Rect x={0} y={0} width={1000} height={450} fill="#1A30A8" />
        <Path
          d="M0 0 H260 C230 50 190 90 120 100 C60 110 30 160 0 170 Z"
          fill="#15279A"
        />
        <Path
          d="M740 0 H1000 V230 C960 180 930 120 870 100 C800 80 770 40 740 0 Z"
          fill="#15279A"
        />
        <Path
          d="M0 340 C70 330 120 380 200 400 C280 420 300 330 380 340 C460 350 520 420 600 450 H0 Z"
          fill="#15279A"
        />
        <Path
          d="M1000 300 C950 320 960 380 900 400 C850 420 830 440 820 450 H1000 Z"
          fill="#15279A"
        />
      </Svg>
      {SPECKS.map(([left, top, size, backgroundColor], index) => (
        <View
          key={`speck-${index}`}
          style={[
            styles.speck,
            {
              left,
              top,
              width: size * 2,
              height: size * 2,
              borderRadius: size,
              backgroundColor,
            },
          ]}
        />
      ))}
      {STARS.map(([left, top], index) => (
        <Text key={`star-${index}`} style={[styles.bgStar, { left, top }]}>
          {'★'}
        </Text>
      ))}
      {FLOATING.map(item => (
        <Text
          key={item.char}
          style={[
            styles.floating,
            {
              left: item.x,
              top: item.y,
              fontSize: item.size,
              color: item.color,
              transform: [{ rotate: item.rotate }],
            },
          ]}
        >
          {item.char}
        </Text>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- controls
export function HomeButton({ onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Home"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.home, pressed && styles.pressed]}
    >
      <Svg width={54} height={46} viewBox="0 0 54 46">
        <Rect x={9} y={18} width={36} height={26} rx={4} fill="#FFF3D6" />
        <Path
          d="M3 22 L27 3 L51 22"
          stroke="#E2464B"
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Rect x={22} y={27} width={11} height={17} rx={3} fill="#3D8BE8" />
        <Rect x={12} y={25} width={7} height={7} rx={1.5} fill="#7FC4F5" />
        <Rect x={36} y={25} width={7} height={7} rx={1.5} fill="#7FC4F5" />
        <Circle cx={13} cy={37} r={2.5} fill="#F7A3A8" />
        <Circle cx={41} cy={37} r={2.5} fill="#F7A3A8" />
      </Svg>
      <Text style={styles.homeLabel}>Home</Text>
    </Pressable>
  );
}

export function Arrow({ direction, onPress, disabled, size, label }) {
  const back = direction === 'back';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label || (back ? 'Previous' : 'Next')}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={14}
      style={({ pressed }) => [
        styles.arrow,
        disabled && styles.arrowDisabled,
        pressed && styles.pressed,
      ]}
    >
      <Svg width={size * 0.62} height={size} viewBox="0 0 50 80">
        <Path
          d={back ? 'M38 10 L12 40 L38 70' : 'M12 10 L38 40 L12 70'}
          stroke="#0A86C9"
          strokeWidth={17}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          translateY={3}
        />
        <Path
          d={back ? 'M38 10 L12 40 L38 70' : 'M12 10 L38 40 L12 70'}
          stroke="#16B5F5"
          strokeWidth={17}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Pressable>
  );
}

export function Pill({ label, symbol, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      <Text style={styles.pillSymbol}>{symbol}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------- success
export function SuccessCard({ word, image, nextLabel, animate, compact }) {
  const pop = useRef(new Animated.Value(animate ? 0 : 1)).current;
  useEffect(() => {
    if (!animate) return;
    const animation = Animated.spring(pop, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animate, pop]);
  return (
    <View
      testID="word-success"
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.successLayer]}
    >
      <Animated.View
        style={[
          styles.successCard,
          compact && styles.successCompact,
          { opacity: pop, transform: [{ scale: pop }] },
        ]}
      >
        <Text style={[styles.successStars, compact && styles.compactStars]}>
          {'★ ★ ★'}
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.successTitle, compact && styles.compactTitle]}
        >
          Great job!
        </Text>
        <View style={styles.successWordRow}>
          {image && (
            <Image
              source={image}
              resizeMode="contain"
              style={compact ? styles.compactImage : styles.successImage}
            />
          )}
          <Text style={[styles.successWord, compact && styles.compactWord]}>
            {word}
          </Text>
        </View>
        <Text style={styles.successNext}>{nextLabel}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  speck: { position: 'absolute', opacity: 0.85 },
  bgStar: { position: 'absolute', fontSize: 20, color: '#7C88B8' },
  floating: {
    position: 'absolute',
    fontFamily: 'Poppins-ExtraBold',
    opacity: 0.6,
    includeFontPadding: false,
  },
  home: { alignItems: 'center', paddingHorizontal: 4 },
  homeLabel: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    marginTop: -2,
    includeFontPadding: false,
  },
  pill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF2E',
  },
  pillSymbol: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  arrow: {
    minWidth: 56,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: { opacity: 0.25 },
  pressed: { opacity: 0.65, transform: [{ scale: 0.94 }] },
  successLayer: { alignItems: 'center', justifyContent: 'center' },
  successCard: {
    alignItems: 'center',
    maxWidth: '92%',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 26,
    backgroundColor: '#FFFAE9',
    borderWidth: 4,
    borderColor: '#F5CE6D',
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  successCompact: { paddingVertical: 8, paddingHorizontal: 20 },
  successStars: { color: '#EFB43E', fontSize: 30, letterSpacing: 2 },
  compactStars: { fontSize: 20 },
  successTitle: {
    color: '#3A4FA8',
    fontFamily: 'Poppins-Bold',
    fontSize: 30,
    includeFontPadding: false,
  },
  compactTitle: { fontSize: 22 },
  successWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  successImage: { width: 72, height: 72 },
  compactImage: { width: 46, height: 46 },
  successWord: {
    color: '#C0721F',
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    includeFontPadding: false,
  },
  compactWord: { fontSize: 24 },
  successNext: {
    color: '#8B7BAA',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    marginTop: 4,
  },
});
