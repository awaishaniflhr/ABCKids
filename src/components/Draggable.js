import React from 'react';
import LegacyDraggable from 'react-native-draggable';

// React 19 no longer applies defaultProps to function components.
export default function Draggable(props) {
  return <LegacyDraggable {...LegacyDraggable.defaultProps} {...props} />;
}
