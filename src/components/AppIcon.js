import React from 'react';
import { Image } from 'react-native';

// The app's round button icons. Each is a 192px PNG (sharp up to 64dp on a
// 3x screen) with a transparent background. Use `<AppIcon name="next" />`.
export const ICONS = {
  back: require('../assets/icons/back.png'),
  next: require('../assets/icons/next.png'),
  home: require('../assets/icons/home.png'),
  play: require('../assets/icons/play.png'),
  pause: require('../assets/icons/pause.png'),
  stop: require('../assets/icons/stop.png'),
  replay: require('../assets/icons/replay.png'),
  share: require('../assets/icons/share.png'),
  sound: require('../assets/icons/sound.png'),
  mute: require('../assets/icons/mute.png'),
};

export default function AppIcon({ name, size = 44, style }) {
  return (
    <Image
      source={ICONS[name]}
      resizeMode="contain"
      accessible={false}
      style={[{ width: size, height: size }, style]}
    />
  );
}
