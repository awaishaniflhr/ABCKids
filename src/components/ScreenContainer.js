import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Paint the background to every edge, while keeping controls outside cutouts.
export default function ScreenContainer({ source, style, ...props }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const base = StyleSheet.flatten(style) || {};
  const padding = {
    paddingTop:
      (base.paddingTop ?? base.paddingVertical ?? base.padding ?? 0) +
      insets.top,
    paddingRight:
      (base.paddingRight ?? base.paddingHorizontal ?? base.padding ?? 0) +
      insets.right,
    paddingBottom:
      (base.paddingBottom ?? base.paddingVertical ?? base.padding ?? 0) +
      insets.bottom,
    paddingLeft:
      (base.paddingLeft ?? base.paddingHorizontal ?? base.padding ?? 0) +
      insets.left,
  };

  if (source) {
    return (
      <ImageBackground
        {...props}
        source={source}
        style={[style, padding]}
        // Size the image to the full window, including the cutout padding area.
        imageStyle={[props.imageStyle, { width, height }]}
      />
    );
  }
  return <View {...props} style={[style, padding]} />;
}
