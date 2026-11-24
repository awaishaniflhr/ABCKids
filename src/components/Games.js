import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import SoundPlayer from '../utills/SoundPlayer';
import TracingIcon from './TracingIcon';
import MatchingIcon from './MatchingIcon';
import PictureCard, { pictureCardHeight } from './PictureCard';
import { useReducedMotion } from './SingAlongBackdrop';

export const gameData = [
  {
    id: 'letters',
    name: 'Letters',
    Image: require('../assets/abc.png'),
    screen: 'Letters',
    hidden: true,
    color: '#1c8fbc',
    shadow: '#126c91',
  },
  {
    id: 'tracing',
    name: 'Letter Tracing',
    icon: 'tracing',
    cover: require('../assets/game_lettertracing.jpg'),
    screen: 'TracingLetters',
    color: '#8d83d7',
    shadow: '#685cae',
  },
  {
    id: 'number-tracing',
    name: 'Number Tracing',
    icon: 'number-tracing',
    cover: require('../assets/game_numbertracing.jpg'),
    screen: 'TracingNumbers',
    color: '#f2b13d',
    shadow: '#c98a1c',
  },
  {
    id: 'dot-tracing',
    name: 'Dot Tracing',
    icon: 'dot-tracing',
    cover: require('../assets/game_dottracing.jpg'),
    screen: 'DotTracing',
    color: '#2aa86f',
    shadow: '#1b7f52',
  },
  {
    id: 'balloons',
    name: 'Balloons',
    Image: require('../assets/balloongame.png'),
    cover: require('../assets/game_balloons.jpg'),
    screen: 'PopBalloons',
    color: '#9259d6',
    shadow: '#6c3aac',
  },
  {
    id: 'numbers',
    name: 'Numbers',
    Image: require('../assets/7.png'),
    screen: 'Numbers',
    hidden: true,
    color: '#ef9c43',
    shadow: '#c97625',
  },
  {
    id: 'matching',
    name: 'Matching',
    icon: 'matching',
    screen: 'AlphabetShapes',
    color: '#30a58d',
    shadow: '#1e7f6b',
  },
  {
    id: 'addition',
    name: 'Addition',
    Image: require('../assets/addition.png'),
    cover: require('../assets/game_addition.jpg'),
    screen: 'Numeric',
    color: '#dd6d91',
    shadow: '#b7476b',
  },
  {
    id: 'coloring',
    name: 'Coloring',
    Image: require('../assets/coloring.png'),
    cover: require('../assets/game_coloring.jpg'),
    screen: 'ColorsTemplate',
    color: '#1ca8b9',
    shadow: '#0b7b8a',
  },
  {
    id: 'memory',
    name: 'Memory',
    Image: require('../assets/flipcard.png'),
    cover: require('../assets/game_memory.jpg'),
    screen: 'MemoryFlipGame',
    color: '#e97665',
    shadow: '#bf5141',
  },
  {
    id: 'word-tracing',
    name: 'Word Tracing',
    icon: 'word-tracing',
    cover: require('../assets/game_wordtracing.jpg'),
    screen: 'WordTracing',
    color: '#3f5fd0',
    shadow: '#28409f',
  },
  {
    id: 'counting',
    name: 'Counting',
    Image: require('../assets/numberkeyboard.png'),
    screen: 'NumberKeyboard',
    hidden: true,
    color: '#627fca',
    shadow: '#415ba3',
  },
  {
    id: 'sounds',
    name: 'Sounds',
    Image: require('../assets/cat.png'),
    cover: require('../assets/game_sounds.jpg'),
    screen: 'Sounds',
    color: '#68a546',
    shadow: '#47812a',
  },
  {
    id: 'phone',
    name: 'Animal Phone',
    Image: require('../assets/call.png'),
    cover: require('../assets/game_phone.jpg'),
    screen: 'Phone',
    color: '#a36acb',
    shadow: '#7c47a3',
  },
  {
    id: 'poems',
    name: 'Poems',
    Image: require('../assets/twinkle.png'),
    cover: require('../assets/game_poems.jpg'),
    screen: 'Poems',
    color: '#d68b35',
    shadow: '#ad6a1d',
  },
];

// Games marked `hidden` keep their screens and routes but are not shown on Home.
export const visibleGames = gameData.filter(item => !item.hidden);

const TRACING_ICONS = {
  tracing: 'letter',
  'number-tracing': 'number',
  'word-tracing': 'word',
  'dot-tracing': 'dots',
};

const GAP = 12;
const MIN_CARD_WIDTH = 130;

// Games with a `cover` show that picture; the rest show their icon.
function GameArt({ item, size }) {
  if (item.icon === 'matching') return <MatchingIcon size={size} />;
  if (item.icon in TRACING_ICONS) {
    return <TracingIcon size={size} variant={TRACING_ICONS[item.icon]} />;
  }
  return (
    <Image
      source={item.Image}
      resizeMode="contain"
      style={{ width: size, height: size }}
    />
  );
}

const TITLE_COLOR = '#2B2F77';
const POP_MS = 3200;

const TITLE_FONT_SIZE = 18;

export const titleRoom = () => Math.round(TITLE_FONT_SIZE * 1.5) + 12;

function PopTitle({ text, delay }) {
  const reduced = useReducedMotion();
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pop, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(pop, {
          toValue: 0,
          friction: 3,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.delay(POP_MS),
      ]),
    );
    const start = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(start);
      loop.stop();
    };
  }, [reduced, pop, delay]);
  const scale = pop.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.9, 1, 1.14],
  });
  return (
    <Animated.Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
      style={[
        styles.title,
        { fontSize: TITLE_FONT_SIZE, transform: [{ scale }] },
      ]}
    >
      {text}
    </Animated.Text>
  );
}

const GameCard = memo(function GameCard({
  item,
  index,
  width,
  height,
  onSelect,
}) {
  return (
    <PictureCard
      title={item.name}
      cover={item.cover}
      color={item.color}
      width={width}
      height={height}
      accessibilityLabel={`Play ${item.name}`}
      onPress={() => onSelect(item)}
      renderTitle={() => <PopTitle text={item.name} delay={index * 260} />}
    >
      <GameArt item={item} size={(width - 16) * 0.55} />
    </PictureCard>
  );
});

// `bottomSpace` is extra room after the last row, so the grid can run to the
// bottom of the screen and its last cards still scroll fully into view.
export default function Games({ navigation, bottomSpace = 0 }) {
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
    Math.min(6, Math.floor((gridWidth + GAP) / (MIN_CARD_WIDTH + GAP))),
  );
  const cardWidth = (gridWidth - (columns - 1) * GAP) / columns;
  const cardHeight = pictureCardHeight(cardWidth, titleRoom(cardWidth));

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
            data={visibleGames}
            numColumns={columns}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <GameCard
                item={item}
                index={index}
                width={cardWidth}
                height={cardHeight}
                onSelect={onSelect}
              />
            )}
            columnWrapperStyle={styles.row}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: styles.list.paddingBottom + bottomSpace },
            ]}
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
  title: {
    color: TITLE_COLOR,
    fontFamily: 'Poppins-ExtraBold',
    textAlign: 'center',
    includeFontPadding: false,
  },
  list: { paddingHorizontal: 4, paddingTop: 4, paddingBottom: 20 },
  row: { gap: GAP, marginBottom: GAP },
});
