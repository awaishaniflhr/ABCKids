import { useSyncExternalStore } from 'react';

// Home says when it's ready to be seen (header measured, background picture
// loaded), so the splash screen can fade away without a half-drawn Home.
let homeReady = false;
const listeners = new Set();

export function markHomeReady() {
  if (homeReady) return;
  homeReady = true;
  listeners.forEach(listener => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
const getHomeReady = () => homeReady;

export function useHomeReady() {
  return useSyncExternalStore(subscribe, getHomeReady);
}
