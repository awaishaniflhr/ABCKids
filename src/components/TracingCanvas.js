import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  beginTrace,
  moveTrace,
  pauseTrace,
  pointOnStroke,
  canvasGeometry,
  canvasPoint,
} from '../games/tracingLetters';

function Guide({ stroke, progress, layout, color, animate, number }) {
  const travel = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const { scale, left, top } = canvasGeometry(layout.width, layout.height);
  const start = pointOnStroke(stroke, progress);
  const stops = Array.from({ length: 41 }, (_, index) =>
    pointOnStroke(stroke, progress + ((stroke.length - progress) * index) / 40),
  );
  const inputRange = stops.map((_, index) => index / 40);
  useEffect(() => {
    if (!animate) return;
    const demonstration = Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(travel, {
          toValue: 1,
          duration: Math.max(1600, (stroke.length - progress) * 6),
          easing: Easing.linear,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.delay(500),
        Animated.timing(travel, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    const beacon = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 650,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    demonstration.start();
    beacon.start();
    return () => {
      demonstration.stop();
      beacon.stop();
    };
  }, [animate, progress, pulse, stroke, travel]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.beacon,
          {
            left: left + start.x * scale - 17,
            top: top + start.y * scale - 17,
            backgroundColor: color,
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.18],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.number}>{number}</Text>
      </Animated.View>
      {animate && (
        <Animated.View
          style={[
            styles.finger,
            {
              transform: [
                {
                  translateX: travel.interpolate({
                    inputRange,
                    outputRange: stops.map(
                      point => left + point.x * scale - 14,
                    ),
                  }),
                },
                {
                  translateY: travel.interpolate({
                    inputRange,
                    outputRange: stops.map(point => top + point.y * scale - 6),
                  }),
                },
              ],
            },
          ]}
        >
          <Svg width={43} height={51} viewBox="0 0 43 51">
            <Path
              d="M14 28 L14 7 Q14 1 19 1 Q24 1 24 7 L24 20 Q27 16 30 21 Q35 18 37 24 Q42 23 42 30 L40 41 Q38 49 29 49 L22 49 Q17 49 13 43 L3 32 Q0 27 4 25 Q8 23 14 28 Z"
              fill="#FFF8E9"
              stroke="#475A86"
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

export default memo(function TracingCanvas({
  template,
  trace,
  color,
  active,
  reducedMotion,
  helpKey,
  onChange,
  onMotion,
}) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const latest = useRef();
  const finger = useRef(null);
  const grantedStroke = useRef(null);
  latest.current = {
    template,
    trace,
    color,
    active,
    onChange,
    onMotion,
    layout,
  };
  function update(next) {
    latest.current.trace = next;
    latest.current.onChange(next);
  }
  const cancel = useCallback(() => {
    latest.current.onMotion?.(false);
    finger.current = null;
    grantedStroke.current = null;
    if (latest.current.trace.drawing) update(pauseTrace(latest.current.trace));
  }, []);
  useEffect(() => {
    if (!active) cancel();
  }, [active, cancel]);
  useEffect(() => {
    if (!trace.drawing || trace.complete) latest.current.onMotion?.(false);
  }, [trace.drawing, trace.complete, helpKey]);
  function touch(event, start) {
    const current = latest.current;
    if (
      !current.active ||
      current.trace.complete ||
      !current.layout.width ||
      !current.layout.height
    )
      return;
    const native = event.nativeEvent;
    const touches = native.touches?.length ? native.touches : [native];
    const contact = start
      ? touches[0]
      : touches.find(item => (item.identifier ?? 0) === finger.current);
    if (!contact) return;
    if (start) {
      finger.current = contact.identifier ?? 0;
      grantedStroke.current = current.trace.strokeIndex;
    }
    if (current.trace.strokeIndex !== grantedStroke.current) return;
    const point = canvasPoint(
      { x: contact.locationX, y: contact.locationY },
      current.layout.width,
      current.layout.height,
    );
    const { scale } = canvasGeometry(
      current.layout.width,
      current.layout.height,
    );
    const tolerance = Math.max(26, Math.min(50, 18 / scale));
    const next = (start ? beginTrace : moveTrace)(
      current.trace,
      point,
      current.template.strokes,
      tolerance,
    );
    const advancing =
      !start &&
      next.drawing &&
      !next.offTrack &&
      next.strokeIndex === current.trace.strokeIndex &&
      next.progress > current.trace.progress + 0.2;
    current.onMotion?.(advancing);
    update(next);
  }
  const stroke = template.strokes[trace.strokeIndex];
  return (
    <View
      testID="tracing-canvas"
      accessibilityLabel={`Tracing canvas for ${template.letter}`}
      accessibilityHint="Drag from the numbered dot along each dotted stroke. Lift your finger between strokes."
      style={styles.canvas}
      onLayout={({ nativeEvent: { layout: next } }) => {
        if (next.width !== layout.width || next.height !== layout.height) {
          cancel();
          setLayout({ width: next.width, height: next.height });
        }
      }}
      onStartShouldSetResponder={() => active && !trace.complete}
      onMoveShouldSetResponder={() => active && !trace.complete}
      onResponderGrant={event => touch(event, true)}
      onResponderMove={event => touch(event, false)}
      onResponderEnd={event => {
        if (
          event.nativeEvent.changedTouches?.some(
            item => (item.identifier ?? 0) === finger.current,
          )
        )
          cancel();
      }}
      onResponderRelease={cancel}
      onResponderTerminate={cancel}
      onResponderTerminationRequest={() => true}
    >
      <Svg
        pointerEvents="none"
        width="100%"
        height="100%"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid meet"
      >
        {template.strokes.map((item, index) => (
          <Path
            key={`outline-${index}`}
            d={item.d}
            stroke="#AAA4E3"
            strokeWidth={57}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        {template.strokes.map((item, index) => (
          <Path
            key={`paper-${index}`}
            d={item.d}
            stroke="#FFFEFC"
            strokeWidth={45}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        {template.strokes.map((item, index) => (
          <Path
            key={`dots-${index}`}
            d={item.d}
            stroke={index === trace.strokeIndex ? '#C1B9EC' : '#E1DEF2'}
            strokeWidth={5}
            strokeDasharray={[1, 13]}
            strokeLinecap="round"
            fill="none"
          />
        ))}
        {template.strokes.map((item, index) => {
          const progress =
            index < trace.strokeIndex
              ? item.length
              : index === trace.strokeIndex
              ? trace.progress
              : 0;
          return progress > 0 ? (
            <Path
              key={`paint-${index}`}
              testID={`traced-stroke-${index}`}
              d={item.d}
              stroke={color}
              strokeWidth={45}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={[item.length, item.length]}
              strokeDashoffset={item.length - progress}
              fill="none"
            />
          ) : null;
        })}
        {stroke && !trace.drawing && (
          <Circle
            cx={pointOnStroke(stroke, trace.progress).x}
            cy={pointOnStroke(stroke, trace.progress).y}
            r={22}
            fill={color}
            opacity={0.12}
          />
        )}
      </Svg>
      {active && stroke && !trace.drawing && layout.width > 0 && (
        <Guide
          key={`${trace.strokeIndex}-${helpKey}-${trace.progress.toFixed(0)}`}
          stroke={stroke}
          progress={trace.progress}
          layout={layout}
          color={color}
          animate={!reducedMotion}
          number={trace.strokeIndex + 1}
        />
      )}
    </View>
  );
});
const styles = StyleSheet.create({
  canvas: { flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' },
  beacon: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  number: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  finger: { position: 'absolute', top: 0, left: 0 },
});
