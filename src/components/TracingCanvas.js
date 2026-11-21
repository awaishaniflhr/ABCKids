import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import {
  beginTrace,
  moveTrace,
  pauseTrace,
  pointOnStroke,
  canvasGeometry,
  canvasPoint,
  DEFAULT_BOX,
} from '../games/tracingLetters';

export const DEFAULT_THEME = {
  outline: '#AAA4E3',
  paper: '#FFFEFC',
  dots: '#C1B9EC',
  idleDots: '#E1DEF2',
  outlineWidth: 57,
  paperWidth: 45,
  beacon: 34,
  startDots: false,
};

function Guide({
  stroke,
  progress,
  layout,
  box,
  color,
  animate,
  number,
  size,
}) {
  const travel = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const { scale, left, top } = canvasGeometry(layout.width, layout.height, box);
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
            width: size,
            height: size,
            borderRadius: size / 2,
            left: left + start.x * scale - size / 2,
            top: top + start.y * scale - size / 2,
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
        <Text style={[styles.number, { fontSize: size * 0.47 }]}>
          {number}
        </Text>
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
  theme: themeOverride,
}) {
  const theme = themeOverride
    ? { ...DEFAULT_THEME, ...themeOverride }
    : DEFAULT_THEME;
  const box = template.box || DEFAULT_BOX;
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
    const currentBox = current.template.box || DEFAULT_BOX;
    const point = canvasPoint(
      { x: contact.locationX, y: contact.locationY },
      current.layout.width,
      current.layout.height,
      currentBox,
    );
    const { scale } = canvasGeometry(
      current.layout.width,
      current.layout.height,
      currentBox,
    );
    // Words draw smaller letters, so allow a little more wiggle room
    // (measured on screen) than single big letters do.
    const wordBoard = Boolean(current.template.box);
    const tolerance = Math.max(
      26,
      Math.min(wordBoard ? 70 : 50, (wordBoard ? 20 : 18) / scale),
    );
    const endRadius = wordBoard ? Math.max(18, 14 / scale) : 18;
    const next = (start ? beginTrace : moveTrace)(
      current.trace,
      point,
      current.template.strokes,
      tolerance,
      endRadius,
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
        viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {template.strokes.map((item, index) => (
          <Path
            key={`outline-${index}`}
            d={item.d}
            stroke={theme.outline}
            strokeWidth={theme.outlineWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        {template.strokes.map((item, index) => (
          <Path
            key={`paper-${index}`}
            d={item.d}
            stroke={theme.paper}
            strokeWidth={theme.paperWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        {template.strokes.map((item, index) => (
          <Path
            key={`dots-${index}`}
            d={item.d}
            stroke={index === trace.strokeIndex ? theme.dots : theme.idleDots}
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
              strokeWidth={theme.paperWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={[item.length, item.length]}
              strokeDashoffset={item.length - progress}
              fill="none"
            />
          ) : null;
        })}
        {theme.startDots &&
          template.strokes.map((item, index) => {
            if (index <= trace.strokeIndex) return null;
            const first = item.points[0];
            return (
              <React.Fragment key={`start-${index}`}>
                <Circle
                  cx={first.x}
                  cy={first.y}
                  r={13}
                  fill={theme.dots}
                  stroke="#FFFFFF"
                  strokeWidth={3}
                />
                <SvgText
                  x={first.x}
                  y={first.y + 6}
                  fill="#FFFFFF"
                  fontSize={16}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {String(item.number ?? index + 1)}
                </SvgText>
              </React.Fragment>
            );
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
          box={box}
          color={color}
          animate={!reducedMotion}
          number={stroke.number ?? trace.strokeIndex + 1}
          size={theme.beacon}
        />
      )}
    </View>
  );
});
const styles = StyleSheet.create({
  canvas: { flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' },
  beacon: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  number: { color: '#FFFFFF', fontWeight: '900' },
  finger: { position: 'absolute', top: 0, left: 0 },
});
