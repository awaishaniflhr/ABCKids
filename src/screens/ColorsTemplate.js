import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../components/BackButton';
import ColoringSketch from '../components/ColoringSketch';
import { COLORING_TEMPLATES } from '../games/coloringTemplates';

// How far the cards scroll before the header's glass is fully showing.
const GLASS_FADE_PX = 24;
// Soft blue glass matching the blue wall in this screen's background.
const GLASS_BLUE = 'rgba(194, 221, 242, 0.85)';

export default function ColorsTemplate({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const wide = width > height;
  const columns = wide ? 3 : 2;
  const cardWidth =
    (width - insets.left - insets.right - 32 - (columns - 1) * 12) / columns;
  const cardHeight = wide
    ? Math.max(
        134,
        Math.min(220, (height - insets.top - insets.bottom - 112) / 2),
      )
    : 230;
  // Home-style floating header: the cards scroll up underneath it and a
  // blue glass panel fades in behind it.
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerHeight, setHeaderHeight] = useState(0);
  const measureHeader = useCallback(({ nativeEvent: { layout } }) => {
    setHeaderHeight(previous =>
      Math.abs(previous - layout.height) < 1 ? previous : layout.height,
    );
  }, []);
  const glassOpacity = scrollY.interpolate({
    inputRange: [0, GLASS_FADE_PX],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      }),
    [scrollY],
  );
  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <Image
        source={require('../assets/homebgimg.jpg')}
        style={styles.background}
        resizeMode="cover"
        pointerEvents="none"
      />
      <Animated.FlatList
        key={columns}
        numColumns={columns}
        data={COLORING_TEMPLATES}
        keyExtractor={item => item.id}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + 8,
            paddingLeft: insets.left + 16,
            paddingRight: insets.right + 16,
            paddingBottom: insets.bottom + 16,
          },
        ]}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Colour ${item.name.toLowerCase()}`}
            onPress={() =>
              navigation.navigate('Coloring', {
                templateId: item.id,
              })
            }
            style={({ pressed }) => [
              styles.card,
              {
                width: cardWidth,
                height: cardHeight,
                borderColor: item.accent,
              },
              pressed && styles.pressed,
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.preview,
                {
                  backgroundColor: item.tint,
                },
              ]}
            >
              <ColoringSketch template={item} />
            </View>
            <View style={styles.caption}>
              <View style={styles.captionText}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.detail}>
                  {item.regions.length} parts to colour
                </Text>
              </View>
              <View
                style={[
                  styles.play,
                  {
                    backgroundColor: item.accent,
                  },
                ]}
              >
                <Text style={styles.playText}>›</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
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
            styles.header,
            {
              paddingTop: insets.top + 8,
              paddingLeft: insets.left + 10,
              paddingRight: insets.right + 16,
            },
          ]}
        >
          <BackButton navigation={navigation} size={34} />
          <View style={styles.heading}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.title}>
              Colour the Shapes
            </Text>
            <Text numberOfLines={1} style={styles.subtitle}>
              Pick a picture to colour
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {COLORING_TEMPLATES.length} fun pictures
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF5E4',
  },
  background: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  headerLayer: { position: 'absolute', top: 0, left: 0, right: 0 },
  // Frosted glass like Home's header, in this screen's blue.
  glass: {
    ...StyleSheet.absoluteFill,
    backgroundColor: GLASS_BLUE,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  // Compact, in Home's style: title straight on the background.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
  },
  heading: { flex: 1 },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#22486b',
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: '#4d6881',
    includeFontPadding: false,
  },
  badge: {
    backgroundColor: '#FFE6A1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  badgeText: {
    color: '#8B6324',
    fontWeight: '800',
    fontSize: 12,
  },
  row: {
    gap: 12,
  },
  listContent: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderRadius: 22,
    padding: 5,
    overflow: 'hidden',
  },
  preview: {
    flex: 1,
    borderRadius: 15,
  },
  caption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingTop: 5,
    paddingBottom: 3,
  },
  captionText: {
    flex: 1,
  },
  name: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#31516B',
  },
  detail: {
    fontSize: 10,
    color: '#68818C',
  },
  play: {
    width: 28,
    height: 28,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: {
    color: '#FFFFFF',
    fontSize: 27,
    lineHeight: 30,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },
});
