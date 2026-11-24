import React from 'react';
import AppIcon from './AppIcon';

// The round "back" button icon used by every back button in the app.
export default function BackIcon({ size = 44, style }) {
  return <AppIcon name="back" size={size} style={style} />;
}
