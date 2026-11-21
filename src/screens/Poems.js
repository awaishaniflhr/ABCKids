import ScreenContainer from '../components/ScreenContainer';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BackButton from '../components/BackButton';
import SingAlongBackdrop from '../components/SingAlongBackdrop';
import PoemPlayer from '../components/PoemPlayer';
import { POEM_LYRICS } from '../games/poemLyrics';

const ROW_COLORS = [
  '#FF7FA8',
  '#FFB020',
  '#4CC9B0',
  '#7E8CF5',
  '#FF8A65',
  '#9775FA',
];
const SONGS = [
  {
    id: 1,
    title: 'ABC Song',
    img: require('../assets/abc_song.png'),
    audio: require('../../assets/audio/abcsong.mp3'),
  },
  {
    id: 2,
    title: 'Twinkle Twinkle Little Star',
    img: require('../assets/twinkle.png'),
    audio: require('../../assets/audio/twinkle_poem.mp3'),
  },
  {
    id: 3,
    title: 'Baa Baa Black Sheep',
    img: require('../assets/blackSheep.png'),
    audio: require('../../assets/audio/baba_blacksheep.mp3'),
  },
  {
    id: 4,
    title: 'Once I Caught A Fish Alive',
    img: require('../assets/fish.png'),
    audio: require('../../assets/audio/once_caught_fish.mp3'),
  },
  {
    id: 5,
    title: 'Wheels on the Bus',
    img: require('../assets/bus.png'),
    audio: require('../../assets/audio/wheels_on_bus.mp3'),
  },
  {
    id: 6,
    title: 'Down At Station',
    img: require('../assets/rain.png'),
    audio: require('../../assets/audio/down_at_station.mp3'),
  },
  {
    id: 7,
    title: 'Nick Nack Paddy',
    img: require('../assets/clap.png'),
    audio: require('../../assets/audio/nick_nack_paddy.mp3'),
  },
  {
    id: 8,
    title: 'The Big Ship Sails',
    img: require('../assets/johny.png'),
    audio: require('../../assets/audio/big_ship_sails.mp3'),
  },
];
export const songs = SONGS.map(song => ({
  ...song,
  lyrics: POEM_LYRICS[song.id] || [],
}));

export default function Poems({ navigation }) {
  // The index of the song open in the player, or null when it is closed.
  const [open, setOpen] = useState(null);
  return (
    <ScreenContainer style={styles.background}>
      <SingAlongBackdrop />
      <View style={styles.header}>
        <BackButton navigation={navigation} style={styles.back} />
        <View style={styles.heading}>
          <Text style={styles.headingText}>Sing Along</Text>
          <Text style={styles.headingSub}>Tap a song to sing along</Text>
        </View>
      </View>
      <FlatList
        data={songs}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const color = ROW_COLORS[index % ROW_COLORS.length];
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Sing ${item.title}`}
              onPress={() => setOpen(index)}
              style={({ pressed }) => [
                styles.row,
                { borderColor: color },
                pressed && styles.rowPressed,
              ]}
            >
              <View
                style={[styles.artBubble, { backgroundColor: `${color}33` }]}
              >
                <Image
                  source={item.img}
                  style={styles.art}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <View style={[styles.control, { backgroundColor: color }]}>
                <Text style={styles.symbol}>{'▶'}</Text>
              </View>
            </Pressable>
          );
        }}
      />
      <PoemPlayer
        songs={songs}
        index={open ?? 0}
        visible={open !== null}
        color={ROW_COLORS[(open ?? 0) % ROW_COLORS.length]}
        onClose={() => setOpen(null)}
        onChangeIndex={setOpen}
      />
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  background: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  back: {
    padding: 8,
    backgroundColor: '#FFFFFFE6',
    borderRadius: 16,
  },
  heading: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFFD9',
  },
  headingText: {
    color: '#3D3A8C',
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 24,
    includeFontPadding: false,
  },
  headingSub: {
    color: '#6B6FA8',
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    includeFontPadding: false,
  },
  list: {
    paddingTop: 14,
    paddingBottom: 120,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFFEB',
    borderRadius: 22,
    borderWidth: 3,
    marginBottom: 12,
    minHeight: 76,
    padding: 8,
    gap: 8,
  },
  rowPressed: {
    backgroundColor: '#FFF6C9',
    transform: [{ scale: 0.98 }],
  },
  artBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  art: {
    width: 42,
    height: 42,
  },
  title: {
    flex: 1,
    color: '#31416B',
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    includeFontPadding: false,
  },
  control: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    includeFontPadding: false,
  },
});
