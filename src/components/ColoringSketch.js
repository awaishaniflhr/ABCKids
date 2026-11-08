import React, { memo } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

const SHAPES = { path: Path, circle: Circle, ellipse: Ellipse };
export const SKETCH_OUTLINE = '#263B50';

export default memo(function ColoringSketch({
  template,
  fills = {},
  onFill,
  disabled = false,
  svgRef,
  paper = false,
}) {
  return (
    <Svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid meet"
      testID={`sketch-${template.id}`}
    >
      {paper && (
        <Rect
          x={0}
          y={0}
          width={400}
          height={400}
          fill="#FFFFFF"
          pointerEvents="none"
        />
      )}
      {template.regions.map(region => {
        const Shape = SHAPES[region.type];
        return (
          <Shape
            key={region.id}
            {...region.props}
            testID={`region-${region.id}`}
            fill={fills[region.id] || '#FFFFFF'}
            stroke={SKETCH_OUTLINE}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            accessible={Boolean(onFill)}
            accessibilityRole={onFill ? 'button' : undefined}
            accessibilityLabel={region.label}
            accessibilityHint={onFill ? 'Tap to colour this part' : undefined}
            accessibilityState={{ disabled }}
            onPress={onFill && !disabled ? () => onFill(region.id) : undefined}
          />
        );
      })}
      <G
        pointerEvents="none"
        stroke={SKETCH_OUTLINE}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {template.details.map((item, index) => {
          const Shape = SHAPES[item.type];
          return <Shape key={index} {...item.props} />;
        })}
      </G>
    </Svg>
  );
});
