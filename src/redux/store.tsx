import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {
  FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE,
  persistReducer, persistStore,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userReducers from './Reducers/userReducers';

const reducers = combineReducers({
  user: userReducers,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['user'],
};

const persistedReducer = persistReducer(persistConfig, reducers);

export const store = configureStore({
  reducer: {
    root: persistedReducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
    },
  }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
