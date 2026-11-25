import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Text, View, StyleSheet } from 'react-native';
import {
  ActivityScreen,
  LearningCard,
  ResponsiveGrid,
} from '../components/ActivityLayout';
import { TRACING_LETTERS } from '../games/tracingLetters';
import { nextUnfinished, readTracingStars } from '../games/tracingProgress';
import ContinueButton, { CONTINUE_SPACE } from '../components/ContinueButton';
import FunnyLetter from '../components/FunnyLetter';
import { GLASS_PINK } from '../components/glass';
import { useScreenMusic } from '../services/audio';

export default function TracingLetters({ navigation }) {
  const [stars, setStars] = useState([]);
  useScreenMusic('tracing');
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      readTracingStars()
        .then(value => {
          if (mounted) setStars(value);
        })
        .catch(() => {});
      return () => {
        mounted = false;
      };
    }, []),
  );
  // The first letter not traced yet (after A, B and C are done: D).
  const next = nextUnfinished(
    TRACING_LETTERS.map(item => item.letter),
    stars,
  );
  return (
    <ActivityScreen
      navigation={navigation}
      title="Letter Tracing"
      glassHeader
      headerRight={
        <View
          accessible
          accessibilityLabel={`${stars.length} of 26 letter stars collected`}
          style={styles.count}
        >
          <Text style={styles.countText}>
            {stars.length}/{TRACING_LETTERS.length}
          </Text>
        </View>
      }
    >
      <ResponsiveGrid
        data={TRACING_LETTERS.map(item => ({ ...item, id: item.letter }))}
        bottomSpace={next ? CONTINUE_SPACE : 0}
        minWidth={100}
        itemHeight={132}
        renderItem={({ item, width, height }) => (
          <LearningCard
            width={width}
            height={height}
            art={<FunnyLetter letter={item.letter} />}
            label={`Trace letter ${item.letter}`}
            caption={
              stars.includes(item.letter)
                ? '\u2605 Traced!'
                : `${item.strokes.length} ${
                    item.strokes.length === 1 ? 'stroke' : 'strokes'
                  }`
            }
            color={stars.includes(item.letter) ? '#38A68D' : '#8B78D9'}
            onPress={() =>
              navigation.navigate('LetterTracing', { letter: item.letter })
            }
          />
        )}
      />
      {next ? (
        <ContinueButton
          label={next}
          onPress={() => navigation.navigate('LetterTracing', { letter: next })}
        />
      ) : null}
    </ActivityScreen>
  );
}
const styles = StyleSheet.create({
  // Stars collected, top right of the header, on the same glass as the title.
  count: {
    backgroundColor: GLASS_PINK,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  countText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#284B67',
    includeFontPadding: false,
  },
});
