import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ActionButton,
  ActivityScreen,
  ActivityResult,
  useActivityLayout,
} from '../components/ActivityLayout';
import SoundPlayer from '../utills/SoundPlayer';
const pictures = [
  require('../assets/star1.png'),
  require('../assets/star2.png'),
  require('../assets/star3.png'),
  require('../assets/star4.png'),
  require('../assets/star5.png'),
  require('../assets/star6.png'),
  require('../assets/star7.png'),
  require('../assets/star8.png'),
  require('../assets/star9.png'),
];
function question() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const sum = a + b;
  const options = [sum, sum + 1, Math.max(0, sum - 1)];
  for (let index = options.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [options[index], options[other]] = [options[other], options[index]];
  }
  return { a, b, options, answer: null };
}
export default function Numeric({ navigation }) {
  const [game, setGame] = useState(question);
  const [finished, setFinished] = useState(false);
  const { wide } = useActivityLayout();
  useEffect(() => {
    if (game.answer === null) return;
    const timer = setTimeout(() => {
      setFinished(true);
      SoundPlayer.playSoundFile('modalsound', 'mp3');
    }, 900);
    return () => clearTimeout(timer);
  }, [game.answer]);
  function answer(value) {
    if (game.answer !== null) return;
    if (value === game.a + game.b) {
      setGame(previous => ({ ...previous, answer: value }));
      SoundPlayer.playSoundFile('done', 'mp3');
    } else {
      setGame(previous => ({
        ...previous,
        options: previous.options.filter(item => item !== value),
      }));
      SoundPlayer.playSoundFile('wrong', 'mp3');
    }
  }
  return (
    <ActivityScreen
      navigation={navigation}
      title="Addition Adventure"
      subtitle="Count the stars and choose the answer"
    >
      <View style={[styles.scene, wide && styles.wide]}>
        <ScrollView
          style={styles.question}
          contentContainerStyle={styles.questionContent}
        >
          <Text style={styles.equation}>
            {game.a} + {game.b} = {game.answer ?? '?'}
          </Text>
          <View style={styles.counts}>
            <View style={styles.countBox}>
              <Image
                source={pictures[game.a - 1]}
                resizeMode="contain"
                style={styles.stars}
              />
              <Text style={styles.count}>{game.a}</Text>
            </View>
            <Text style={styles.plus}>+</Text>
            <View style={styles.countBox}>
              <Image
                source={pictures[game.b - 1]}
                resizeMode="contain"
                style={styles.stars}
              />
              <Text style={styles.count}>{game.b}</Text>
            </View>
          </View>
        </ScrollView>
        <View style={[styles.answers, wide && styles.wideAnswers]}>
          {game.options.map(option => (
            <ActionButton
              key={option}
              label={String(option)}
              onPress={() => answer(option)}
              disabled={game.answer !== null}
            />
          ))}
        </View>
      </View>
      {finished && (
        <ActivityResult
          navigation={navigation}
          title="Excellent!"
          message={`${game.a} + ${game.b} = ${game.answer}`}
          replayLabel="Next question"
          onReplay={() => {
            setFinished(false);
            setGame(question());
          }}
        />
      )}
    </ActivityScreen>
  );
}
const styles = StyleSheet.create({
  scene: { flex: 1, gap: 16 },
  wide: { flexDirection: 'row' },
  question: {
    flex: 1,
    backgroundColor: '#FFFFFFED',
    borderWidth: 4,
    borderColor: '#A9DED0',
    borderRadius: 24,
  },
  questionContent: { flexGrow: 1, justifyContent: 'center', padding: 12 },
  equation: {
    fontSize: 42,
    fontWeight: '900',
    color: '#287A69',
    textAlign: 'center',
    marginBottom: 12,
  },
  counts: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    gap: 4,
  },
  countBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFF5DB',
    borderRadius: 18,
    padding: 8,
  },
  stars: { width: '100%', height: 100 },
  count: { fontSize: 25, color: '#31516B', fontWeight: '800' },
  plus: { fontSize: 28, color: '#31516B' },
  answers: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    gap: 10,
    padding: 8,
  },
  wideAnswers: {
    flexDirection: 'column',
    width: 110,
    justifyContent: 'center',
  },
});
