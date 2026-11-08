import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ActivityScreen,
  ActivityResult,
  useActivityLayout,
} from '../components/ActivityLayout';
import DragTile from '../components/DragTile';
import { isDropInside } from '../games/responsiveLayout';
import useSpeech from '../games/useSpeech';
import SoundPlayer from '../utills/SoundPlayer';

export default function DragLetters({ navigation, route }) {
  const {
    Letter = 'A',
    Pic = require('../assets/apple.png'),
    ImageName = 'Apple',
    pronounce = 'A for Apple',
  } = route?.params || {};
  const { width, height, wide, contentWidth, contentHeight } =
    useActivityLayout();
  const [matched, setMatched] = useState(false);
  const [selected, setSelected] = useState(false);
  const [finished, setFinished] = useState(false);
  const target = useRef(null);
  const layoutVersion = useRef('');
  layoutVersion.current = `${width}-${height}`;
  const speak = useSpeech();
  const size = Math.max(
    64,
    Math.min(
      150,
      (contentWidth - 54) / (wide ? 4 : 2),
      contentHeight / (wide ? 2 : 3),
    ),
  );
  useEffect(() => {
    if (!matched) return;
    const timer = setTimeout(() => {
      setFinished(true);
      SoundPlayer.playSoundFile('modalsound', 'mp3');
    }, 900);
    return () => clearTimeout(timer);
  }, [matched]);
  function match() {
    setMatched(true);
    setSelected(false);
    speak(pronounce);
    SoundPlayer.playSoundFile('done', 'mp3');
  }
  async function drop(point) {
    const version = layoutVersion.current;
    if (
      (await isDropInside(target.current, point)) &&
      version === layoutVersion.current
    )
      match();
  }
  return (
    <ActivityScreen
      navigation={navigation}
      title="Drag Letters"
      subtitle="Drag to the matching outline, or tap the letter then its outline"
    >
      <View style={[styles.scene, wide && styles.wide]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Say ${ImageName}`}
          onPress={() => speak(ImageName)}
          style={styles.picture}
        >
          <Image source={Pic} resizeMode="contain" style={styles.art} />
          <Text style={styles.name}>{ImageName}</Text>
        </Pressable>
        <View style={styles.puzzle}>
          <View style={{ width: size + 20, height: size + 30 }}>
            {!matched && (
              <DragTile
                key={layoutVersion.current}
                label={`Drag ${Letter}`}
                onDrop={drop}
                onTap={() => setSelected(true)}
                style={[styles.tile, selected && styles.selected]}
              >
                <Text style={[styles.letter, { fontSize: size }]}>
                  {Letter}
                </Text>
              </DragTile>
            )}
          </View>
          <Pressable
            ref={target}
            collapsable={false}
            accessibilityRole="button"
            accessibilityLabel={`Match ${Letter}`}
            onPress={() => {
              if (selected && !matched) match();
            }}
            style={[styles.target, { width: size + 20, height: size + 30 }]}
          >
            <Text
              style={[
                styles.letter,
                { fontSize: size },
                !matched && styles.outline,
              ]}
            >
              {Letter}
            </Text>
          </Pressable>
        </View>
      </View>
      {finished && (
        <ActivityResult
          navigation={navigation}
          message={pronounce}
          onReplay={() => {
            setFinished(false);
            setMatched(false);
            setSelected(false);
          }}
        />
      )}
    </ActivityScreen>
  );
}
const styles = StyleSheet.create({
  scene: { flex: 1, gap: 12 },
  wide: { flexDirection: 'row' },
  picture: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  art: { flex: 1, width: '75%', maxHeight: 250 },
  name: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 25,
    color: '#31516B',
    textAlign: 'center',
  },
  puzzle: {
    flex: 1.5,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tile: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#F5AC5D',
  },
  selected: { backgroundColor: '#FFE6A1' },
  target: {
    borderRadius: 20,
    backgroundColor: '#FFFFFFCC',
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#9FBFC8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { fontWeight: '900', color: '#E95F61', includeFontPadding: false },
  outline: { color: '#C6D9DE' },
});
