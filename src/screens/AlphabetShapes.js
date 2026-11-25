import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ActivityScreen,
  ActivityResult,
  useActivityLayout,
} from '../components/ActivityLayout';
import DragTile from '../components/DragTile';
import { MATCHING_ANIMALS } from '../games/learningData';
import { containsPoint } from '../games/responsiveLayout';
import useSpeech from '../games/useSpeech';
import SoundPlayer from '../utills/SoundPlayer';

const names = ['Tiger', 'Cat', 'Zebra', 'Wolf', 'Lion'];
const nameOf = id => names[id - 1];
const TOTAL = MATCHING_ANIMALS.length;
// Wrong tries on one animal before its shadow starts glowing as a hint.
const HINT_AFTER = 2;
// Drops count when they land this far (as a share of the tile) outside the box.
const DROP_SLACK = 0.35;
const RESULT_DELAY_MS = 1100;

// Shadows in a fresh order each round, never lined up with the animals.
export function shuffleTargets(ids, random = Math.random) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const order = [...ids];
    for (let index = order.length - 1; index > 0; index--) {
      const swap = Math.floor(random() * (index + 1));
      [order[index], order[swap]] = [order[swap], order[index]];
    }
    if (order.every((id, index) => id !== ids[index])) return order;
  }
  return [...ids.slice(1), ids[0]];
}

function measure(node) {
  return new Promise(resolve => {
    if (!node?.measureInWindow) {
      resolve(null);
      return;
    }
    // A view can disappear mid-gesture during rotation or navigation.
    const timeout = setTimeout(() => resolve(null), 250);
    node.measureInWindow((x, y, width, height) => {
      clearTimeout(timeout);
      resolve({ x, y, width, height });
    });
  });
}

const grow = (bounds, slack) => ({
  x: bounds.x - bounds.width * slack,
  y: bounds.y - bounds.height * slack,
  width: bounds.width * (1 + slack * 2),
  height: bounds.height * (1 + slack * 2),
});

