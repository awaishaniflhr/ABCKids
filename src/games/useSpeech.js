import { useCallback, useEffect, useRef } from 'react';
import Tts from 'react-native-tts';

export default function useSpeech() {
  const ready = useRef(false);
  useEffect(() => {
    let mounted = true;
    Tts.getInitStatus()
      .then(() => Tts.setDefaultLanguage('en-US'))
      .then(() => Tts.setDefaultRate(0.35))
      .then(() => {
        ready.current = mounted;
      })
      .catch(() => {});
    return () => {
      mounted = false;
      ready.current = false;
      Tts.stop().catch(() => {});
    };
  }, []);
  return useCallback(text => {
    if (ready.current)
      Tts.stop()
        .then(() => {
          if (ready.current) return Tts.speak(String(text));
        })
        .catch(() => {});
  }, []);
}
