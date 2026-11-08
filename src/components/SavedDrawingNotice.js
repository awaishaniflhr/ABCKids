import React, { useEffect } from 'react';
import {
  AppState,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export const SAVED_NOTICE_MS = 3000;

export default function SavedDrawingNotice({ onClose }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    const timer = setTimeout(onClose, SAVED_NOTICE_MS);
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    const appState = AppState.addEventListener('change', state => {
      if (state !== 'active') onClose();
    });
    return () => {
      clearTimeout(timer);
      back.remove();
      appState.remove();
    };
  }, [onClose]);

  return (
    <View
      testID="drawing-saved-notice"
      accessibilityViewIsModal
      style={[
        styles.overlay,
        {
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
          paddingLeft: insets.left + 16,
          paddingRight: insets.right + 16,
        },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            width: Math.min(340, width - insets.left - insets.right - 32),
            maxHeight: height - insets.top - insets.bottom - 32,
          },
        ]}
      >
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text accessible={false} style={styles.stars}>
            ✦ ★ ✦
          </Text>
          <View accessible={false} style={styles.checkCircle}>
            <Svg
              width={42}
              height={42}
              viewBox="0 0 48 48"
              pointerEvents="none"
            >
              <Path
                d="M11 25 L20 34 L38 15"
                fill="none"
                stroke="#23836C"
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <View
            accessible
            accessibilityRole="alert"
            accessibilityLabel="Drawing saved! Your picture is saved in your phone's gallery. Look for the ABC Kids album."
          >
            <Text style={styles.title}>Drawing saved!</Text>
            <Text style={styles.message}>
              Your picture is saved in your phone's gallery.
            </Text>
            <Text style={styles.hint}>Look for the ABC Kids album.</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#233D5877',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#BFEADF',
    backgroundColor: '#FFFAF1',
    padding: 20,
  },
  body: { flexShrink: 1 },
  content: { alignItems: 'center' },
  stars: { color: '#EFB336', fontSize: 22, letterSpacing: 5, marginBottom: 10 },
  checkCircle: {
    width: 76,
    height: 76,
    backgroundColor: '#DBF4E9',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#284B67',
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#387A6D',
    textAlign: 'center',
    marginTop: 6,
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
    color: '#68818C',
    textAlign: 'center',
    marginTop: 8,
  },
});
