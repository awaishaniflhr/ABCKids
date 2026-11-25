// Jest stand-in for the native Google Mobile Ads SDK (not available in tests).
const ads = {
  setRequestConfiguration: jest.fn(() => Promise.resolve()),
  initialize: jest.fn(() => Promise.resolve([])),
};

const mobileAds = () => ads;

module.exports = {
  __esModule: true,
  default: mobileAds,
  BannerAd: () => null,
  BannerAdSize: {
    BANNER: 'BANNER',
    ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
  },
  AdEventType: { LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed' },
  MaxAdContentRating: { G: 'G', PG: 'PG', T: 'T', MA: 'MA' },
  TestIds: {
    BANNER: 'test-banner',
    ADAPTIVE_BANNER: 'test-adaptive-banner',
    INTERSTITIAL: 'test-interstitial',
  },
  InterstitialAd: {
    createForAdRequest: jest.fn(() => ({
      loaded: false,
      load: jest.fn(),
      show: jest.fn(() => Promise.resolve()),
      addAdEventListener: jest.fn(() => () => {}),
    })),
  },
};
