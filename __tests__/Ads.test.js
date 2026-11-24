const MINUTE = 60 * 1000;

// A fresh copy of the ads module (and its mocked SDK) for every test, with
// the master switch in adsConfig.js set to `on`.
function loadAds(on) {
  let ads;
  let sdk;
  jest.isolateModules(() => {
    jest.doMock('../src/services/adsConfig', () => ({ ADS_ON: on }));
    sdk = require('react-native-google-mobile-ads');
    ads = require('../src/services/ads');
  });
  return { ads, sdk };
}

async function readyAds() {
  const start = Date.now();
  const { ads, sdk } = loadAds(true);
  await ads.initAds();
  const ad = sdk.InterstitialAd.createForAdRequest.mock.results[0].value;
  ad.loaded = true;
  return { ads, ad, sdk, start };
}

describe('ads', () => {
  it('loads and shows nothing while the master switch is off', async () => {
    const { ads, sdk } = loadAds(false);
    await ads.initAds();
    expect(ads.areAdsEnabled()).toBe(false);
    ads.setAdsEnabled(true);
    expect(ads.areAdsEnabled()).toBe(false);
    expect(sdk.default().initialize).not.toHaveBeenCalled();
    expect(sdk.InterstitialAd.createForAdRequest).not.toHaveBeenCalled();
  });

  it('ships with ads switched off for now', () => {
    expect(jest.requireActual('../src/services/adsConfig').ADS_ON).toBe(false);
  });

  it('asks for child-safe, G-rated, non-personalised ads', async () => {
    const { ads, sdk } = await readyAds();
    expect(sdk.default().setRequestConfiguration).toHaveBeenCalledWith({
      maxAdContentRating: 'G',
      tagForChildDirectedTreatment: true,
      tagForUnderAgeOfConsent: true,
    });
    expect(ads.AD_REQUEST_OPTIONS.requestNonPersonalizedAdsOnly).toBe(true);
  });

  it('waits two minutes after start, then at most one ad every four', async () => {
    const { ads, ad, start } = await readyAds();
    expect(ads.maybeShowInterstitial(start + 1 * MINUTE)).toBe(false);
    expect(ads.maybeShowInterstitial(start + 3 * MINUTE)).toBe(true);
    expect(ads.maybeShowInterstitial(start + 5 * MINUTE)).toBe(false);
    expect(ads.maybeShowInterstitial(start + 8 * MINUTE)).toBe(true);
    expect(ad.show).toHaveBeenCalledTimes(2);
  });

  it('shows nothing once ads are turned off', async () => {
    const { ads, ad, start } = await readyAds();
    ads.setAdsEnabled(false);
    expect(ads.maybeShowInterstitial(start + 10 * MINUTE)).toBe(false);
    expect(ad.show).not.toHaveBeenCalled();
  });

  // Runs last: it swaps the mocked SDK for one that fails to load.
  it('keeps the app working when the native ad SDK is missing', async () => {
    let ads;
    jest.isolateModules(() => {
      jest.doMock('../src/services/adsConfig', () => ({ ADS_ON: true }));
      jest.doMock('react-native-google-mobile-ads', () => {
        throw new Error("'RNGoogleMobileAdsModule' could not be found");
      });
      ads = require('../src/services/ads');
    });
    jest.dontMock('react-native-google-mobile-ads');
    expect(typeof ads.initAds).toBe('function');
    await expect(ads.initAds()).resolves.toBeUndefined();
    expect(ads.areAdsEnabled()).toBe(false);
    expect(ads.maybeShowInterstitial(Date.now() + 60 * 60 * 1000)).toBe(false);
  });
});
