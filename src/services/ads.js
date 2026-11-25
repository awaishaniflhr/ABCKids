import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import { ADS_ON } from './adsConfig';

// The native ad SDK only exists in app builds made after it was installed.
// In an older build (or anywhere it fails to load) ads are skipped quietly
// instead of crashing the app.
let sdk = null;
try {
  sdk = require('react-native-google-mobile-ads');
} catch {
  sdk = null;
}
export const adsSdk = sdk;
const TestIds = sdk?.TestIds ?? {};

// ---------------------------------------------------------------- ad units
// Paste the real ad unit IDs from your AdMob account here. While a value is
// empty (and always in debug builds) Google's test ads are shown instead.
// The App IDs live in app.json under "react-native-google-mobile-ads".
const REAL_UNITS = Platform.select({
  ios: { banner: '', interstitial: '' },
  default: {
    banner: 'ca-app-pub-2343503885430205/1720993270', // ABC Kids - Parent
    interstitial: '',
  },
});

// Google's own sample publisher: its App IDs and ad units only show test ads.
const GOOGLE_TEST_PUBLISHER = 'ca-app-pub-3940256099942544';
const appIds =
  require('../../app.json')['react-native-google-mobile-ads'] ?? {};
const APP_ID =
  Platform.OS === 'ios' ? appIds.ios_app_id : appIds.android_app_id;
const REAL_APP_ID =
  typeof APP_ID === 'string' && !APP_ID.startsWith(GOOGLE_TEST_PUBLISHER);

// Debug builds always use Google's test ads (never click your own real ads).
// A release build only shows real ads, and only once both the real App ID
// (app.json) and that ad unit's ID are filled in; otherwise that ad is
// simply skipped, never replaced by a test ad.
function unitId(kind, testId) {
  if (__DEV__) return testId ?? null;
  return REAL_APP_ID && REAL_UNITS[kind] ? REAL_UNITS[kind] : null;
}

export const BANNER_UNIT_ID = unitId('banner', TestIds.BANNER);
const INTERSTITIAL_UNIT_ID = unitId('interstitial', TestIds.INTERSTITIAL);

// This is a children's app: never personalised, child-directed, G-rated only.
export const AD_REQUEST_OPTIONS = { requestNonPersonalizedAdsOnly: true };

// ------------------------------------------------- full-screen ad pacing
// A full-screen ad may show when a child returns to Home from a game, but
// never in the first few minutes and never more often than this.
const FIRST_AD_AFTER_MS = 2 * 60 * 1000;
const MIN_GAP_MS = 4 * 60 * 1000;
const RETRY_AFTER_MS = 60 * 1000;

// ---------------------------------------------------------- ads on / off
// Turned off by the "Remove Ads" purchase later on.
let enabled = ADS_ON && Boolean(sdk);
// Set once the parent has bought "Remove Ads Forever": no ads anywhere,
// whatever else asks for them.
let adFree = false;

export function setAdFree(value) {
  adFree = Boolean(value);
  if (adFree) setAdsEnabled(false);
}
const listeners = new Set();

export function setAdsEnabled(value) {
  value = Boolean(value && ADS_ON && sdk && !adFree);
  if (enabled === value) return;
  enabled = value;
  listeners.forEach(listener => listener());
  if (enabled) loadInterstitial();
}

export function areAdsEnabled() {
  return enabled;
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAdsEnabled() {
  return useSyncExternalStore(subscribe, areAdsEnabled);
}

// --------------------------------------------------------------- startup
let started = null;
let interstitial = null;
let retryTimer = null;
let lastShownAt = 0;
const startedAt = Date.now();

// Call once when the app starts. Safe to call again.
export function initAds() {
  if (!ADS_ON || !sdk || adFree) return Promise.resolve();
  started ??= Promise.resolve()
    .then(() =>
      sdk.default().setRequestConfiguration({
        maxAdContentRating: sdk.MaxAdContentRating.G,
        tagForChildDirectedTreatment: true,
        tagForUnderAgeOfConsent: true,
      }),
    )
    .then(() => sdk.default().initialize())
    .then(() => loadInterstitial())
    .catch(() => {
      // No ads this session is fine; the app works the same without them.
    });
  return started;
}

function loadInterstitial() {
  if (!enabled || !INTERSTITIAL_UNIT_ID) return;
  try {
    if (!interstitial) {
      interstitial = sdk.InterstitialAd.createForAdRequest(
        INTERSTITIAL_UNIT_ID,
        AD_REQUEST_OPTIONS,
      );
      // After an ad closes, get the next one ready.
      interstitial.addAdEventListener(sdk.AdEventType.CLOSED, () => {
        lastShownAt = Date.now();
        loadInterstitial();
      });
      // No ad available (common): try again in a while, not straight away.
      interstitial.addAdEventListener(sdk.AdEventType.ERROR, () => {
        clearTimeout(retryTimer);
        retryTimer = setTimeout(loadInterstitial, RETRY_AFTER_MS);
      });
    }
    interstitial.load();
  } catch {
    // Skip full-screen ads rather than break the app.
  }
}

// Shows a full-screen ad if one is ready and enough time has passed.
// Returns true when an ad was shown.
export function maybeShowInterstitial(now = Date.now()) {
  if (!enabled || !interstitial?.loaded) return false;
  if (now - startedAt < FIRST_AD_AFTER_MS) return false;
  if (lastShownAt && now - lastShownAt < MIN_GAP_MS) return false;
  lastShownAt = now;
  try {
    interstitial.show().catch(() => loadInterstitial());
  } catch {
    return false;
  }
  return true;
}
