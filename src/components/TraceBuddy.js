import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

// Original vector mascot: no downloaded animation or large image sequence.
export default memo(function TraceBuddy({ size = 125, happy, animate = true }) {
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!animate) {
      bounce.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: happy ? 480 : 950,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: happy ? 480 : 950,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [animate, bounce, happy]);
  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      style={{
        width: size,
        height: size,
        transform: [
          {
            translateY: bounce.interpolate({
              inputRange: [0, 1],
              outputRange: [0, happy ? -10 : -5],
            }),
          },
          {
            rotate: bounce.interpolate({
              inputRange: [0, 1],
              outputRange: ['-3deg', '3deg'],
            }),
          },
        ],
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 160 170">
        <Ellipse cx={81} cy={157} rx={39} ry={6} fill="#76B8A4" opacity={0.2} />
        <Ellipse
          cx={42}
          cy={94}
          rx={24}
          ry={37}
          rotation={-35}
          origin="42,94"
          fill="#EFFCFF"
          stroke="#85CEDA"
          strokeWidth={3}
        />
        <Ellipse
          cx={117}
          cy={94}
          rx={24}
          ry={37}
          rotation={35}
          origin="117,94"
          fill="#EFFCFF"
          stroke="#85CEDA"
          strokeWidth={3}
        />
        <Path
          d="M62 140 L55 151 M97 140 L104 151 M58 103 L32 91 M102 103 L128 84"
          stroke="#344D62"
          strokeWidth={8}
          strokeLinecap="round"
        />
        <Ellipse
          cx={80}
          cy={113}
          rx={33}
          ry={34}
          fill="#FFD463"
          stroke="#344D62"
          strokeWidth={3}
        />
        <Path
          d="M49 111 Q80 126 111 111 M52 129 Q80 141 108 129"
          stroke="#344D62"
          strokeWidth={10}
          fill="none"
        />
        <Path
          d="M65 43 Q57 22 48 27 M94 43 Q104 22 114 27"
          stroke="#344D62"
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx={47} cy={26} r={6} fill="#F5AD65" />
        <Circle cx={115} cy={26} r={6} fill="#F5AD65" />
        <Circle
          cx={80}
          cy={68}
          r={39}
          fill="#FFD463"
          stroke="#344D62"
          strokeWidth={3}
        />
        <Ellipse cx={53} cy={78} rx={9} ry={5} fill="#F4A092" />
        <Ellipse cx={107} cy={78} rx={9} ry={5} fill="#F4A092" />
        {happy ? (
          <Path
            d="M56 63 Q64 53 72 63 M88 63 Q96 53 104 63"
            stroke="#344D62"
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <G>
            <Ellipse cx={64} cy={63} rx={7} ry={10} fill="#344D62" />
            <Ellipse cx={96} cy={63} rx={7} ry={10} fill="#344D62" />
            <Circle cx={66} cy={59} r={2.5} fill="white" />
            <Circle cx={98} cy={59} r={2.5} fill="white" />
          </G>
        )}
        <Path d="M66 82 Q80 101 94 82 Z" fill="#344D62" />
        <Path
          d="M73 90 Q80 85 87 90"
          stroke="#F4A092"
          strokeWidth={4}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
});
