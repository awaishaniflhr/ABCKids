import React from 'react';
import { ImageBackground, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeaderNew from '../components/HeaderNew';
import Games, { gameData } from '../components/Games';
export default function Home({ navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <ImageBackground
      source={require('../assets/letterbg.jpg')}
      resizeMode="cover"
      style={styles.background}
    >
      <StatusBar hidden />
      <View pointerEvents="none" style={styles.wash} />
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 8),
            paddingBottom: Math.max(insets.bottom, 8),
            paddingLeft: Math.max(insets.left, 20),
            paddingRight: Math.max(insets.right, 20),
          },
        ]}
      >
        <HeaderNew activityCount={gameData.length} />
        <Games navigation={navigation} />
      </View>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#daf5f7',
  },
  wash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
});
