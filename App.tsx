import React, { useCallback, useEffect, useState } from 'react';
import { AppState, StatusBar, StyleSheet, View } from 'react-native';
import {
  createNavigationContainerRef,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Routes from './src/routes/Routes';
import SoundPlayer from './src/utills/SoundPlayer';
import { initAds } from './src/services/ads';
import Tts from 'react-native-tts';
import { initAudio } from './src/services/audio';
import { initPurchases } from './src/services/purchases';
import { consumeReminderTap, initReminders } from './src/services/reminders';
import SplashScreen from './src/components/SplashScreen';

const navigationTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#daf5f7' },
};

const navigationRef = createNavigationContainerRef<any>();

// Opened by tapping a play reminder: go straight to that game's next item,
// with Home (and the game's list) underneath so Back still works.
async function openFromReminder() {
  const routes = await consumeReminderTap();
  if (routes && navigationRef.isReady()) {
    navigationRef.reset({ index: routes.length - 1, routes });
  }
}

function stopAudio() {
  SoundPlayer.stop();
  Tts.stop().catch(() => {});
}

export default function App() {
  useEffect(() => {
    // Load the saved ad-free status first, so a parent who bought
    // "Remove Ads Forever" never sees an ad, even offline.
    initPurchases().then(initAds);
    initAudio();
    initReminders();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        stopAudio();
      } else {
        openFromReminder();
      }
    });
    return () => {
      subscription.remove();
      stopAudio();
    };
  }, []);

  // The animated splash covers the app while Home loads underneath.
  const [splash, setSplash] = useState(true);
  const hideSplash = useCallback(() => setSplash(false), []);

  const onReady = useCallback(() => {
    openFromReminder();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar hidden />
        <View
          style={styles.container}
          importantForAccessibility={splash ? 'no-hide-descendants' : 'auto'}
          accessibilityElementsHidden={splash}
        >
          <NavigationContainer
            ref={navigationRef}
            theme={navigationTheme}
            onReady={onReady}
            onStateChange={stopAudio}
          >
            <Routes />
          </NavigationContainer>
        </View>
        {splash ? <SplashScreen onDone={hideSplash} /> : null}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#daf5f7' },
});
