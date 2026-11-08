import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function HeaderNew({ activityCount }) {
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
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{activityCount} fun activities</Text>
      </View>
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffffdd',
    borderColor: '#ffffff',
    borderWidth: 2,
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingVertical: 8,
    flexShrink: 0,
  },
  badgeText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: '#315574',
    includeFontPadding: false,
  },
});
