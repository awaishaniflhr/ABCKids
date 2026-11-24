import React, { useCallback, useRef, useState } from 'react';
import { ImageBackground, StatusBar, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeaderNew from '../components/HeaderNew';
import HomeBanner from '../components/HomeBanner';
import Games, { visibleGames } from '../components/Games';
import { maybeShowInterstitial } from '../services/ads';

// Wait for the slide back to Home to finish before a full-screen ad.
const AD_DELAY_MS = 450;

export default function Home({ navigation }) {
  const insets = useSafeAreaInsets();
  const visited = useRef(false);
  const [bannerShown, setBannerShown] = useState(false);
  useFocusEffect(
    useCallback(() => {
      // The first time Home opens is app start, not a return from a game.
      if (!visited.current) {
        visited.current = true;
        return undefined;
      }
      const timer = setTimeout(maybeShowInterstitial, AD_DELAY_MS);
      return () => clearTimeout(timer);
    }, []),
  );
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
            paddingLeft: Math.max(insets.left, 20),
            paddingRight: Math.max(insets.right, 20),
          },
        ]}
      >
        <HeaderNew activityCount={visibleGames.length} />
        {/* The grid runs to the screen's bottom edge; the space for the
            phone's bottom bar goes inside the scroll, so no card is cut off
            at an invisible line. With a banner, the banner takes that space. */}
        <Games
          navigation={navigation}
          bottomSpace={bannerShown ? 8 : insets.bottom}
        />
      </View>
      <HomeBanner
        bottomInset={insets.bottom}
        onShownChange={setBannerShown}
      />
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
