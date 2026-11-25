import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import SettingsButton from './Settings';

export default function HeaderNew() {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Image
            source={require('../assets/abc.png')}
            resizeMode="contain"
            style={styles.logoImage}
          />
        </View>
        <View style={styles.brandText}>
          <Text style={styles.title}>
            <Text style={styles.abc}>ABC</Text> Kids
          </Text>
          <Text style={styles.subtitle}>Little steps. Big discoveries.</Text>
        </View>
      </View>
      <SettingsButton />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  brand: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, gap: 10 },
  logo: {
    width: 50,
    height: 50,
    backgroundColor: '#ffffff',
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-5deg' }],
  },
  logoImage: { width: 40, height: 40 },
  brandText: { flexShrink: 1 },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 25,
    color: '#22486b',
    includeFontPadding: false,
  },
  abc: { color: '#087eaa' },
  subtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    color: '#4d6881',
    includeFontPadding: false,
  },
});
