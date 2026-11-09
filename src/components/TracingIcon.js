import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

export default function TracingIcon({ size = 80 }) {
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
      <Path
        d="M24 73 L44 24 L64 73 M31 57 L57 57"
        stroke="#B1ABED"
        strokeWidth={13}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M24 73 L44 24 L64 73 M31 57 L57 57"
        stroke="#FFFFFF"
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray="1 8"
        fill="none"
      />
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
