import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const TIGER = require('../assets/tiger.png');

// Mirrors the matching game itself: drag an animal onto its shadow.
export default function MatchingIcon({ size = 80 }) {
  const tile = size * 0.62;
  const tileStyle = {
    width: tile,
    height: tile,
    borderRadius: tile * 0.24,
    padding: tile * 0.08,
  };
  return (
    <View
      pointerEvents="none"
      style={[styles.row, { width: size * 1.4, height: size }]}
    >
      <View
        style={[styles.tile, styles.animalTile, tileStyle, styles.tiltLeft]}
      >
        <Image source={TIGER} resizeMode="contain" style={styles.image} />
      </View>
      <View style={[styles.tile, styles.shadowTile, tileStyle]}>
        <Image
          source={TIGER}
          resizeMode="contain"
          style={[styles.image, styles.silhouette]}
        />
      </View>
      <View
        style={[
          styles.arrow,
          {
            width: size * 0.34,
            height: size * 0.34,
            borderRadius: size * 0.17,
            top: size * 0.06,
            left: (size * 1.4 - size * 0.34) / 2,
          },
        ]}
      >
        <Text style={[styles.arrowText, { fontSize: size * 0.22 }]}>
          {'➜'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tile: { alignItems: 'center', justifyContent: 'center' },
  animalTile: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FFD36A',
  },
  tiltLeft: { transform: [{ rotate: '-8deg' }] },
  shadowTile: {
    backgroundColor: '#FFFFFF55',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
  },
  image: { width: '100%', height: '100%' },
  silhouette: { tintColor: '#1F4E5A' },
  arrow: {
    position: 'absolute',
    backgroundColor: '#FFC34E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: '#FFFFFF',
    fontWeight: '900',
    includeFontPadding: false,
  },
});
