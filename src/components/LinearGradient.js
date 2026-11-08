import React, {useId} from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Defs, LinearGradient as Gradient, Rect, Stop} from 'react-native-svg';

export default function LinearGradient({
  colors,
  locations,
  start = {x: 0.5, y: 0},
  end = {x: 0.5, y: 1},
  children,
  style,
  ...props
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View {...props} style={style}>
      <Svg pointerEvents="none" width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Gradient id={id} x1={start.x} y1={start.y} x2={end.x} y2={end.y}>
            {colors.map((color, index) => (
              <Stop
                key={`${color}-${index}`}
                offset={locations?.[index] ?? index / (colors.length - 1)}
                stopColor={color}
              />
            ))}
          </Gradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
}
