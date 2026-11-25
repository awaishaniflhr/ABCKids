import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from './ScreenContainer';
import BackButton from './BackButton';
import AppIcon from './AppIcon';
import { gridLayout } from '../games/responsiveLayout';
import { GLASS_PINK, glassTitlePill } from './glass';

export function useActivityLayout() {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return {
    ...window,
    insets,
    wide: window.width > window.height,
    contentWidth: Math.max(1, window.width - insets.left - insets.right - 24),
    contentHeight: Math.max(1, window.height - insets.top - insets.bottom - 90),
  };
}

// How far a grid scrolls before the glass header is fully showing.
const GLASS_FADE_PX = 24;

// Set by a `glassHeader` ActivityScreen so its ResponsiveGrid can scroll
// under the floating header and report how far it has scrolled.
const GlassScrollContext = createContext(null);

// `headerRight` is shown at the right end of the header, next to the title.
// With `glassHeader`, the header floats over the content like on Home: the
// grid scrolls up underneath it and a baby-pink glass panel fades in.
// `headerTheme` ({ glass, title, subtitle } colours) gives the header a
// full-width glass bar tinted to match a game, e.g. mint for Matching.
// `homeHeader` gives a compact header in Home's style instead: no bar or
// pill, the title straight on the background with a one-line tagline.
export function ActivityScreen({
  navigation,
  title,
  subtitle,
  headerRight,
  glassHeader = false,
  headerTheme,
  homeHeader = false,
  children,
}) {
  const { insets } = useActivityLayout();
  if (glassHeader) {
    return (
      <GlassActivityScreen
        navigation={navigation}
        title={title}
        subtitle={subtitle}
        headerRight={headerRight}
      >
        {children}
      </GlassActivityScreen>
    );
  }
  return (
    <ScreenContainer
      source={require('../assets/letterbg.jpg')}
      style={styles.screen}
    >
      <View
        style={[
          styles.header,
          homeHeader && styles.homeHeader,
          headerTheme && [
            styles.themedHeader,
            { backgroundColor: headerTheme.glass },
          ],
          {
            marginTop: -insets.top,
            marginLeft: -insets.left,
            marginRight: -insets.right,
            paddingTop: insets.top + 4,
            paddingLeft: insets.left + 10,
            paddingRight: insets.right + 10,
          },
        ]}
      >
        <BackButton navigation={navigation} size={34} />
        <View
          style={
            headerTheme || homeHeader ? styles.glassHeading : styles.heading
          }
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={[
              styles.title,
              homeHeader && styles.homeTitle,
              headerTheme?.title && { color: headerTheme.title },
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              numberOfLines={homeHeader ? 1 : undefined}
              style={[
                styles.subtitle,
                homeHeader && styles.homeSubtitle,
                headerTheme?.subtitle && { color: headerTheme.subtitle },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {headerRight}
      </View>
      <View style={styles.content}>{children}</View>
    </ScreenContainer>
  );
}

function GlassActivityScreen({
  navigation,
  title,
  subtitle,
  headerRight,
  children,
}) {
  const { insets } = useActivityLayout();
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
  const scroll = useMemo(
    () => ({
      scrollY,
      topSpace: headerHeight,
      bottomSpace: insets.bottom,
    }),
    [scrollY, headerHeight, insets.bottom],
  );
  return (
    <ImageBackground
      source={require('../assets/letterbg.jpg')}
      resizeMode="cover"
      style={styles.screen}
    >
      <View
        style={[
          styles.glassContent,
          {
            paddingLeft: insets.left + 12,
            paddingRight: insets.right + 12,
          },
        ]}
      >
        <GlassScrollContext.Provider value={scroll}>
          {children}
        </GlassScrollContext.Provider>
      </View>
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
              paddingTop: insets.top + 4,
              paddingLeft: insets.left + 10,
              paddingRight: insets.right + 10,
            },
          ]}
        >
          <BackButton navigation={navigation} size={34} />
          <View style={styles.glassHeading}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={styles.title}
            >
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {headerRight}
        </View>
      </View>
    </ImageBackground>
  );
}

// `bottomSpace` keeps extra room after the last row (e.g. for a floating
// Continue button) so no card is hidden behind it.
export function ResponsiveGrid({
  data,
  renderItem,
  minWidth = 120,
  maxColumns = 6,
  itemHeight = 140,
  bottomSpace = 0,
  testID,
}) {
  const { contentWidth } = useActivityLayout();
  const [measured, setMeasured] = useState(0);
  const measure = useCallback(
    ({ nativeEvent: { layout } }) => setMeasured(layout.width),
    [],
  );
  const grid = gridLayout(measured || contentWidth, minWidth, maxColumns);
  // Under a glass header the grid starts behind it and reports its scroll.
  const glass = useContext(GlassScrollContext);
  const onScroll = useMemo(
    () =>
      glass
        ? Animated.event(
            [{ nativeEvent: { contentOffset: { y: glass.scrollY } } }],
            { useNativeDriver: true },
          )
        : undefined,
    [glass],
  );
  const listStyle = glass
    ? [
        styles.list,
        {
          paddingTop: glass.topSpace + 8,
          paddingBottom: glass.bottomSpace + 12 + bottomSpace,
        },
      ]
    : [styles.list, { paddingBottom: 12 + bottomSpace }];
  return (
    <View testID={testID} style={styles.grid} onLayout={measure}>
      <Animated.FlatList
        key={grid.columns}
        data={data}
        numColumns={grid.columns}
        keyExtractor={item => String(item.id ?? item.Letter ?? item.name)}
        columnWrapperStyle={grid.columns > 1 ? styles.row : undefined}
        contentContainerStyle={listStyle}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) =>
          renderItem({ item, index, width: grid.cellWidth, height: itemHeight })
        }
      />
    </View>
  );
}

