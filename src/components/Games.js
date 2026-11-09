import React, { memo, useCallback, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import SoundPlayer from '../utills/SoundPlayer';
import TracingIcon from './TracingIcon';

export const gameData = [
  {
    id: 'letters',
    name: 'Letters',
    Image: require('../assets/abc.png'),
    screen: 'Letters',
    color: '#1c8fbc',
    shadow: '#126c91',
  },
  {
    id: 'tracing',
    name: 'Letter Tracing',
    icon: 'tracing',
    screen: 'TracingLetters',
    color: '#8d83d7',
    shadow: '#685cae',
  },
  {
    id: 'balloons',
    name: 'Balloons',
    Image: require('../assets/balloongame.png'),
    screen: 'PoppBalloonsTemplate',
    color: '#9259d6',
    shadow: '#6c3aac',
  },
  {
    id: 'numbers',
    name: 'Numbers',
    Image: require('../assets/7.png'),
    screen: 'Numbers',
    color: '#ef9c43',
    shadow: '#c97625',
  },
  {
    id: 'matching',
    name: 'Matching',
    Image: require('../assets/matching.jpg'),
    screen: 'AlphabetsShapes',
    color: '#30a58d',
    shadow: '#1e7f6b',
  },
  {
    id: 'addition',
    name: 'Addition',
    Image: require('../assets/plus.png'),
    screen: 'Numeric',
    color: '#dd6d91',
    shadow: '#b7476b',
  },
  {
    id: 'coloring',
    name: 'Coloring',
    Image: require('../assets/coloring.png'),
    screen: 'ColorsTemplate',
    color: '#1ca8b9',
    shadow: '#0b7b8a',
  },
  {
    id: 'memory',
    name: 'Memory',
    Image: require('../assets/flipcard.png'),
    screen: 'MemoryFlipGame',
    color: '#e97665',
    shadow: '#bf5141',
  },
  {
    id: 'counting',
    name: 'Counting',
    Image: require('../assets/numberkeyboard.png'),
    screen: 'NumberKeyboard',
    color: '#627fca',
    shadow: '#415ba3',
  },
  {
    id: 'sounds',
    name: 'Sounds',
    Image: require('../assets/cat.png'),
    screen: 'Sounds',
    color: '#68a546',
    shadow: '#47812a',
  },
  {
    id: 'phone',
    name: 'Animal Phone',
    Image: require('../assets/call.png'),
    screen: 'Phone',
    color: '#a36acb',
    shadow: '#7c47a3',
  },
  {
    id: 'poems',
    name: 'Poems',
    Image: require('../assets/twinkle.png'),
    screen: 'Poems',
    color: '#d68b35',
    shadow: '#ad6a1d',
  },
];

const GAP = 12;

const GameCard = memo(function GameCard({ item, width, height, onSelect }) {
  const scale = useRef(new Animated.Value(1)).current;
  function animate(toValue) {
    Animated.spring(scale, {
      toValue,
      speed: 30,
      bounciness: 3,
      useNativeDriver: true,
    }).start();
  }
  const imageSize = Math.min(82, height * 0.57);

  return (
    <Animated.View
      style={[styles.cardShadow, { width, height, transform: [{ scale }] }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Play ${item.name}`}
        onPress={() => onSelect(item)}
        onPressIn={() => animate(0.95)}
        onPressOut={() => animate(1)}
        style={[styles.card, { backgroundColor: item.shadow }]}
      >
        <View style={[styles.cardFace, { backgroundColor: item.color }]}>
          <ImageBackground
            pointerEvents="none"
            source={require('../assets/shine2.png')}
            imageStyle={styles.rays}
            style={styles.artwork}
          >
            <View pointerEvents="none" style={styles.highlight} />
            {item.icon === 'tracing' ? (
              <TracingIcon size={imageSize} />
            ) : (
              <Image
                source={item.Image}
                resizeMode="contain"
                style={{ width: imageSize, height: imageSize }}
              />
            )}
          </ImageBackground>
          <View style={styles.caption}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={styles.label}
            >
              {item.name}
            </Text>
            <View style={styles.playIcon}>
              <Text style={styles.playArrow}>{'\u25b6'}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

export default function Games({ navigation }) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const measureGrid = useCallback(({ nativeEvent: { layout: next } }) => {
    setLayout(previous =>
      previous.width === next.width && previous.height === next.height
        ? previous
        : { width: next.width, height: next.height },
    );
  }, []);
  const onSelect = useCallback(
    item => {
      navigation.navigate(item.screen);
      SoundPlayer.playSoundFile('back', 'mp3');
    },
    [navigation],
  );
  const gridWidth = Math.max(0, layout.width - 8);
  const columns = Math.max(
    2,
    Math.min(6, Math.floor((gridWidth + GAP) / (124 + GAP))),
  );
  const cardWidth = (gridWidth - (columns - 1) * GAP) / columns;
  const cardHeight = Math.min(
    148,
    Math.max(106, (layout.height - GAP - 12) / 2),
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeading}>
        <Text style={styles.heading}>Pick your next adventure</Text>
        <Text style={styles.hint}>Tap to play</Text>
      </View>
      <View style={styles.grid} onLayout={measureGrid}>
        {gridWidth > 0 && (
          <FlatList
            key={columns}
            data={gameData}
            numColumns={columns}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <GameCard
                item={item}
                width={cardWidth}
                height={cardHeight}
                onSelect={onSelect}
              />
            )}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            initialNumToRender={12}
            removeClippedSubviews={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 8,
    gap: 8,
  },
  heading: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#294e6e',
    flexShrink: 1,
    includeFontPadding: false,
  },
  hint: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    color: '#54768a',
    includeFontPadding: false,
  },
  grid: { flex: 1 },
  list: { paddingHorizontal: 4, paddingTop: 2, paddingBottom: 16 },
  row: { gap: GAP, marginBottom: GAP },
  cardShadow: {
    shadowColor: '#285e7c',
    shadowOpacity: 0.14,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    backgroundColor: 'white',
    borderRadius: 22,
  },
  card: {
    flex: 1,
    borderRadius: 22,
    padding: 3,
    paddingBottom: 7,
    borderWidth: 3,
    borderColor: '#ffffff',
    overflow: 'hidden',
  },
  cardFace: { flex: 1, borderRadius: 15, overflow: 'hidden' },
  artwork: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rays: { opacity: 0.16 },
  highlight: {
    position: 'absolute',
    width: '130%',
    height: '80%',
    top: '-45%',
    backgroundColor: '#ffffff1c',
    borderRadius: 100,
  },
  caption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 9,
    backgroundColor: '#00000012',
  },
  label: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#ffffff',
    includeFontPadding: false,
  },
  playIcon: {
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff33',
  },
  playArrow: {
    fontSize: 8,
    color: '#ffffff',
    marginLeft: 1,
    includeFontPadding: false,
  },
});
