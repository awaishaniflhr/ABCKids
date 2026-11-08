import React, { useEffect } from 'react';
import { AppState, StatusBar, StyleSheet, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Routes from './src/routes/Routes';
import SoundPlayer from './src/utills/SoundPlayer';
import Tts from 'react-native-tts';

const navigationTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#daf5f7' },
};

function stopAudio() {
  SoundPlayer.stop();
  Tts.stop().catch(() => {});
}

export default function App() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        stopAudio();
      }
    });
    return () => {
      subscription.remove();
      stopAudio();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar hidden />
        <NavigationContainer theme={navigationTheme} onStateChange={stopAudio}>
          <Routes />
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#daf5f7' },
});