export function LearningCard({
  label,
  text,
  image,
  art,
  caption,
  width,
  height = 140,
  onPress,
  selected,
  color = '#43A4B5',
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(selected) }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width, height, borderColor: color },
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      {text ? (
        <Text
          style={[styles.letter, { color }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {text}
        </Text>
      ) : null}
      {image ? (
        <Image source={image} resizeMode="contain" style={styles.art} />
      ) : null}
      {art ? (
        <View pointerEvents="none" style={styles.art}>
          {art}
        </View>
      ) : null}
      {caption ? (
        <Text numberOfLines={2} adjustsFontSizeToFit style={styles.caption}>
          {caption}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function ActionButton({ label, onPress, disabled, selected }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        selected: Boolean(selected),
        disabled: Boolean(disabled),
      }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.action,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

// The "well done" card at the end of a game, with round Home and replay
// icons. `replayIcon` can be 'next' when the button moves on (e.g. Memory's
// "Next level"); `replayLabel` is what screen readers say for it.
export function ActivityResult({
  navigation,
  title = 'Well done!',
  message,
  onReplay,
  replayLabel = 'Play again',
  replayIcon = 'replay',
}) {
  const { contentWidth, contentHeight } = useActivityLayout();
  return (
    <View
      accessibilityViewIsModal
      testID="activity-result"
      style={styles.overlay}
    >
      <View
        style={[
          styles.result,
          {
            width: Math.min(420, contentWidth - 24),
            maxHeight: contentHeight - 24,
          },
        ]}
      >
        <ScrollView
          style={styles.resultBody}
          contentContainerStyle={styles.resultContent}
        >
          <Text style={styles.stars}>★ ★ ★</Text>
          <Text style={styles.resultTitle}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </ScrollView>
        <View style={styles.actions}>
          <ResultIcon
            label="Home"
            icon="home"
            onPress={() => navigation.navigate('Home')}
          />
          <ResultIcon label={replayLabel} icon={replayIcon} onPress={onReplay} />
        </View>
      </View>
    </View>
  );
}

const RESULT_ICON = 56;

function ResultIcon({ label, icon, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.resultIcon, pressed && styles.pressed]}
    >
      <AppIcon name={icon} size={RESULT_ICON} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#DAF5F7' },
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 8,
  },
  heading: glassTitlePill,
  title: { fontFamily: 'Poppins-Bold', fontSize: 23, color: '#284B67' },
  subtitle: { color: '#54768A', fontSize: 11 },
  content: { flex: 1, padding: 12, minHeight: 0 },
  glassContent: { flex: 1, minHeight: 0 },
  headerLayer: { position: 'absolute', top: 0, left: 0, right: 0 },
  // Same frosted baby-pink glass as Home's header.
  glass: {
    ...StyleSheet.absoluteFill,
    backgroundColor: GLASS_PINK,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  glassHeading: { flex: 1 },
  grid: { flex: 1, minHeight: 0 },
  row: { gap: 12 },
  list: { gap: 12, paddingBottom: 12 },
  card: {
    borderRadius: 20,
    borderWidth: 3,
    padding: 8,
    backgroundColor: '#FFFEFA',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  letter: { fontSize: 36, fontWeight: '800' },
  art: { flex: 1, width: '85%', minHeight: 24 },
  caption: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    color: '#31516B',
  },
  selected: { backgroundColor: '#FFE6A1' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  action: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#DDF2EE',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#31516B',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 20,
    backgroundColor: '#233D58AA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  result: {
    borderRadius: 26,
    borderWidth: 3,
    borderColor: '#FFD56C',
    padding: 16,
    backgroundColor: '#FFFAF1',
  },
  resultBody: { flexShrink: 1 },
  resultContent: { alignItems: 'center' },
  stars: { color: '#EFB336', fontSize: 34 },
  resultTitle: {
    color: '#284B67',
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    textAlign: 'center',
  },
  message: {
    color: '#54768A',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginTop: 12,
    flexShrink: 0,
  },
  resultIcon: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Compact Home-style header for `homeHeader` (same fonts as Home's title).
  homeHeader: { minHeight: 0, paddingBottom: 2 },
  homeTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#22486b',
    includeFontPadding: false,
  },
  homeSubtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: '#4d6881',
    includeFontPadding: false,
  },
  // Full-width tinted glass bar for `headerTheme`.
  themedHeader: {
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingBottom: 8,
  },
});
