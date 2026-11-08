import ScreenContainer from '../components/ScreenContainer';
import React, { useCallback, useRef, useState } from 'react';
import {
  AppState,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Sound from 'react-native-sound';
import BackButton from '../components/BackButton';
const songs = [
  {
    id: 1,
    title: 'ABC Song',
    img: require('../assets/abc_song.png'),
    play: require('../assets/play.png'),
    audio: require('../../assets/audio/abcsong.mp3'),
  },
  {
    id: 2,
    title: 'Twinkle Twikle Little Star',
    img: require('../assets/twinkle.png'),
    play: require('../assets/play.png'),
    audio: require('../../assets/audio/twinkle_poem.mp3'),
  },
  {
    id: 3,
    title: 'Baa Baa Black Sheep',
    img: require('../assets/blackSheep.png'),
    play: require('../assets/play.png'),
    audio: require('../../assets/audio/baba_blacksheep.mp3'),
  },
  {
    id: 4,
    title: 'Once I Caught A Fish Alive',
    img: require('../assets/fish.png'),
    play: require('../assets/play.png'),
    audio: require('../../assets/audio/once_caught_fish.mp3'),
  },
  {
    id: 5,
    title: 'Wheels on the Bus',
    img: require('../assets/bus.png'),
    play: require('../assets/play.png'),
    audio: require('../../assets/audio/wheels_on_bus.mp3'),
  },
  {
    id: 6,
    title: 'Down At Station',
    img: require('../assets/rain.png'),
    play: require('../assets/play.png'),
    audio: require('../../assets/audio/down_at_station.mp3'),
  },
  {
    id: 7,
    title: 'Nick Nack Paddy',
    img: require('../assets/clap.png'),
    play: require('../assets/play.png'),
    audio: require('../../assets/audio/nick_nack_paddy.mp3'),
  },
  {
    id: 8,
    title: 'The Big Ship Sails',
    img: require('../assets/johny.png'),
    play: require('../assets/play.png'),
    audio: require('../../assets/audio/big_ship_sails.mp3'),
  },
];
export default function Poems({ navigation }) {
  const [playingId, setPlayingId] = useState(null);
  const [paused, setPaused] = useState(false);
  const soundRef = useRef(null);
  const generation = useRef(0);
  const stop = useCallback(() => {
    generation.current += 1;
    const sound = soundRef.current;
    soundRef.current = null;
    if (sound) {
      sound.stop();
      sound.release();
    }
    setPlayingId(null);
    setPaused(false);
  }, []);
  useFocusEffect(
    useCallback(() => {
      const listener = AppState.addEventListener('change', state => {
        if (state !== 'active') {
          stop();
        }
      });
      return () => {
        listener.remove();
        stop();
      };
    }, [stop]),
  );
  function play(item) {
    stop();
    const token = generation.current;
    setPlayingId(item.id);
    // react-native-sound now expects a URI rather than a Metro numeric asset ID.
    const uri = Image.resolveAssetSource(item.audio).uri;
    const sound = new Sound(uri, '', error => {
      if (generation.current !== token) {
        sound.release();
        return;
      }
      if (error) {
        console.warn('Unable to play song', error);
        stop();
        return;
      }
      sound.play(() => {
        if (generation.current === token) {
          stop();
        }
      });
    });
    soundRef.current = sound;
  }
  function toggle(item) {
    if (playingId !== item.id) {
      play(item);
      return;
    }
    const sound = soundRef.current;
    if (!sound || !sound.isLoaded()) {
      return;
    }
    if (paused) {
      const token = generation.current;
      sound.play(() => {
        if (generation.current === token) {
          stop();
        }
      });
    } else {
      sound.pause();
    }
    setPaused(value => !value);
  }
  return (
    <ScreenContainer
      source={require('../assets/frame.jpg')}
      style={styles.background}
    >
      <BackButton navigation={navigation} style={styles.back} />
      <FlatList
        data={songs}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Image source={item.img} style={styles.art} resizeMode="contain" />
            <Text style={styles.title}>{item.title}</Text>
            <TouchableOpacity
              accessibilityLabel={
                playingId === item.id && !paused ? 'Pause song' : 'Play song'
              }
              onPress={() => toggle(item)}
              style={styles.control}
            >
              <Image
                source={
                  playingId === item.id && !paused
                    ? require('../assets/pause.png')
                    : require('../assets/play.png')
                }
                style={styles.icon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {playingId === item.id && (
              <TouchableOpacity
                accessibilityLabel="Stop song"
                onPress={stop}
                style={styles.control}
              >
                <Image
                  source={require('../assets/stop_Music.png')}
                  style={styles.icon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  background: {
    flex: 1,
    padding: 16,
  },
  back: {
    alignSelf: 'flex-start',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  list: {
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3df',
    borderRadius: 12,
    marginBottom: 10,
    minHeight: 72,
    padding: 8,
  },
  art: {
    width: 44,
    height: 44,
  },
  title: {
    flex: 1,
    color: '#292929',
    marginHorizontal: 10,
    fontSize: 15,
  },
  control: {
    padding: 10,
  },
  icon: {
    width: 28,
    height: 28,
  },
});
