import React, { memo } from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { getTracingLetter, pointOnStroke } from '../games/tracingLetters';

// Cheerful body / outline pairs, in the spirit of the cartoon number images.
const COLORS = [
  ['#E2504B', '#A9302D'],
  ['#F39A2E', '#C06F12'],
  ['#3FA9E4', '#2479AE'],
  ['#45B97C', '#2B8655'],
  ['#9C6ADB', '#6F42AB'],
  ['#EC6FA9', '#B9447B'],
  ['#F2C230', '#BE8F0F'],
  ['#2FB9B0', '#1D8780'],
];

function Eye({ x, y, r, outline }) {
  return (
    <G>
      <Circle
        cx={x}
        cy={y}
        r={r}
        fill="#FDF3F2"
        stroke={outline}
        strokeWidth={4}
      />
      <Circle cx={x + r * 0.2} cy={y + r * 0.1} r={r * 0.5} fill="#2B1414" />
      <Circle cx={x + r * 0.38} cy={y - r * 0.12} r={r * 0.17} fill="#FFFFFF" />
    </G>
  );
}

// An original googly-eyed letter character drawn from the tracing strokes,
// so every letter A-Z gets one without any image assets.
function FunnyLetter({ letter, size }) {
  const template = getTracingLetter(letter);
  const index = template.letter.charCodeAt(0) - 65;
  const [body, outline] = COLORS[index % COLORS.length];
  const first = template.strokes[0];
  const bigEye = pointOnStroke(first, 24);
  const smallEye = pointOnStroke(first, 70);
  const dots = [];
  template.strokes.forEach((stroke, strokeIndex) => {
    const start = strokeIndex === 0 ? 110 : 30;
    for (let distance = start; distance < stroke.length - 15; distance += 58) {
      const point = pointOnStroke(stroke, distance);
      const odd = dots.length % 2;
      dots.push({
        x: point.x + (odd ? 6 : -5),
        y: point.y + (odd ? -5 : 6),
        r: odd ? 7 : 10,
      });
    }
  });
  const dimension = size ?? '100%';

  return (
    <Svg width={dimension} height={dimension} viewBox="22 22 356 356">
      {template.strokes.map((stroke, i) => (
        <Path
          key={`o${i}`}
          d={stroke.d}
          stroke={outline}
          strokeWidth={66}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}
      {template.strokes.map((stroke, i) => (
        <Path
          key={`b${i}`}
          d={stroke.d}
          stroke={body}
          strokeWidth={52}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}
      {dots.map((dot, i) => (
        <Circle
          key={i}
          cx={dot.x}
          cy={dot.y}
          r={dot.r}
          fill={outline}
          opacity={0.55}
        />
      ))}
      <Eye x={smallEye.x} y={smallEye.y} r={19} outline={outline} />
      <Eye x={bigEye.x} y={bigEye.y} r={26} outline={outline} />
    </Svg>
  );
}

export default memo(FunnyLetter);
