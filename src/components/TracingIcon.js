import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

const LETTER_PATH = 'M24 73 L44 24 L64 73 M31 57 L57 57';
const NUMBER_PATH = 'M26 38 C28 18 62 20 58 42 L26 74 L62 74';
// A small "ab": a round-and-stick a, then a tall b.
const WORD_PATH =
  'M40 52 C36 44 20 44 20 58 C20 72 36 72 40 64 M40 47 L40 72 ' +
  'M50 28 L50 72 M50 58 C50 44 66 44 66 58 C66 72 50 72 50 62';
const PATHS = { letter: LETTER_PATH, number: NUMBER_PATH, word: WORD_PATH };

// Dots along an "A" (legs, then crossbar); the first ones are already green
// with a pen line drawn over them.
const DOTS = [
  ...[0, 1, 2, 3, 4, 5].map(t => [24 + t * 4, 73 - t * 9.8, t < 4]),
  ...[1, 2, 3, 4, 5].map(t => [44 + t * 4, 24 + t * 9.8, false]),
  [38, 57, false],
  [44, 57, false],
  [50, 57, false],
];
const DOT_INK = 'M24 73 L38 39';

export default function TracingIcon({ size = 80, variant = 'letter' }) {
  const d = PATHS[variant] || LETTER_PATH;
  const dots = variant === 'dots';
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect
        x={10}
        y={5}
        width={72}
        height={88}
        rx={16}
        fill="#FFF9E6"
        stroke="#FFD06A"
        strokeWidth={4}
      />
      {dots ? (
        <G>
          {DOTS.map(([cx, cy, filled], index) => (
            <Circle
              key={index}
              cx={cx}
              cy={cy}
              r={3.6}
              fill={filled ? '#22B573' : '#C9C3F2'}
            />
          ))}
          <Path
            d={DOT_INK}
            stroke="#F0567A"
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      ) : (
        <G>
          <Path
            d={d}
            stroke="#B1ABED"
            strokeWidth={13}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d={d}
            stroke="#FFFFFF"
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray="1 8"
            fill="none"
          />
        </G>
      )}
      <G rotation={35} origin="76,61">
        <Rect
          x={69}
          y={31}
          width={14}
          height={47}
          rx={3}
          fill="#FFC34E"
          stroke="#D78A31"
          strokeWidth={2}
        />
        <Path d="M69 78 L76 94 L83 78 Z" fill="#EAC194" />
        <Path d="M73 87 L76 94 L79 87 Z" fill="#304A64" />
        <Rect x={69} y={27} width={14} height={9} rx={3} fill="#F08CAF" />
      </G>
      <Circle cx={18} cy={17} r={4} fill="#66C9BF" />
    </Svg>
  );
}
