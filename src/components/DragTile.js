import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';

// Translations are relative to the current tile; drop positions are measured in
// window coordinates. No game depends on a particular phone size or rotation.
// `onDrop` may return (or resolve to) `false` to signal a miss: the tile then
// springs home and gives a gentle wiggle so children know to try again.
export default function DragTile({
  children,
  label,
  onDrop,
  onTap,
  onDragStart,
  disabled,
  style,
}) {
  const offset = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const wiggle = useRef(new Animated.Value(0)).current;
  const current = useRef({ onDrop, onTap, onDragStart, disabled });
  const [dragging, setDragging] = React.useState(false);
  current.current = { onDrop, onTap, onDragStart, disabled };
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !current.current.disabled,
      onMoveShouldSetPanResponder: () => !current.current.disabled,
      onPanResponderGrant: () => {
        offset.stopAnimation();
        wiggle.stopAnimation();
        wiggle.setValue(0);
        setDragging(true);
        current.current.onDragStart?.();
        Animated.spring(scale, {
          toValue: 1.12,
          speed: 40,
          bounciness: 8,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderMove: (_event, gesture) =>
        offset.setValue({ x: gesture.dx, y: gesture.dy }),
      onPanResponderRelease: (_event, gesture) => {
        setDragging(false);
        Animated.spring(scale, {
          toValue: 1,
          speed: 30,
          bounciness: 6,
          useNativeDriver: false,
        }).start();
        let result;
        if (!current.current.disabled) {
          if (Math.hypot(gesture.dx, gesture.dy) < 8) current.current.onTap?.();
          else
            result = current.current.onDrop?.({
              x: gesture.moveX,
              y: gesture.moveY,
            });
        }
        Animated.spring(offset, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          speed: 18,
          bounciness: 7,
        }).start();
        Promise.resolve(result)
          .then(value => {
            if (value !== false) return;
            Animated.sequence(
              [1, -1, 0.7, -0.7, 0].map(toValue =>
                Animated.timing(wiggle, {
                  toValue,
                  duration: 70,
                  useNativeDriver: false,
                }),
              ),
            ).start();
          })
          .catch(() => {});
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        offset.setValue({ x: 0, y: 0 });
        scale.setValue(1);
      },
    }),
  ).current;
  return (
    <Animated.View
      {...responder.panHandlers}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      onAccessibilityTap={() => current.current.onTap?.()}
      style={[
        style,
        dragging && styles.dragging,
        {
          transform: [
            ...offset.getTranslateTransform(),
            { scale },
            {
              rotate: wiggle.interpolate({
                inputRange: [-1, 1],
                outputRange: ['-10deg', '10deg'],
              }),
            },
          ],
        },
      ]}
    >
      <View pointerEvents="none" style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  dragging: { zIndex: 100, elevation: 12 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
