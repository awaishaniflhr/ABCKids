import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  coloringReducer,
  createColoring,
  drawingStorageKey,
  parseDrawing,
  serializeDrawing,
} from './coloring';

// Share pending writes across editor mounts, including a quick Back / reopen.
const pendingWrites = new Map();

export default function useColoringDrawing(template) {
  const [drawing, dispatch] = useReducer(
    coloringReducer,
    undefined,
    createColoring,
  );
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Opening your picture…');
  const mounted = useRef(true);
  const edited = useRef(false);
  const revision = useRef(0);

  useEffect(() => {
    let cancelled = false;
    mounted.current = true;
    Promise.resolve(pendingWrites.get(drawingStorageKey(template)))
      .catch(() => {})
      .then(() => AsyncStorage.getItem(drawingStorageKey(template)))
      .then(value => {
        if (!cancelled) {
          dispatch({ type: 'load', fills: parseDrawing(value, template) });
          setSaveStatus(value ? 'Saved on this device' : 'Ready to colour');
        }
      })
      .catch(() => {
        if (!cancelled) setSaveStatus('Could not open saved colours');
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, [template]);

  const save = useCallback(
    fills => {
      const currentRevision = ++revision.current;
      setSaveStatus('Saving…');
      // Finish writes in order, including after unmount, so rapid taps and Undo
      // cannot let an older save overwrite the latest picture.
      const storageKey = drawingStorageKey(template);
      const write = Promise.resolve(pendingWrites.get(storageKey))
        .catch(() => {})
        .then(() =>
          AsyncStorage.setItem(storageKey, serializeDrawing(template, fills)),
        );
      pendingWrites.set(storageKey, write);
      const cleanUp = () => {
        if (pendingWrites.get(storageKey) === write)
          pendingWrites.delete(storageKey);
      };
      write.then(cleanUp, cleanUp);
      return write.then(
        () => {
          if (mounted.current && currentRevision === revision.current)
            setSaveStatus('Saved on this device');
          return true;
        },
        () => {
          if (mounted.current && currentRevision === revision.current)
            setSaveStatus('Tap Save to try again');
          return false;
        },
      );
    },
    [template],
  );

  useEffect(() => {
    if (ready && edited.current) save(drawing.fills);
  }, [drawing.fills, ready, save]);

  const act = useCallback(
    action => {
      if (ready) {
        edited.current = true;
        dispatch(action);
      }
    },
    [ready],
  );

  return { drawing, ready, saveStatus, act, save: () => save(drawing.fills) };
}
