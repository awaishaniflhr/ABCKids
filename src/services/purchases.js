import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAdFree } from './ads';

// "Remove Ads Forever": a one-time Google Play purchase (no subscription).
//
// - The ad-free status is saved on the phone, so it works offline. It lives in
//   its own storage, separate from the child's play history.
// - It is only granted once Google confirms the payment ("purchased"); a
//   pending payment (e.g. paying cash at a shop) waits until it completes.
// - Every purchase is acknowledged, as Google requires (otherwise Google
//   refunds it after 3 days).
// - After a reinstall or on a new phone, "Restore purchase" (and a quiet check
//   when the app opens) asks Google Play which items this account owns.
//
// Create the product in Play Console > Monetize > Products > In-app products
// with exactly this ID, as a one-time (non-consumable) product.
export const REMOVE_ADS_SKU = 'remove_ads_forever';

let Iap = null;
try {
  Iap = require('react-native-iap');
} catch {
  Iap = null; // No store in this build; buying is simply unavailable.
}

const STORAGE_KEY = '@abckids/purchases/v1';

// ------------------------------------------------------------------ state
// status: 'idle' | 'busy' | 'pending' | 'done' | 'restored' | 'none' | 'error'
let state = { adFree: false, price: null, status: 'idle', message: null };
const listeners = new Set();

function update(changes) {
  state = { ...state, ...changes };
  listeners.forEach(listener => listener());
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getState() {
  return state;
}

export function usePurchases() {
  return useSyncExternalStore(subscribe, getState);
}
export function isAdFree() {
  return state.adFree;
}

function grantAdFree() {
  setAdFree(true);
  if (state.adFree) return;
  update({ adFree: true });
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ adFree: true })).catch(
    () => {},
  );
}

const ownsRemoveAds = purchase =>
  purchase?.productId === REMOVE_ADS_SKU &&
  purchase.purchaseState === 'purchased';

async function acknowledge(purchase) {
  try {
    await Iap.finishTransaction({ purchase, isConsumable: false });
  } catch {
    // Already acknowledged, or offline: it is tried again next time.
  }
}

// ------------------------------------------------------- store connection
let connecting = null;

function connect() {
  if (!Iap) return Promise.resolve(false);
  connecting ??= Iap.initConnection()
    .then(connected => {
      if (!connected) throw new Error('Store not available');
      Iap.purchaseUpdatedListener(async purchase => {
        if (purchase?.productId !== REMOVE_ADS_SKU) return;
        if (purchase.purchaseState === 'pending') {
          update({
            status: 'pending',
            message:
              'Payment is pending. Ads will be removed as soon as it completes.',
          });
          return;
        }
        if (!ownsRemoveAds(purchase)) return;
        grantAdFree();
        update({ status: 'done', message: 'Thank you! Ads are gone for good.' });
        await acknowledge(purchase);
      });
      Iap.purchaseErrorListener(error => {
        if (error?.code === 'user-cancelled') {
          update({ status: 'idle', message: null });
        } else if (error?.code === 'already-owned') {
          // Bought before (e.g. on another phone): treat it as restored.
          restoreRemoveAds();
        } else {
          update({
            status: 'error',
            message: 'The purchase didn’t go through. Please try again.',
          });
        }
      });
      return true;
    })
    .catch(() => {
      connecting = null; // Offline: try again later.
      return false;
    });
  return connecting;
}

async function fetchPrice() {
  try {
    const products = await Iap.fetchProducts({
      skus: [REMOVE_ADS_SKU],
      type: 'in-app',
    });
    const product = products?.find(item => item.id === REMOVE_ADS_SKU);
    if (product) update({ price: product.displayPrice });
  } catch {
    // Price stays unknown; the button still works.
  }
}

// Looks up what this Google Play account owns. True when it owns Remove Ads.
async function checkOwned() {
  const purchases = (await Iap.getAvailablePurchases()) ?? [];
  const owned = purchases.find(ownsRemoveAds);
  if (!owned) return false;
  grantAdFree();
  if (!owned.isAcknowledgedAndroid) await acknowledge(owned);
  return true;
}

// ------------------------------------------------------------ public API
let started = null;

// Call once when the app starts, before ads start: loads the saved ad-free
// status (works offline), then quietly checks Google Play when online.
export function initPurchases() {
  started ??= AsyncStorage.getItem(STORAGE_KEY)
    .then(value => {
      if (value && JSON.parse(value)?.adFree === true) grantAdFree();
    })
    .catch(() => {})
    .then(() => {
      // Don't hold up the app for the network.
      connect().then(connected => {
        if (!connected) return;
        fetchPrice();
        if (!state.adFree) checkOwned().catch(() => {});
      });
    });
  return started;
}

export async function buyRemoveAds() {
  if (state.adFree) return;
  update({ status: 'busy', message: null });
  if (!(await connect())) {
    update({
      status: 'error',
      message: 'Connect to the internet to buy, then try again.',
    });
    return;
  }
  try {
    await Iap.requestPurchase({
      request: {
        google: { skus: [REMOVE_ADS_SKU] },
        apple: { sku: REMOVE_ADS_SKU },
      },
      type: 'in-app',
    });
    // The result arrives through purchaseUpdatedListener.
  } catch {
    update({
      status: 'error',
      message: 'The purchase didn’t go through. Please try again.',
    });
  }
}

export async function restoreRemoveAds() {
  update({ status: 'busy', message: null });
  if (!(await connect())) {
    update({
      status: 'error',
      message: 'Connect to the internet to restore, then try again.',
    });
    return;
  }
  try {
    if (await checkOwned()) {
      update({ status: 'restored', message: 'Welcome back! Ads are removed.' });
    } else {
      update({
        status: 'none',
        message:
          'No purchase found for this Google account. Use the account that bought it.',
      });
    }
  } catch {
    update({
      status: 'error',
      message: 'Couldn’t check your purchases. Please try again.',
    });
  }
}

// Clears any message (e.g. when the settings card closes).
export function clearPurchaseMessage() {
  if (state.status !== 'busy') update({ status: 'idle', message: null });
}
