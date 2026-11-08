import React, { useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import {
  ActivityScreen,
  ActionButton,
  LearningCard,
  ResponsiveGrid,
} from '../components/ActivityLayout';
const data = ['A', 'P', 'Q', 'L', 'E'].map(letter => ({ id: letter }));
export default function FruitName({ navigation }) {
  const [selected, setSelected] = useState(null);
  const [matched, setMatched] = useState([]);
  return (
    <ActivityScreen
      navigation={navigation}
      title="Letter Matching"
      subtitle="Choose a letter, then tap its match"
    >
      <View style={styles.choices}>
        {data.map(item => (
          <ActionButton
            key={item.id}
            label={item.id}
            selected={selected === item.id}
            onPress={() => setSelected(item.id)}
          />
        ))}
      </View>
      <Text style={styles.hint}>Selected letter: {selected || '—'}</Text>
      <ResponsiveGrid
        data={data}
        minWidth={65}
        maxColumns={5}
        itemHeight={90}
        renderItem={({ item, width, height }) => (
          <LearningCard
            width={width}
            height={height}
            text={item.id}
            selected={matched.includes(item.id)}
            label={`Match ${item.id}`}
            onPress={() => {
              if (item.id === selected)
                setMatched(previous => [...new Set([...previous, item.id])]);
            }}
          />
        )}
      />
    </ActivityScreen>
  );
}
const styles = StyleSheet.create({
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  hint: { padding: 12, textAlign: 'center', color: '#31516B' },
});
