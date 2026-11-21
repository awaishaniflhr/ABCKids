import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

// Height of a card `width` wide: a picture on top plus `titleRoom` for the
// title (by default enough for two short lines).
export function pictureCardHeight(
  width,
  titleRoom = Math.max(36, width * 0.2),
) {
  return (width - 16) * 0.8 + 16 + titleRoom;
}

// A white card with a picture on top, a round play button in its corner and
// the title below. Used for the songs on Poems and the games on Home.
// `cover` is a full picture; without one, `children` (an icon or small art)
// is shown on a soft background in the card's colour. `renderTitle` replaces
// the plain title text.
export default function PictureCard({
  title,
  cover,
  color,
  width,
  height = pictureCardHeight(width),
  highlighted = false,
  accessibilityLabel,
  onPress,
  renderTitle,
  children,
}) {
  const art = width - 16;
  const play = Math.round(width * 0.22);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width, height },
        highlighted && styles.cardHighlighted,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.picture, { height: art * 0.8 }]}>
        {cover ? (
          <Image source={cover} style={styles.fill} resizeMode="cover" />
        ) : (
          <View
            style={[
              styles.fill,
              styles.plain,
              { backgroundColor: `${color}40` },
            ]}
          >
            {children}
          </View>
        )}
        <View
          style={[
            styles.play,
            {
              backgroundColor: color,
              width: play,
              height: play,
              borderRadius: play / 2,
            },
          ]}
        >
          <Text style={[styles.playSymbol, { fontSize: play * 0.4 }]}>
            {'▶'}
          </Text>
        </View>
        {highlighted ? (
          <Text style={[styles.note, { color }]}>{'♫'}</Text>
        ) : null}
      </View>
      <View style={styles.titleBox}>
        {renderTitle ? (
          renderTitle()
        ) : (
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={[styles.title, { fontSize: Math.max(13, width * 0.075) }]}
          >
            {title}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 8,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#2A3A6B',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardHighlighted: {
    borderColor: '#FFD43B',
    backgroundColor: '#FFFBEA',
    elevation: 8,
    shadowColor: '#FFB020',
    shadowOpacity: 0.5,
  },
  cardPressed: { transform: [{ scale: 0.96 }] },
  picture: { borderRadius: 18, overflow: 'hidden' },
  fill: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  plain: { alignItems: 'center', justifyContent: 'center' },
  play: {
    position: 'absolute',
    top: 8,
    right: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  playSymbol: {
    color: '#FFFFFF',
    fontWeight: '900',
    marginLeft: '8%',
    includeFontPadding: false,
  },
  note: {
    position: 'absolute',
    right: 14,
    bottom: 6,
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: '#FFFFFF',
    textShadowRadius: 4,
  },
  titleBox: { flex: 1, justifyContent: 'center', paddingHorizontal: 4 },
  title: {
    color: '#22305C',
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
