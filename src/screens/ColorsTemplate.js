import React from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../components/BackButton';
import ColoringSketch from '../components/ColoringSketch';
import { COLORING_TEMPLATES } from '../games/coloringTemplates';
export default function ColorsTemplate({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const wide = width > height;
  const columns = wide ? 3 : 2;
  const cardWidth =
    (width - insets.left - insets.right - 32 - (columns - 1) * 12) / columns;
  const cardHeight = wide
    ? Math.max(
        134,
        Math.min(220, (height - insets.top - insets.bottom - 112) / 2),
      )
    : 230;
  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <Image
        source={require('../assets/homebgimg.jpg')}
        style={styles.background}
        resizeMode="cover"
        pointerEvents="none"
      />
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            paddingLeft: insets.left + 10,
            paddingRight: insets.right + 16,
          },
        ]}
      >
        <BackButton navigation={navigation} size={34} />
        <View style={styles.heading}>
          <Text style={styles.title}>Colour the Shapes</Text>
          <Text style={styles.subtitle}>
            Little artist, choose your next masterpiece!
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>6 fun pictures</Text>
        </View>
      </View>
      <FlatList
        key={columns}
        numColumns={columns}
        data={COLORING_TEMPLATES}
        keyExtractor={item => item.id}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingLeft: insets.left + 16,
            paddingRight: insets.right + 16,
            paddingBottom: insets.bottom + 16,
          },
        ]}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Colour ${item.name.toLowerCase()}`}
            onPress={() =>
              navigation.navigate('Coloring', {
                templateId: item.id,
              })
            }
            style={({ pressed }) => [
              styles.card,
              {
                width: cardWidth,
                height: cardHeight,
                borderColor: item.accent,
              },
              pressed && styles.pressed,
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.preview,
                {
                  backgroundColor: item.tint,
                },
              ]}
            >
              <ColoringSketch template={item} />
            </View>
            <View style={styles.caption}>
              <View style={styles.captionText}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.detail}>
                  {item.regions.length} parts to colour
                </Text>
              </View>
              <View
                style={[
                  styles.play,
                  {
                    backgroundColor: item.accent,
                  },
                ]}
              >
                <Text style={styles.playText}>›</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF5E4',
  },
  background: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 8,
    backgroundColor: '#FFFAF1E8',
  },
  heading: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#284B67',
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 12,
    color: '#617C8F',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#FFE6A1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  badgeText: {
    color: '#8B6324',
    fontWeight: '800',
    fontSize: 12,
  },
  row: {
    gap: 12,
  },
  listContent: {
    paddingTop: 8,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderRadius: 22,
    padding: 5,
    overflow: 'hidden',
  },
  preview: {
    flex: 1,
    borderRadius: 15,
  },
  caption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingTop: 5,
    paddingBottom: 3,
  },
  captionText: {
    flex: 1,
  },
  name: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#31516B',
  },
  detail: {
    fontSize: 10,
    color: '#68818C',
  },
  play: {
    width: 28,
    height: 28,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: {
    color: '#FFFFFF',
    fontSize: 27,
    lineHeight: 30,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },
});
