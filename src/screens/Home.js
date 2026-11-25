import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeaderNew from '../components/HeaderNew';
import HomeBanner from '../components/HomeBanner';
import { GLASS_PINK } from '../components/glass';
import Games from '../components/Games';
import { maybeShowInterstitial } from '../services/ads';
import { useScreenMusic } from '../services/audio';
import { markHomeReady } from '../services/splash';

// Wait for the slide back to Home to finish before a full-screen ad.
const AD_DELAY_MS = 450;
// How far the cards scroll before the header's glass is fully showing.
const GLASS_FADE_PX = 24;

export default function Home({ navigation }) {
  const insets = useSafeAreaInsets();
  const visited = useRef(false);
  const [bannerShown, setBannerShown] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  // Tell the splash screen Home is ready once the header is measured and the
  // background picture has loaded (and the first drawing work has settled).
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  useEffect(() => {
    if (!backgroundLoaded || !headerHeight) return undefined;
    // Once the phone has a free moment (first drawing done). Fallback for
    // safety if idle callbacks aren't available.
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(markHomeReady, { timeout: 1000 });
      return () => cancelIdleCallback(id);
    }
    const timer = setTimeout(markHomeReady, 100);
    return () => clearTimeout(timer);
  }, [backgroundLoaded, headerHeight]);
  // A playful tune loops while the child browses; it stops when a game opens.
  useScreenMusic('home');
  const glassOpacity = scrollY.interpolate({
    inputRange: [0, GLASS_FADE_PX],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const measureHeader = useCallback(({ nativeEvent: { layout } }) => {
    setHeaderHeight(previous =>
      Math.abs(previous - layout.height) < 1 ? previous : layout.height,
    );
  }, []);
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
  const sides = {
    paddingLeft: Math.max(insets.left, 20),
    paddingRight: Math.max(insets.right, 20),
  };
  return (
    <ImageBackground
      source={require('../assets/letterbg.jpg')}
      resizeMode="cover"
      style={styles.background}
      onLoadEnd={() => setBackgroundLoaded(true)}
    >
      <StatusBar hidden />
      <View pointerEvents="none" style={styles.wash} />
      <View style={[styles.content, sides]}>
        {/* The grid runs from under the floating header to the screen's
            bottom edge. The room for both goes inside the scroll, so the
            first and last cards still scroll fully into view. With a banner,
            the banner takes the bottom room. */}
        <Games
          navigation={navigation}
          topSpace={headerHeight}
          bottomSpace={bannerShown ? 8 : insets.bottom}
          scrollY={scrollY}
        />
      </View>
      {/* Floating header. Its frosted-glass panel fades in once the cards
          start scrolling up underneath it. */}
      <View
        pointerEvents="box-none"
        style={styles.headerLayer}
        onLayout={measureHeader}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.glass, { opacity: glassOpacity }]}
        />
        <View
          pointerEvents="box-none"
          style={[
            styles.headerContent,
            sides,
            { paddingTop: Math.max(insets.top, 8) },
          ]}
        >
          <HeaderNew />
        </View>
      </View>
      <HomeBanner bottomInset={insets.bottom} onShownChange={setBannerShown} />
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
  headerLayer: { position: 'absolute', top: 0, left: 0, right: 0 },
  // Frosted glass in baby pink (matching the pink at the top of the Home
  // background) with soft rounded bottom corners and no border.
  glass: {
    ...StyleSheet.absoluteFill,
    backgroundColor: GLASS_PINK,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerContent: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
});
