import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import {
  ActivityScreen,
  LearningCard,
  ResponsiveGrid,
  useActivityLayout,
} from '../components/ActivityLayout';
import { COUNTING } from '../games/learningData';
import useSpeech from '../games/useSpeech';
export default function NumberKeyboard({ navigation }) {
  const [selected, setSelected] = useState(null);
  const { wide } = useActivityLayout();
  const speak = useSpeech();
  return (
    <ActivityScreen
      navigation={navigation}
      title="Tap Numbers"
      subtitle="Choose a number and count along"
    >
      <View style={[styles.scene, wide && styles.wide]}>
        <View style={styles.preview}>
          <Text style={styles.name}>
            {selected ? selected.numbers : 'Choose a number'}
          </Text>
          {selected && (
            <View style={styles.artRow}>
              <Image
                source={selected.imgf}
                resizeMode="contain"
                style={styles.art}
              />
              <Image
                source={selected.img}
                resizeMode="contain"
                style={styles.art}
              />
            </View>
          )}
        </View>
        <ResponsiveGrid
          data={COUNTING.map(item => ({ ...item, id: item.count }))}
          minWidth={60}
          maxColumns={5}
          itemHeight={84}
          renderItem={({ item, width, height }) => (
            <LearningCard
              width={width}
              height={height}
              image={item.buttonImg}
              selected={selected?.count === item.count}
              label={`Count ${item.count}`}
              onPress={() => {
                setSelected(item);
                speak(item.numbers);
              }}
            />
          )}
        />
      </View>
    </ActivityScreen>
  );
}
const styles = StyleSheet.create({
  scene: { flex: 1, gap: 12 },
  wide: { flexDirection: 'row' },
  preview: {
    flex: 1,
    minHeight: 100,
    backgroundColor: '#FFFEFA',
    borderWidth: 4,
    borderColor: '#F4CD78',
    borderRadius: 26,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 27,
    color: '#31516B',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  artRow: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    maxHeight: 280,
  },
  art: { flex: 1, height: '100%' },
});
