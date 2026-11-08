import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ActionButton,
  ActivityScreen,
  ActivityResult,
  useActivityLayout,
} from '../components/ActivityLayout';
import SoundPlayer from '../utills/SoundPlayer';
function newGame(round = 0) {
  const cards = ['A', 'B', 'C', 'D', 'E', 'F', 'A', 'B', 'C', 'D', 'E', 'F'];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return { cards, flipped: [], solved: [], round };
}
export default function MemoryFlipGame({ navigation }) {
  const [game, setGame] = useState(newGame);
  const current = useRef(game);
  current.current = game;
  const { wide, contentWidth, contentHeight } = useActivityLayout();
  const columns = wide ? 6 : 3;
  const rows = 12 / columns;
  const size = Math.max(
    44,
    Math.min(
      112,
      (contentWidth - (columns - 1) * 8) / columns,
      (contentHeight - 72 - (rows - 1) * 8) / rows,
    ),
  );
  const complete = game.solved.length === 12;
  useEffect(() => {
    if (game.flipped.length !== 2) return;
    const timer = setTimeout(
      () => setGame(previous => ({ ...previous, flipped: [] })),
      850,
    );
    return () => clearTimeout(timer);
  }, [game.flipped, game.round]);
  useEffect(() => {
    if (complete) SoundPlayer.playSoundFile('modalsound', 'mp3');
  }, [complete]);
  function flip(index) {
    const before = current.current;
    if (
      before.flipped.length === 2 ||
      before.flipped.includes(index) ||
      before.solved.includes(index)
    )
      return;
    const flipped = [...before.flipped, index];
    const match =
      flipped.length === 2 && before.cards[flipped[0]] === before.cards[index];
    const next = {
      ...before,
      flipped,
      solved: match ? [...before.solved, ...flipped] : before.solved,
    };
    current.current = next;
    setGame(next);
    SoundPlayer.playSoundFile(match ? 'done' : 'flip', 'mp3');
  }
  function reset() {
    const next = newGame(game.round + 1);
    current.current = next;
    setGame(next);
  }
  return (
    <ActivityScreen
      navigation={navigation}
      title="Flip the Cards"
      subtitle={`${game.solved.length / 2} of 6 pairs found`}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View
          style={[styles.board, { width: columns * size + (columns - 1) * 8 }]}
        >
          {game.cards.map((symbol, index) => {
            const revealed =
              game.flipped.includes(index) || game.solved.includes(index);
            return (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityLabel={
                  revealed
                    ? `Card ${index + 1}: ${symbol}`
                    : `Flip card ${index + 1}`
                }
                onPress={() => flip(index)}
                style={[
                  styles.card,
                  { width: size, height: size },
                  revealed && styles.revealed,
                ]}
              >
                <Text
                  style={[
                    styles.symbol,
                    { fontSize: Math.min(50, size * 0.55) },
                  ]}
                >
                  {revealed ? symbol : '?'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.reset}>
        <ActionButton label="New game" onPress={reset} />
      </View>
      {complete && (
        <ActivityResult
          navigation={navigation}
          message="You found all six pairs!"
          onReplay={reset}
        />
      )}
    </ActivityScreen>
  );
}
const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  board: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    backgroundColor: '#8C70BA',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealed: { backgroundColor: '#68BDAC' },
  symbol: { color: '#FFFFFF', fontWeight: '900' },
  reset: { paddingTop: 8, alignItems: 'center' },
});
