import React, { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ActivityScreen,
  ActivityResult,
  useActivityLayout,
} from '../components/ActivityLayout';
import DragTile from '../components/DragTile';
import { MATCHING_ANIMALS } from '../games/learningData';
import { isDropInside } from '../games/responsiveLayout';
import SoundPlayer from '../utills/SoundPlayer';
const names = ['Tiger', 'Cat', 'Zebra', 'Wolf', 'Lion'];
const targets = [2, 1, 5, 4, 3];
export default function AlphabetsShapes({ navigation }) {
  const { width, height, wide, contentWidth, contentHeight } =
    useActivityLayout();
  const [matched, setMatched] = useState([]);
  const [selected, setSelected] = useState(null);
  const matchedRef = useRef([]);
  const refs = useRef({});
  const version = useRef('');
  version.current = `${width}-${height}`;
  const size = Math.max(
    44,
    Math.min(106, wide ? (contentWidth - 48) / 5 : (contentHeight - 40) / 5),
  );
  function match(id) {
    if (matchedRef.current.includes(id)) return;
    const next = [...matchedRef.current, id];
    matchedRef.current = next;
    setMatched(next);
    setSelected(null);
    SoundPlayer.playSoundFile(next.length === 5 ? 'modalsound' : 'done', 'mp3');
  }
  async function drop(id, point) {
    const before = version.current;
    if (
      (await isDropInside(refs.current[id], point)) &&
      before === version.current
    )
      match(id);
  }
  const source = (
    <View style={[styles.column, styles.sources, wide && styles.horizontal]}>
      {MATCHING_ANIMALS.map((animal, index) => (
        <View key={animal.id} style={{ width: size, height: size }}>
          {!matched.includes(animal.id) && (
            <DragTile
              key={`${animal.id}-${version.current}`}
              label={`Drag ${names[index]}`}
              onTap={() => setSelected(animal.id)}
              onDrop={point => drop(animal.id, point)}
              style={[styles.tile, selected === animal.id && styles.selected]}
            >
              <Image
                source={animal.source}
                resizeMode="contain"
                style={styles.animal}
              />
            </DragTile>
          )}
        </View>
      ))}
    </View>
  );
  const destinations = (
    <View style={[styles.column, wide && styles.horizontal]}>
      {targets.map(id => {
        const animal = MATCHING_ANIMALS.find(item => item.id === id);
        const done = matched.includes(id);
        return (
          <Pressable
            key={id}
            ref={node => {
              refs.current[id] = node;
            }}
            collapsable={false}
            accessibilityRole="button"
            accessibilityLabel={`Match ${names[id - 1]}`}
            onPress={() => {
              if (selected === id) match(id);
            }}
            style={[
              styles.target,
              done && styles.done,
              { width: size, height: size },
            ]}
          >
            <Image
              source={animal.source}
              resizeMode="contain"
              style={[styles.animal, !done && styles.silhouette]}
            />
          </Pressable>
        );
      })}
    </View>
  );
  return (
    <ActivityScreen
      navigation={navigation}
      title="Match the Animals"
      subtitle="Drag each animal to its outline, or tap an animal and its match"
    >
      <View style={[styles.board, wide && styles.wideBoard]}>
        {source}
        <Text style={styles.arrow}>{wide ? '↓' : '→'}</Text>
        {destinations}
      </View>
      {matched.length === 5 && (
        <ActivityResult
          navigation={navigation}
          message="You matched every animal!"
          onReplay={() => {
            matchedRef.current = [];
            setMatched([]);
            setSelected(null);
          }}
        />
      )}
    </ActivityScreen>
  );
}
const styles = StyleSheet.create({
  board: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    gap: 8,
  },
  wideBoard: { flexDirection: 'column' },
  column: { gap: 8, zIndex: 2 },
  sources: { zIndex: 3 },
  horizontal: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderColor: '#FFD56C',
    borderWidth: 3,
    padding: 5,
  },
  selected: { backgroundColor: '#FFE6A1' },
  animal: { width: '90%', height: '90%' },
  target: {
    backgroundColor: '#FFFFFFDD',
    borderColor: '#ABC5CC',
    borderWidth: 3,
    borderRadius: 18,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  silhouette: { tintColor: '#A6B8C0' },
  done: { borderColor: '#38AF8D', borderStyle: 'solid' },
  arrow: { fontSize: 28, color: '#31516B' },
});
