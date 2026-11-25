import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from './AppIcon';

// Height the grid should leave free at its bottom so this button never
// covers the last row of cards.
export const CONTINUE_SPACE = 84;

// Big green "Continue" button floating at the bottom of a tracing game's
// list. `label` is the item it continues with, e.g. "D". By default it sits
// above the phone's bottom bar; `bottom` overrides that when the parent
// already keeps clear of it.
export default function ContinueButton({ label, onPress, bottom }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[styles.layer, { bottom: bottom ?? insets.bottom + 14 }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Continue with ${label}`}
        onPress={onPress}
        hitSlop={8}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.text}>Continue</Text>
        <View style={styles.item}>
          <Text numberOfLines={1} style={styles.itemText}>
            {label}
          </Text>
        </View>
        <AppIcon name="next" size={40} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 22,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 32,
    backgroundColor: '#2FB36E',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 6,
    shadowColor: '#1F5A3A',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  text: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    includeFontPadding: false,
  },
  item: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    color: '#1E7A4C',
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    includeFontPadding: false,
  },
});
