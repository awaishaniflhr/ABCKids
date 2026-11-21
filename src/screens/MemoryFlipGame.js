import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ActionButton,
  ActivityScreen,
  ActivityResult,
  useActivityLayout,
} from '../components/ActivityLayout';
import { useReducedMotion } from '../components/SingAlongBackdrop';
import SoundPlayer from '../utills/SoundPlayer';
import useSpeech from '../games/useSpeech';
import { FRUITS } from '../games/addition';
import {
  MISMATCH_MS,
  boardColumns,
  flipCard,
  hideMismatch,
  isComplete,
  newMemoryGame,
  pairsFor,
} from '../games/memory';

const GAP = 10;
const FLIP_MS = 320;

// The card back: purple with little yellow stars and a big "?".
function CardBack({ size }) {
  return (
    <View style={[styles.face, styles.back]}>
      {[0.2, 0.5, 0.8].map(x =>
        [0.2, 0.8].map(y => (
          <Text
            key={`${x}-${y}`}
            style={[
              styles.backStar,
              {
                left: size * x - size * 0.07,
                top: size * y - size * 0.09,
                fontSize: size * 0.14,
              },
            ]}
          >
            {'★'}
          </Text>
        )),
      )}
      <Text style={[styles.question, { fontSize: size * 0.42 }]}>?</Text>
    </View>
  );
}

function MemoryCard({ fruit, index, size, revealed, solved, wrong, onPress }) {
  const reduced = useReducedMotion();
  const turn = useRef(new Animated.Value(revealed ? 1 : 0)).current;
  const bump = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(turn, {
      toValue: revealed ? 1 : 0,
      duration: reduced ? 0 : FLIP_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [revealed, reduced, turn]);

  useEffect(() => {
    if (!solved || reduced) return;
    bump.setValue(0);
    Animated.sequence([
      Animated.delay(FLIP_MS),
      Animated.spring(bump, {
        toValue: 1,
        friction: 3,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, [solved, reduced, bump]);

  useEffect(() => {
    if (!wrong || reduced) return;
    shake.setValue(0);
    Animated.sequence([
      Animated.delay(FLIP_MS),
      Animated.timing(shake, {
        toValue: 1,
        duration: 420,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  }, [wrong, reduced, shake]);

  const backRotate = turn.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const frontRotate = turn.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  // Swap faces halfway, in case backface hiding is not supported.
  const backOpacity = turn.interpolate({
    inputRange: [0.49, 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const frontOpacity = turn.interpolate({
    inputRange: [0.49, 0.5],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const scale = bump.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.15, 1],
  });
  const translateX = shake.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0, -8, 8, -6, 6, 0],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        revealed ? `Card ${index + 1}: ${fruit.name}` : `Flip card ${index + 1}`
      }
      onPress={onPress}
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          transform: [{ translateX }, { scale }],
        }}
      >
        <Animated.View
          style={[
            styles.side,
            {
              opacity: backOpacity,
              transform: [{ perspective: 800 }, { rotateY: backRotate }],
            },
          ]}
        >
          <CardBack size={size} />
        </Animated.View>
        <Animated.View
          style={[
            styles.side,
            {
              opacity: frontOpacity,
              transform: [{ perspective: 800 }, { rotateY: frontRotate }],
            },
          ]}
        >
          <View style={[styles.face, styles.front, solved && styles.solved]}>
            <Image
              source={fruit.image}
              resizeMode="contain"
              style={{ width: size * 0.7, height: size * 0.7 }}
            />
            {solved ? (
              <View style={styles.tick}>
                <Text style={styles.tickText}>{'✓'}</Text>
              </View>
            ) : null}
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export default function MemoryFlipGame({ navigation }) {
  const [game, setGame] = useState(() => newMemoryGame(0));
  // Bumped on every new board so the cards start face down again.
  const [round, setRound] = useState(0);
  const current = useRef(game);
  current.current = game;
  const speak = useSpeech();
  const { contentWidth, contentHeight } = useActivityLayout();
  const complete = isComplete(game);
  const pairs = pairsFor(game.level);
  const { columns, size: fit } = boardColumns(
    game.cards.length,
    contentWidth,
    contentHeight - 72,
    GAP,
  );
  const size = Math.max(56, Math.min(150, fit));

  // Two different fruits stay up for a moment, then turn back over.
  useEffect(() => {
    if (game.flipped.length !== 2) return undefined;
    const timer = setTimeout(
      () => setGame(previous => hideMismatch(previous)),
      MISMATCH_MS,
    );
    return () => clearTimeout(timer);
  }, [game.flipped]);

  useEffect(() => {
    if (!complete) return undefined;
    const timer = setTimeout(() => {
      SoundPlayer.playSoundFile('modalsound', 'mp3');
      speak('Well done! You found all the fruit pairs!');
    }, FLIP_MS + 300);
    return () => clearTimeout(timer);
  }, [complete, speak]);

  function flip(index) {
    const before = current.current;
    const next = flipCard(before, index);
    if (next === before) return;
    current.current = next;
    setGame(next);
    const fruit = FRUITS[before.cards[index]];
    const matched = next.solved.length > before.solved.length;
    SoundPlayer.playSoundFile(matched ? 'done' : 'flip', 'mp3');
    speak(matched ? `${fruit.name}! It's a match!` : fruit.name);
  }

  function start(level) {
    const next = newMemoryGame(level);
    current.current = next;
    setGame(next);
    setRound(value => value + 1);
  }

  const wrong = game.flipped.length === 2 ? game.flipped : [];
  return (
    <ActivityScreen
      navigation={navigation}
      title="Fruit Memory"
      subtitle={`Level ${game.level + 1} · ${
        game.solved.length / 2
      } of ${pairs} pairs found`}
    >
      <View style={styles.area}>
        <View
          style={[
            styles.board,
            { width: columns * size + (columns - 1) * GAP },
          ]}
        >
          {game.cards.map((fruitIndex, index) => (
            <MemoryCard
              key={`${round}-${index}`}
              fruit={FRUITS[fruitIndex]}
              index={index}
              size={size}
              revealed={
                game.flipped.includes(index) || game.solved.includes(index)
              }
              solved={game.solved.includes(index)}
              wrong={wrong.includes(index)}
              onPress={() => flip(index)}
            />
          ))}
        </View>
      </View>
      <View style={styles.reset}>
        <ActionButton label="New game" onPress={() => start(game.level)} />
      </View>
      {complete && (
        <ActivityResult
          navigation={navigation}
          title={`Level ${game.level + 1} done!`}
          message={`You found all ${pairs} fruit pairs in ${game.moves} tries!`}
          replayLabel="Next level"
          onReplay={() => start(game.level + 1)}
        />
      )}
    </ActivityScreen>
  );
}

const styles = StyleSheet.create({
  area: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: GAP,
  },
  side: { ...StyleSheet.absoluteFill, backfaceVisibility: 'hidden' },
  face: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#2A3A6B',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
  },
  back: { backgroundColor: '#8C70D8', borderColor: '#FFFFFF' },
  backStar: { position: 'absolute', color: '#FFD43B', opacity: 0.85 },
  question: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-ExtraBold',
    includeFontPadding: false,
  },
  front: { backgroundColor: '#FFFBEF', borderColor: '#FFD43B' },
  solved: { borderColor: '#2FB36E', backgroundColor: '#EEFFF4' },
  tick: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2FB36E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  reset: { paddingTop: 8, alignItems: 'center' },
});
