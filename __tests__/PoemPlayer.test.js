import React from 'react';
import { Image, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  activeLine,
  activeWord,
  formatTime,
  lyricsFor,
  POEM_LYRICS,
} from '../src/games/poemLyrics';
import { POEM_TIMINGS } from '../src/games/poemTimings';
import Poems, { songs } from '../src/screens/Poems';
import { TICK_MS } from '../src/components/PoemPlayer';

// A fake react-native-sound whose playback position the test controls.
const sounds = [];
jest.mock('react-native-sound', () => {
  function FakeSound(uri, _base, onLoad) {
    this.uri = uri;
    this.position = 0;
    this.playing = false;
    this.released = false;
    this.getDuration = () => 60;
    this.getCurrentTime = callback => callback(this.position);
    this.play = done => {
      this.playing = true;
      this.finish = () => {
        this.playing = false;
        done(true);
      };
    };
    this.pause = () => {
      this.playing = false;
    };
    this.stop = () => {
      this.playing = false;
    };
    this.release = () => {
      this.released = true;
    };
    sounds.push(this);
    setTimeout(() => onLoad(null), 0);
  }
  return FakeSound;
});
jest.mock('@react-navigation/native', () => ({ useFocusEffect: jest.fn() }));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

describe('lyric timing', () => {
  const lines = [
    { at: 2, text: 'one two three four' },
    { at: 6, text: 'five six' },
  ];

  it('finds the line being sung', () => {
    expect(activeLine(lines, 0)).toBe(-1);
    expect(activeLine(lines, 2)).toBe(0);
    expect(activeLine(lines, 5.9)).toBe(0);
    expect(activeLine(lines, 30)).toBe(1);
  });

  it('walks the highlight across the words of a line', () => {
    expect(activeWord(lines, 0, 2)).toBe(0);
    expect(activeWord(lines, 0, 3.8)).toBe(2);
    expect(activeWord(lines, 0, 5.9)).toBe(3);
    expect(activeWord(lines, -1, 1)).toBe(-1);
  });

  it('follows exact word times when the song has them', () => {
    const timed = [{ at: 2, text: 'never never do', words: [2, 2.3, 2.9] }];
    expect(activeWord(timed, 0, 2.1)).toBe(0);
    expect(activeWord(timed, 0, 2.4)).toBe(1);
    expect(activeWord(timed, 0, 3.5)).toBe(2);
  });

  it('keeps generated word timings in step with the lyrics', () => {
    Object.entries(POEM_TIMINGS).forEach(([id, lines]) => {
      expect(lines).toHaveLength(POEM_LYRICS[id].length);
      lines.forEach((times, index) => {
        expect(times).toHaveLength(
          POEM_LYRICS[id][index].text.split(' ').length,
        );
      });
      const merged = lyricsFor(id).flatMap(line => line.words);
      merged.forEach((time, index) => {
        if (index) expect(time).toBeGreaterThan(merged[index - 1]);
      });
    });
  });

  it('formats times as m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65.4)).toBe('1:05');
  });

  it('has timed lyrics, in order, for every song', () => {
    songs.forEach(song => {
      const lyrics = POEM_LYRICS[song.id];
      expect(lyrics?.length).toBeGreaterThan(3);
      lyrics.forEach((line, index) => {
        expect(line.text.trim()).not.toBe('');
        if (index) expect(line.at).toBeGreaterThan(lyrics[index - 1].at);
      });
    });
  });
});

describe('poem player', () => {
  let screen;
  beforeEach(() => {
    jest.useFakeTimers();
    sounds.length = 0;
    jest
      .spyOn(Image, 'resolveAssetSource')
      .mockImplementation(source => ({ uri: `asset:/${source}` }));
  });
  afterEach(() => {
    if (screen) ReactTestRenderer.act(() => screen.unmount());
    screen = undefined;
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  const press = label =>
    ReactTestRenderer.act(() =>
      screen.root
        .findAll(
          node =>
            node.props.accessibilityLabel === label &&
            typeof node.props.onPress === 'function',
        )[0]
        .props.onPress(),
    );
  const texts = () =>
    screen.root
      .findAllByType(Text)
      .map(node => [].concat(node.props.children).join(''));
  const advance = ms =>
    ReactTestRenderer.act(() => jest.advanceTimersByTime(ms));

  function open(title) {
    ReactTestRenderer.act(() => {
      screen = ReactTestRenderer.create(
        <SafeAreaProvider>
          <Poems navigation={{ goBack: jest.fn() }} />
        </SafeAreaProvider>,
      );
    });
    // The card grid sizes itself from its measured width.
    ReactTestRenderer.act(() =>
      screen.root
        .findAll(node => typeof node.props.onLayout === 'function')
        .forEach(node =>
          node.props.onLayout({
            nativeEvent: { layout: { width: 400, height: 800 } },
          }),
        ),
    );
    press(`Sing ${title}`);
    advance(0); // the song loads
  }

  it('opens one shared player that plays the tapped poem', () => {
    open(songs[1].title);
    expect(texts()).toContain(songs[1].title);
    expect(texts()).toContain('Song 2 of 8');
    expect(sounds).toHaveLength(1);
    expect(sounds[0].playing).toBe(true);
  });

  it('highlights the line being sung', () => {
    open(songs[0].title);
    const first = songs[0].lyrics[0];
    sounds[0].position = first.at + 0.1;
    advance(TICK_MS);
    const current = screen.root.find(
      node =>
        node.props.accessibilityLiveRegion === 'polite' &&
        node.props.accessibilityLabel === first.text,
    );
    expect(current).toBeTruthy();
  });

  it('pauses, plays, and moves to the next and previous poem', () => {
    open(songs[0].title);
    press('Pause');
    expect(sounds[0].playing).toBe(false);
    press('Play');
    expect(sounds[0].playing).toBe(true);

    press('Next poem');
    advance(0);
    expect(sounds[0].released).toBe(true);
    expect(texts()).toContain(songs[1].title);
    expect(sounds[1].playing).toBe(true);

    press('Previous poem');
    advance(0);
    expect(texts()).toContain(songs[0].title);
  });

  it('goes on to the next poem when a song ends', () => {
    open(songs[2].title);
    ReactTestRenderer.act(() => sounds[0].finish());
    advance(0);
    expect(texts()).toContain(songs[3].title);
  });

  it('stops the music when the player is closed', () => {
    open(songs[0].title);
    press('Close player');
    expect(sounds[0].released).toBe(true);
    expect(texts()).not.toContain('Song 1 of 8');
  });
});
