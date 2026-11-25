import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Text, View, StyleSheet } from 'react-native';
import {
  ActivityScreen,
  LearningCard,
  ResponsiveGrid,
} from '../components/ActivityLayout';
import { TRACING_NUMBERS } from '../games/tracingNumbers';
import {
  nextUnfinished,
  readNumberTracingStars,
} from '../games/tracingProgress';
import ContinueButton, { CONTINUE_SPACE } from '../components/ContinueButton';
import { numberWord } from '../games/numberWords';
import { useScreenMusic } from '../services/audio';

export default function TracingNumbers({ navigation }) {
  const [stars, setStars] = useState([]);
  useScreenMusic('tracing');
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      readNumberTracingStars()
        .then(value => {
          if (mounted) setStars(value);
        })
        .catch(() => {});
      return () => {
        mounted = false;
      };
    }, []),
  );
  // The first number not traced yet.
  const next = nextUnfinished(
    TRACING_NUMBERS.map(item => item.letter),
    stars,
  );
  return (
    <ActivityScreen
      navigation={navigation}
      title="Number Tracing"
      subtitle="Choose a number. Follow the dots and earn a star!"
    >
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {stars.length} / {TRACING_NUMBERS.length} number stars collected
        </Text>
        <Text style={styles.star}>{'★'}</Text>
      </View>
      <ResponsiveGrid
        data={TRACING_NUMBERS.map(item => ({ ...item, id: item.letter }))}
        bottomSpace={next ? CONTINUE_SPACE : 0}
        minWidth={100}
        itemHeight={132}
        renderItem={({ item, width, height }) => (
          <LearningCard
            width={width}
            height={height}
            image={numberWord(item.letter).image}
            label={`Trace number ${item.letter}`}
            caption={
              stars.includes(item.letter)
                ? '★ Traced!'
                : `${item.strokes.length} ${
                    item.strokes.length === 1 ? 'stroke' : 'strokes'
                  }`
            }
            color={stars.includes(item.letter) ? '#38A68D' : '#EF9C43'}
            onPress={() =>
              navigation.navigate('NumberTracing', { number: item.letter })
            }
          />
        )}
      />
      {next ? (
        <ContinueButton
          label={next}
          bottom={14}
          onPress={() => navigation.navigate('NumberTracing', { number: next })}
        />
      ) : null}
    </ActivityScreen>
  );
}
const styles = StyleSheet.create({
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  progressText: { color: '#46617E', fontSize: 13, fontWeight: '700' },
  star: { color: '#EBAE35', fontSize: 24 },
});
