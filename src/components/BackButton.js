import { StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import BackIcon from './BackIcon';

const BackButton = ({ navigation, onPress, style, size = 40 }) => {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={onPress || (() => navigation.goBack())}
      style={[styles.button, style]}
    >
      <BackIcon size={size} />
    </TouchableOpacity>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  button: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
