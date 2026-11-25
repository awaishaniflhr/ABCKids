import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('@react-navigation/native', () => ({ useFocusEffect: jest.fn() }));

const flush = () => new Promise(resolve => setImmediate(resolve));

// A fresh copy of the purchase code, the billing fake and storage per test.
function load({ adsOn = true } = {}) {
  let modules;
  jest.isolateModules(() => {
    jest.doMock('../src/services/adsConfig', () => ({ ADS_ON: adsOn }));
    // Share the test's React so the Settings card's hooks work.
    jest.doMock('react', () => React);
    modules = {
      Iap: require('react-native-iap'),
      storage: require('@react-native-async-storage/async-storage').default,
      purchases: require('../src/services/purchases'),
      ads: require('../src/services/ads'),
      SettingsButton: require('../src/components/Settings').default,
    };
  });
  modules.storage.__reset();
  return modules;
}

const purchase = state => ({
  productId: 'remove_ads_forever',
  purchaseState: state,
  purchaseToken: 'token',
});

describe('Remove Ads Forever', () => {
  it('a confirmed purchase removes ads, is saved and is acknowledged', async () => {
    const { Iap, storage, purchases, ads } = load();
    await purchases.initPurchases();
    await flush();
    const onPurchase = Iap.purchaseUpdatedListener.mock.calls[0][0];
    await purchases.buyRemoveAds();
    expect(Iap.requestPurchase).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'in-app' }),
    );
    await onPurchase(purchase('purchased'));
    expect(purchases.isAdFree()).toBe(true);
    expect(ads.areAdsEnabled()).toBe(false);
    expect(Iap.finishTransaction).toHaveBeenCalledWith({
      purchase: purchase('purchased'),
      isConsumable: false,
    });
    await flush();
    expect(JSON.parse(await storage.getItem('@abckids/purchases/v1'))).toEqual({
      adFree: true,
    });
  });

  it('waits for a pending payment before removing ads', async () => {
    const { Iap, purchases } = load();
    await purchases.initPurchases();
    await flush();
    const onPurchase = Iap.purchaseUpdatedListener.mock.calls[0][0];
    await onPurchase(purchase('pending'));
    expect(purchases.isAdFree()).toBe(false);
  });

  it('stays ad-free offline once bought (saved on the phone)', async () => {
    const { Iap, storage, purchases, ads } = load();
    await storage.setItem(
      '@abckids/purchases/v1',
      JSON.stringify({ adFree: true }),
    );
    Iap.initConnection.mockRejectedValue(new Error('offline'));
    await purchases.initPurchases();
    expect(purchases.isAdFree()).toBe(true);
    ads.setAdsEnabled(true);
    expect(ads.areAdsEnabled()).toBe(false);
  });

  it('restore brings back ad-free for the same Google account', async () => {
    const { Iap, purchases } = load();
    Iap.getAvailablePurchases.mockResolvedValue([purchase('purchased')]);
    await purchases.restoreRemoveAds();
    expect(purchases.isAdFree()).toBe(true);
  });

  it('restore says so when this account has not bought it', async () => {
    const { purchases } = load();
    await purchases.restoreRemoveAds();
    expect(purchases.isAdFree()).toBe(false);
  });

  it('a fresh install starts without ad-free', async () => {
    const { purchases } = load();
    await purchases.initPurchases();
    await flush();
    expect(purchases.isAdFree()).toBe(false);
  });
});

describe('Settings card', () => {
  function render(adsOn) {
    const { Iap, purchases, SettingsButton } = load({ adsOn });
    let screen;
    ReactTestRenderer.act(() => {
      screen = ReactTestRenderer.create(<SettingsButton />);
    });
    const button = label =>
      screen.root.find(
        node =>
          node.props.accessibilityLabel === label &&
          typeof node.props.onPress === 'function',
      );
    const has = label =>
      screen.root.findAll(node => node.props.accessibilityLabel === label)
        .length > 0;
    return { Iap, purchases, screen, button, has };
  }

  it('asks a grown-up before buying, and a wrong answer buys nothing', () => {
    const { Iap, screen, button } = render(true);
    ReactTestRenderer.act(() => button('Settings').props.onPress());
    ReactTestRenderer.act(() => button('Remove Ads Forever').props.onPress());
    const input = screen.root.find(
      node =>
        node.props.accessibilityLabel === 'Answer' && node.props.onChangeText,
    );
    ReactTestRenderer.act(() => input.props.onChangeText('1'));
    ReactTestRenderer.act(() => button('Continue').props.onPress());
    expect(Iap.requestPurchase).not.toHaveBeenCalled();
  });

  it('hides Remove Ads while the app shows no ads', () => {
    const { button, has } = render(false);
    ReactTestRenderer.act(() => button('Settings').props.onPress());
    expect(has('Music')).toBe(true);
    expect(has('Remove Ads Forever')).toBe(false);
  });
});
