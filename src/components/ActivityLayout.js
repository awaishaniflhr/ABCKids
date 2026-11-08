import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
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
import { gridLayout } from '../games/responsiveLayout';

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

export function ActivityScreen({ navigation, title, subtitle, children }) {
  const { insets } = useActivityLayout();
  return (
    <ScreenContainer
      source={require('../assets/letterbg.jpg')}
      style={styles.screen}
    >
      <View
        style={[
          styles.header,
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
        <View style={styles.heading}>
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
      </View>
      <View style={styles.content}>{children}</View>
    </ScreenContainer>
  );
}

export function ResponsiveGrid({
  data,
  renderItem,
  minWidth = 120,
  maxColumns = 6,
  itemHeight = 140,
  testID,
}) {
  const { contentWidth } = useActivityLayout();
  const [measured, setMeasured] = useState(0);
  const measure = useCallback(
    ({ nativeEvent: { layout } }) => setMeasured(layout.width),
    [],
  );
  const grid = gridLayout(measured || contentWidth, minWidth, maxColumns);
  return (
    <View testID={testID} style={styles.grid} onLayout={measure}>
      <FlatList
        key={grid.columns}
        data={data}
        numColumns={grid.columns}
        keyExtractor={item => String(item.id ?? item.Letter ?? item.name)}
        columnWrapperStyle={grid.columns > 1 ? styles.row : undefined}
        contentContainerStyle={styles.list}
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

export function ActivityResult({
  navigation,
  title = 'Well done!',
  message,
  onReplay,
  replayLabel = 'Play again',
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
          <BackButton navigation={navigation} />
          <ActionButton label={replayLabel} onPress={onReplay} />
        </View>
      </View>
    </View>
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
    backgroundColor: '#FFFAF1EF',
  },
  heading: { flex: 1 },
  title: { fontFamily: 'Poppins-Bold', fontSize: 23, color: '#284B67' },
  subtitle: { color: '#54768A', fontSize: 11 },
  content: { flex: 1, padding: 12, minHeight: 0 },
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
    justifyContent: 'space-evenly',
    gap: 12,
    marginTop: 12,
    flexShrink: 0,
  },
});
