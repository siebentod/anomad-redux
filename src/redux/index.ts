import { configureStore } from '@reduxjs/toolkit';
import filesReducer from './files/filesSlice';
import listsReducer from './lists/listsSlice';
import settingsReducer from './settings/settingsSlice';
import { listenerMiddleware } from './middleware';
import { loadSettings } from './settings/settingsSlice';
import { loadLists } from './lists/listsSlice';

// Thunk для инициализации приложения
export const initializeApp = () => async (dispatch: AppDispatch) => {
  try {
    await Promise.all([
      dispatch(loadSettings()),
      dispatch(loadLists())
    ]);
  } catch (error) {
    console.error('Ошибка инициализации приложения:', error);
  }
};

export const store = configureStore({
  reducer: {
    files: filesReducer,
    lists: listsReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});

// Инициализируем приложение при создании store
store.dispatch(initializeApp() as any);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Типизированные хуки для использования в компонентах
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
