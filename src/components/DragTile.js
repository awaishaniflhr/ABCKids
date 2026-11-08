import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';

// Translations are relative to the current tile; drop positions are measured in
// window coordinates. No game depends on a particular phone size or rotation.
export default function DragTile({
  children,
  label,
  onDrop,
  onTap,
  disabled,
  style,
}) {
  const offset = useRef(new Animated.ValueXY()).current;
  const current = useRef({ onDrop, onTap, disabled });
  const [dragging, setDragging] = React.useState(false);
  current.current = { onDrop, onTap, disabled };
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !current.current.disabled,
      onMoveShouldSetPanResponder: () => !current.current.disabled,
      onPanResponderGrant: () => {
        offset.stopAnimation();
        setDragging(true);
      },
      onPanResponderMove: (_event, gesture) =>
        offset.setValue({ x: gesture.dx, y: gesture.dy }),
      onPanResponderRelease: (_event, gesture) => {
        setDragging(false);
        if (!current.current.disabled) {
          if (Math.hypot(gesture.dx, gesture.dy) < 8) current.current.onTap?.();
          else current.current.onDrop({ x: gesture.moveX, y: gesture.moveY });
        }
        Animated.spring(offset, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          speed: 30,
          bounciness: 0,
        }).start();
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        offset.setValue({ x: 0, y: 0 });
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
        { transform: offset.getTranslateTransform() },
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
