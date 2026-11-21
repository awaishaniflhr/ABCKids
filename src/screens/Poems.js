import ScreenContainer from '../components/ScreenContainer';
import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import BackButton from '../components/BackButton';
import SingAlongBackdrop, { Sun } from '../components/SingAlongBackdrop';
import PoemPlayer from '../components/PoemPlayer';
import PictureCard, { pictureCardHeight } from '../components/PictureCard';
import { lyricsFor } from '../games/poemLyrics';

const CARD_COLORS = [
  '#FF7FA8',
  '#FFB020',
  '#4CC9B0',
  '#7E8CF5',
  '#FF8A65',
  '#9775FA',
];
const GAP = 14;

// `cover` is a full picture for the song's card; songs without one show their
// small `img` art on a soft coloured background instead.
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
    cover: require('../assets/poem_twinkle.jpg'),
    audio: require('../../assets/audio/twinkle_poem.mp3'),
  },
  {
    id: 3,
    title: 'Baa Baa Black Sheep',
    img: require('../assets/blackSheep.png'),
    cover: require('../assets/poem_baabaa.jpg'),
    audio: require('../../assets/audio/baba_blacksheep.mp3'),
  },
  {
    id: 4,
    title: 'Once I Caught A Fish Alive',
    img: require('../assets/fish.png'),
    cover: require('../assets/poem_fish.jpg'),
    audio: require('../../assets/audio/once_caught_fish.mp3'),
  },
  {
    id: 5,
    title: 'Wheels on the Bus',
    img: require('../assets/bus.png'),
    cover: require('../assets/poem_bus.jpg'),
    audio: require('../../assets/audio/wheels_on_bus.mp3'),
  },
  {
    id: 6,
    title: 'Down at the Station',
    img: require('../assets/rain.png'),
    cover: require('../assets/poem_train.jpg'),
    audio: require('../../assets/audio/down_at_station.mp3'),
  },
  {
    id: 7,
    title: 'Nick Nack Paddy',
    img: require('../assets/clap.png'),
    cover: require('../assets/poem_oldman.jpg'),
    audio: require('../../assets/audio/nick_nack_paddy.mp3'),
  },
  {
    id: 8,
    title: 'The Big Ship Sails',
    img: require('../assets/johny.png'),
    cover: require('../assets/poem_ship.jpg'),
    audio: require('../../assets/audio/big_ship_sails.mp3'),
  },
];
export const songs = SONGS.map(song => ({
  ...song,
  lyrics: lyricsFor(song.id),
}));

export const songColor = index => CARD_COLORS[index % CARD_COLORS.length];

function SongCard({ song, color, width, height, lastPlayed, onPress }) {
  return (
    <PictureCard
      title={song.title}
      cover={song.cover}
      color={color}
      width={width}
      height={height}
      highlighted={lastPlayed}
      accessibilityLabel={`Sing ${song.title}`}
      onPress={onPress}
    >
      <Image
        source={song.img}
        style={{ width: (width - 16) * 0.78, height: (width - 16) * 0.55 }}
        resizeMode="contain"
      />
    </PictureCard>
  );
}

function Header({ navigation }) {
  return (
    <View style={styles.header}>
      <BackButton navigation={navigation} style={styles.back} />
      <View style={styles.headingWrap}>
        <Text style={[styles.note, styles.noteLeft]}>{'♪'}</Text>
        <View style={styles.heading}>
          <Text style={styles.headingText}>Sing Along</Text>
          <Text style={styles.headingSub}>Pick a song!</Text>
          <View pointerEvents="none" style={styles.headerSun}>
            <Sun size={46} animate />
          </View>
        </View>
        <Text style={[styles.note, styles.noteRight]}>{'♫'}</Text>
        <Text style={[styles.note, styles.noteLow]}>{'♪'}</Text>
      </View>
    </View>
  );
}

export default function Poems({ navigation }) {
  // The index of the song open in the player, or null when it is closed.
  const [open, setOpen] = useState(null);
  // The last song opened gets a yellow glow so it is easy to find again.
  const [lastPlayed, setLastPlayed] = useState(null);
  const [width, setWidth] = useState(0);
  const columns = width >= 900 ? 4 : width >= 560 ? 3 : 2;
  const cardWidth = width ? (width - GAP * (columns - 1)) / columns : 0;
  const cardHeight = pictureCardHeight(cardWidth);
  const choose = index => {
    setOpen(index);
    setLastPlayed(index);
  };
  return (
    <ScreenContainer style={styles.background}>
      <SingAlongBackdrop sun={false} />
      <Header navigation={navigation} />
      <View
        style={styles.grid}
        onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
      >
        {cardWidth > 0 && (
          <FlatList
            key={columns}
            data={songs}
            numColumns={columns}
            keyExtractor={item => String(item.id)}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <SongCard
                song={item}
                color={songColor(index)}
                width={cardWidth}
                height={cardHeight}
                lastPlayed={lastPlayed === index}
                onPress={() => choose(index)}
              />
            )}
          />
        )}
      </View>
      <PoemPlayer
        songs={songs}
        index={open ?? 0}
        visible={open !== null}
        color={songColor(open ?? 0)}
        onClose={() => setOpen(null)}
        onChangeIndex={choose}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  back: {
    padding: 8,
    backgroundColor: '#FFFFFFEE',
    borderRadius: 18,
    elevation: 3,
  },
  headingWrap: { flex: 1, alignItems: 'center', paddingRight: 40 },
  heading: {
    alignItems: 'center',
    paddingHorizontal: 26,
    paddingVertical: 6,
    borderRadius: 22,
    backgroundColor: '#FFFFFFF2',
    elevation: 3,
  },
  headingText: {
    color: '#3D3A8C',
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 26,
    includeFontPadding: false,
  },
  headingSub: {
    color: '#6B6FA8',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    includeFontPadding: false,
  },
  headerSun: { position: 'absolute', top: -20, right: -26 },
  note: { position: 'absolute', fontSize: 22, fontWeight: '900' },
  noteLeft: { left: 0, top: -6, color: '#FF7FA8' },
  noteRight: { right: 0, top: -8, color: '#FFB020' },
  noteLow: { right: 18, bottom: -10, color: '#4CC9B0', fontSize: 18 },
  grid: { flex: 1, marginTop: 16 },
  list: { paddingBottom: 40 },
  row: { gap: GAP, marginBottom: GAP },
});
