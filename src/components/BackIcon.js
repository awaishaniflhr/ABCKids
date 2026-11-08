import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Shared curved arrow based on the supplied yellow back icon.
export default function BackIcon({ size = 44, style }) {
  const dimensions = StyleSheet.flatten(style) || {};

  return (
    <Svg
      width={dimensions.width ?? size}
      height={dimensions.height ?? size}
      viewBox="0 88 512 336"
      preserveAspectRatio="xMidYMid meet"
      style={style}
      pointerEvents="none"
      accessible={false}
    >
      <Path
        fill="#FFB739"
        d="M182.54 100.79c16.87-9.73 37.96 2.44 37.96 21.91v43.56H351c88.8 0 161 72.04 161 160.84v47.2c0 22.1-17.9 40-40 40-26.24 0-47.8-21.27-47.8-47.51v-14.32c0-44.77-36.29-81.07-81.07-81.07H220.5v49.83c0 19.49-21.1 31.67-37.97 21.93L12.66 245.18c-16.87-9.74-16.87-34.1 0-43.84z"
      />
      <Path
        fill="#E3A52F"
        d="M220.5 295.3v25.93c0 19.49-21.1 31.67-37.97 21.93L12.66 245.18c-16.87-9.74-16.87-34.1 0-43.84l1.7-.98c1.1 5.5 4.6 10.5 9.9 13.5l170.3 98.3c10.2 5.89 23.34-.9 25.94-16.86z"
      />
      <Path
        fill="#FFCA67"
        d="M351 166.26c88.9 0 161 72.14 161 161.04v47.2c0 22-17.9 39.8-39.9 39.8-14.6 0-27.7-6.6-36.5-17 28.4-24 45.1-59.1 45.1-96.4 0-69.3-57.5-134.64-129.7-134.64z"
      />
    </Svg>
  );
}
