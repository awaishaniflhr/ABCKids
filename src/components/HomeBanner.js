import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AD_REQUEST_OPTIONS,
  BANNER_UNIT_ID,
  adsSdk,
  useAdsEnabled,
} from '../services/ads';

// The slim banner (fixed 320x50, the smallest size Google allows) at the
// bottom of Home. It takes no room until an ad has actually
// loaded (and none when ads are off or the ad SDK isn't in this build), so
// the games grid fills the screen. `onShownChange` tells Home when it shows.
export default function HomeBanner({ bottomInset = 0, onShownChange }) {
  const enabled = useAdsEnabled();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const BannerAd = adsSdk?.BannerAd;
  const show = enabled && !failed && Boolean(BannerAd && BANNER_UNIT_ID);
  const visible = show && loaded;
  useEffect(() => {
    onShownChange?.(visible);
  }, [visible, onShownChange]);
  if (!show) return null;
  return (
    <View style={[styles.wrap, visible && { paddingBottom: bottomInset }]}>
      <BannerAd
        unitId={BANNER_UNIT_ID}
        size={adsSdk.BannerAdSize.BANNER}
        requestOptions={AD_REQUEST_OPTIONS}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center' },
});
