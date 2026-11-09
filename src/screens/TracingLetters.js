import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Text, View, StyleSheet } from 'react-native';
import {
  ActivityScreen,
  LearningCard,
  ResponsiveGrid,
} from '../components/ActivityLayout';
import { TRACING_LETTERS } from '../games/tracingLetters';
import { readTracingStars } from '../games/tracingProgress';

export default function TracingLetters({ navigation }) {
  const [stars, setStars] = useState([]);
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
  return (
    <ActivityScreen
      navigation={navigation}
      title="Letter Tracing"
      subtitle="Choose a letter. Follow the dots and earn a star!"
    >
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {stars.length} / 26 letter stars collected
        </Text>
        <Text style={styles.star}>{'\u2605'}</Text>
      </View>
      <ResponsiveGrid
        data={TRACING_LETTERS.map(item => ({ ...item, id: item.letter }))}
        minWidth={100}
        itemHeight={132}
        renderItem={({ item, width, height }) => (
          <LearningCard
            width={width}
            height={height}
            text={item.letter}
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
