import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ActivityResult } from '../src/components/ActivityLayout';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

function render(props) {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  const onReplay = jest.fn();
  let screen;
  ReactTestRenderer.act(() => {
    screen = ReactTestRenderer.create(
      <ActivityResult
        navigation={navigation}
        message="You matched every animal!"
        onReplay={onReplay}
        {...props}
      />,
    );
  });
  const button = label =>
    screen.root.find(
      node =>
        node.props.accessibilityRole === 'button' &&
        node.props.accessibilityLabel === label &&
        typeof node.props.onPress === 'function',
    );
  return { navigation, onReplay, button };
}

describe('finish card', () => {
  it('has a Home icon that goes back to the Home screen', () => {
    const { navigation, button } = render();
    ReactTestRenderer.act(() => button('Home').props.onPress());
    expect(navigation.navigate).toHaveBeenCalledWith('Home');
  });

  it('has a replay icon that starts the game again', () => {
    const { onReplay, button } = render();
    ReactTestRenderer.act(() => button('Play again').props.onPress());
    expect(onReplay).toHaveBeenCalled();
  });

  it('can show a next icon instead, e.g. for "Next level"', () => {
    const { onReplay, button } = render({
      replayLabel: 'Next level',
      replayIcon: 'next',
    });
    ReactTestRenderer.act(() => button('Next level').props.onPress());
    expect(onReplay).toHaveBeenCalled();
  });
});
