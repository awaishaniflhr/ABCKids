import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ANIMALS,
  BIRDS,
  INSTRUMENTS,
  PHONE_ANIMALS,
  VEHICLES,
} from '../src/games/learningData';
import { SoundCards } from '../src/screens/Sounds';
import SoundPlayer from '../src/utills/SoundPlayer';
import SoundScreen from '../src/screens/SoundScreen';

jest.mock('../src/utills/SoundPlayer', () => ({
  stop: jest.fn(),
  playSoundFile: jest.fn(),
}));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

const RAW = path.join(__dirname, '../android/app/src/main/res/raw');

describe('animal sounds', () => {
  it('has 18 different animals, each with its own sound', () => {
    expect(ANIMALS).toHaveLength(18);
    expect(new Set(ANIMALS.map(item => item.name)).size).toBe(18);
    expect(new Set(ANIMALS.map(item => item.sound)).size).toBe(18);
    ANIMALS.forEach(item => {
      expect(item.Image).toBeTruthy();
      expect(item.says).toMatch(/!$/);
    });
  });

  it('has 16 named birds, each with its own call', () => {
    expect(BIRDS).toHaveLength(16);
    expect(new Set(BIRDS.map(item => item.name)).size).toBe(16);
    expect(new Set(BIRDS.map(item => item.sound)).size).toBe(16);
    BIRDS.forEach(item => {
      expect(item.Image).toBeTruthy();
      expect(item.says).toMatch(/!$/);
    });
  });

  it.each([
    ['vehicles', () => VEHICLES],
    ['instruments', () => INSTRUMENTS],
  ])('has 12 named %s, each with its own sound', (_, list) => {
    const items = list();
    expect(items).toHaveLength(12);
    expect(new Set(items.map(item => item.name)).size).toBe(12);
    expect(new Set(items.map(item => item.sound)).size).toBe(12);
    items.forEach(item => {
      expect(item.Image).toBeTruthy();
      expect(item.says).toMatch(/!$/);
    });
  });

  it('lists the new boards on the Sounds menu', () => {
    expect(SoundCards.map(card => card.screen)).toEqual([
      'SoundScreen',
      'BirdSound',
      'VehicleSound',
      'InstrumentSound',
    ]);
  });

  it('ships every sound the animal games play', () => {
    [
      ...ANIMALS,
      ...BIRDS,
      ...VEHICLES,
      ...INSTRUMENTS,
      ...PHONE_ANIMALS,
    ].forEach(item =>
      expect(fs.existsSync(path.join(RAW, `${item.sound}.mp3`))).toBe(true),
    );
  });

  it('matches each picture to the right animal sound', () => {
    const sound = name => ANIMALS.find(item => item.name === name).sound;
    expect(sound('Wolf')).toBe('wolfsound');
    expect(sound('Horse')).toBe('horsesound');
    expect(ANIMALS.some(item => ['Pig', 'Kangaroo'].includes(item.name))).toBe(
      false,
    );
    const phone = name => PHONE_ANIMALS.find(item => item.name === name).sound;
    expect(phone('Wolf')).toBe('wolfsound');
    expect(phone('Horse')).toBe('horsesound');
  });

  it('plays the sound and shows what the animal says when tapped', () => {
    jest.useFakeTimers();
    let screen;
    ReactTestRenderer.act(() => {
      screen = ReactTestRenderer.create(
        <SafeAreaProvider>
          <SoundScreen navigation={{ goBack: jest.fn() }} />
        </SafeAreaProvider>,
      );
    });
    ReactTestRenderer.act(() =>
      screen.root
        .findAll(node => node.props.onLayout)
        .forEach(node =>
          node.props.onLayout({
            nativeEvent: { layout: { width: 600, height: 800 } },
          }),
        ),
    );
    const cow = screen.root.find(
      node =>
        node.props.accessibilityLabel === 'Play cow sound' &&
        typeof node.props.onPress === 'function',
    );
    ReactTestRenderer.act(() => cow.props.onPress());
    // The cow keeps calling until another animal is tapped or the screen
    // closes.
    expect(SoundPlayer.playSoundFile).toHaveBeenLastCalledWith(
      'cowsound',
      'mp3',
      expect.objectContaining({ repeat: true }),
    );
    const texts = screen.root
      .findAll(node => typeof node.props.children === 'string')
      .map(node => node.props.children);
    expect(texts).toContain('Moo!');
    // Each repeat replays the hop without errors.
    const { onRepeat } = SoundPlayer.playSoundFile.mock.calls.at(-1)[2];
    ReactTestRenderer.act(() => onRepeat());
    SoundPlayer.stop.mockClear();
    ReactTestRenderer.act(() => screen.unmount());
    expect(SoundPlayer.stop).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