function ShadowTarget({
  animal,
  size,
  done,
  hint,
  wrongKey,
  onPress,
  targetRef,
}) {
  const pop = useRef(new Animated.Value(1)).current;
  const reveal = useRef(new Animated.Value(done ? 1 : 0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!done) {
      reveal.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(reveal, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(pop, {
          toValue: 1.2,
          speed: 40,
          bounciness: 12,
          useNativeDriver: true,
        }),
        Animated.spring(pop, {
          toValue: 1,
          speed: 14,
          bounciness: 10,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [done, pop, reveal]);

  useEffect(() => {
    if (!wrongKey) return;
    Animated.sequence(
      [1, -1, 0.6, -0.6, 0].map(toValue =>
        Animated.timing(wiggle, {
          toValue,
          duration: 60,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [wrongKey, wiggle]);

  useEffect(() => {
    if (!hint || done) {
      glow.stopAnimation();
      glow.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 550,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [hint, done, glow]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        transform: [
          {
            scale: Animated.multiply(
              pop,
              glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }),
            ),
          },
          {
            rotate: wiggle.interpolate({
              inputRange: [-1, 1],
              outputRange: ['-8deg', '8deg'],
            }),
          },
        ],
      }}
    >
      <Pressable
        ref={targetRef}
        collapsable={false}
        accessibilityRole="button"
        accessibilityLabel={`Match ${nameOf(animal.id)}`}
        accessibilityState={{ disabled: done }}
        onPress={onPress}
        style={[styles.target, done && styles.done, hint && styles.hint]}
      >
        <Image
          source={animal.source}
          resizeMode="contain"
          style={[styles.animal, styles.silhouette]}
        />
        <Animated.Image
          source={animal.source}
          resizeMode="contain"
          style={[styles.animal, styles.revealed, { opacity: reveal }]}
        />
        {done && (
          <View style={styles.tick}>
            <Text style={styles.tickText}>{'✓'}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function AlphabetShapes({ navigation }) {
  const { width, height, wide, contentWidth, contentHeight } =
    useActivityLayout();
  const speak = useSpeech();
  const ids = MATCHING_ANIMALS.map(animal => animal.id);
  const [order, setOrder] = useState(() => shuffleTargets(ids));
  const [matched, setMatched] = useState([]);
  const [selected, setSelected] = useState(null);
  const [misses, setMisses] = useState({});
  const [wrong, setWrong] = useState({ id: null, key: 0 });
  const [finished, setFinished] = useState(false);
  const matchedRef = useRef([]);
  const refs = useRef({});
  const timers = useRef([]);
  const version = useRef('');
  version.current = `${width}-${height}`;
  const size = Math.max(
    52,
    Math.min(112, wide ? (contentWidth - 48) / 5 : (contentHeight - 70) / 5),
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);
  const later = useCallback((callback, ms) => {
    timers.current.push(setTimeout(callback, ms));
  }, []);

  function match(id) {
    if (matchedRef.current.includes(id)) return;
    const next = [...matchedRef.current, id];
    matchedRef.current = next;
    setMatched(next);
    setSelected(null);
    const last = next.length === TOTAL;
    SoundPlayer.playSoundFile(last ? 'modalsound' : 'done', 'mp3');
    later(
      () => speak(last ? `${nameOf(id)}! You did it!` : `${nameOf(id)}!`),
      350,
    );
    if (last) later(() => setFinished(true), RESULT_DELAY_MS);
  }

  function miss(animalId, targetId) {
    setMisses(previous => ({
      ...previous,
      [animalId]: (previous[animalId] || 0) + 1,
    }));
    if (targetId != null) {
      setWrong(previous => ({ id: targetId, key: previous.key + 1 }));
      speak(`That is the ${nameOf(targetId)}. Try again!`);
    }
  }

  // Returns false on a miss so the dragged tile wiggles.
  async function drop(id, point) {
    const before = version.current;
    const open = order.filter(
      targetId => !matchedRef.current.includes(targetId),
    );
    const bounds = await Promise.all(
      open.map(targetId => measure(refs.current[targetId])),
    );
    if (before !== version.current) return false;
    const correct = bounds[open.indexOf(id)];
    if (correct && containsPoint(grow(correct, DROP_SLACK), point)) {
      match(id);
      return true;
    }
    const hit = open.find(
      (targetId, index) =>
        targetId !== id && bounds[index] && containsPoint(bounds[index], point),
    );
    miss(id, hit ?? null);
    return false;
  }

  function pick(id) {
    setSelected(id);
    speak(`${nameOf(id)}. Find its shadow!`);
  }

  function tapTarget(id) {
    if (selected == null || matchedRef.current.includes(id)) return;
    if (selected === id) match(id);
    else miss(selected, id);
  }

  function replay() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    matchedRef.current = [];
    setMatched([]);
    setSelected(null);
    setMisses({});
    setWrong({ id: null, key: 0 });
    setFinished(false);
    setOrder(shuffleTargets(ids));
  }

  const source = (
    <View style={[styles.column, styles.sources, wide && styles.horizontal]}>
      {MATCHING_ANIMALS.map(animal => (
        <View key={animal.id} style={{ width: size, height: size }}>
          {!matched.includes(animal.id) && (
            <DragTile
              key={`${animal.id}-${version.current}`}
              label={`Drag ${nameOf(animal.id)}`}
              onTap={() => pick(animal.id)}
              onDragStart={() => setSelected(animal.id)}
              onDrop={point => drop(animal.id, point)}
              style={[styles.tile, selected === animal.id && styles.selected]}
            >
              <Image
                source={animal.source}
                resizeMode="contain"
                style={styles.animal}
              />
            </DragTile>
          )}
        </View>
      ))}
    </View>
  );
  const destinations = (
    <View style={[styles.column, wide && styles.horizontal]}>
      {order.map(id => {
        const animal = MATCHING_ANIMALS.find(item => item.id === id);
        return (
          <ShadowTarget
            key={id}
            animal={animal}
            size={size}
            done={matched.includes(id)}
            hint={!matched.includes(id) && (misses[id] || 0) >= HINT_AFTER}
            wrongKey={wrong.id === id ? wrong.key : 0}
            onPress={() => tapTarget(id)}
            targetRef={node => {
              refs.current[id] = node;
            }}
          />
        );
      })}
    </View>
  );
  return (
    <ActivityScreen
      navigation={navigation}
      title="Match the Animals"
      homeHeader
      subtitle="Drag each animal to its shadow"
    >
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`${matched.length} of ${TOTAL} animals matched`}
        style={styles.progress}
      >
        {ids.map((id, index) => (
          <Text
            key={id}
            style={[styles.star, index < matched.length && styles.starOn]}
          >
            {'★'}
          </Text>
        ))}
      </View>
      <View style={[styles.board, wide && styles.wideBoard]}>
        {source}
        <Text style={styles.arrow}>{wide ? '↓' : '→'}</Text>
        {destinations}
      </View>
      {finished && (
        <ActivityResult
          navigation={navigation}
          message="You matched every animal!"
          onReplay={replay}
        />
      )}
    </ActivityScreen>
  );
}
const styles = StyleSheet.create({
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 4,
  },
  star: { fontSize: 24, color: '#C9D6DC' },
  starOn: { color: '#F4B83A' },
  board: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    gap: 8,
  },
  wideBoard: { flexDirection: 'column' },
  column: { gap: 10, zIndex: 2 },
  sources: { zIndex: 3 },
  horizontal: { flexDirection: 'row', gap: 12 },
  tile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderColor: '#FFD56C',
    borderWidth: 3,
    padding: 5,
    shadowColor: '#7A5A10',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  selected: { backgroundColor: '#FFE6A1', borderColor: '#F4A62A' },
  animal: { width: '90%', height: '90%' },
  target: {
    flex: 1,
    backgroundColor: '#FFFFFFDD',
    borderColor: '#9FB8C1',
    borderWidth: 3,
    borderRadius: 20,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  silhouette: { tintColor: '#5F7784' },
  revealed: { position: 'absolute' },
  done: {
    borderColor: '#38AF8D',
    borderStyle: 'solid',
    backgroundColor: '#E9FBF4',
  },
  hint: { borderColor: '#F4A62A', borderStyle: 'solid', borderWidth: 4 },
  tick: {
    position: 'absolute',
    right: -6,
    top: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#38AF8D',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  arrow: { fontSize: 28, color: '#31516B' },
});
