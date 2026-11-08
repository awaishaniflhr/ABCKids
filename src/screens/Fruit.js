import React, {useEffect, useRef} from 'react';
import {Image, StyleSheet, Animated} from 'react-native';

const Fruit = ({fruit, position, onAnimationFinish}) => {
  const fallAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(fallAnimation, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    });
    animation.start(({finished}) => {
      if (finished) {
        onAnimationFinish(fruit.id);
      }
    });
    return () => animation.stop();
  }, [fallAnimation, fruit.id, onAnimationFinish]);

  const translateY = fallAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 800],
  });

  return (
    <Animated.View style={[styles.fruitContainer, {transform: [{translateY}]}]}>
      <Image source={fruit.image} style={styles.fruitImage} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fruitContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fruitImage: {
    width: 50,
    height: 50,
  },
});

export default Fruit;
