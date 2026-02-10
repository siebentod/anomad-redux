import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from './index';
import type { List } from 'src/shared/types';
import {
  setLists,
  setList,
  addToList,
  removeFromList,
  removeList,
  updateFileInAllLists,
  updateFilesInAllLists,
  writeList,
  writeAllLists,
} from './lists/listsSlice';
import { setFiles } from './files/filesSlice';
import type { File } from 'src/shared/types';
import {
  addToExcluded,
  addToExcludedPath,
  writeSetting,
  setSettings,
  setSetting,
} from './settings/settingsSlice';

export const listenerMiddleware = createListenerMiddleware();

// Автоматическое сохранение списков при изменениях
listenerMiddleware.startListening({
  matcher: isAnyOf(
    setLists,
    setList,
    addToList,
    removeFromList,
    removeList,
    updateFileInAllLists,
    updateFilesInAllLists
  ),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const lists = state.lists.lists;

    // Сохраняем только если данные уже загружены
    if (!state.lists.isLoaded) {
      return;
    }

    try {
      const dispatch = listenerApi.dispatch as AppDispatch;

      switch (action.type) {
        case 'lists/setLists':
        case 'lists/updateFileInAllLists':
        case 'lists/updateFilesInAllLists':
        case 'lists/removeList':
          await dispatch(writeAllLists(lists));
          break;
        case 'lists/setList':
        case 'lists/addToList':
        case 'lists/removeFromList': {
          const listName = (action.payload as { listName: string }).listName;
          const foundList = lists.find((l: List) => l.name === listName);
          if (foundList) {
            await dispatch(writeList({ listName, value: foundList.items }));
          }
          break;
        }
      }
    } catch (error) {
      console.error('Ошибка сохранения списков:', error);
      // Можно добавить уведомление пользователю об ошибке
    }
  },
});

// Автоматическое обновление файлов с highlights во всех списках
listenerMiddleware.startListening({
  matcher: setFiles.match,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const dispatch = listenerApi.dispatch as AppDispatch;
    const newFiles = action.payload as File[];
    
    // Фильтруем файлы с highlights
    const filesWithHighlights = newFiles.filter(file => file.highlights);
    
    if (filesWithHighlights.length === 0) {
      return;
    }
    
    // Обновляем файлы с highlights во всех списках
    // updateFilesInAllLists сама проверит наличие файлов в списках
    if (filesWithHighlights.length > 0) {
      dispatch(updateFilesInAllLists(filesWithHighlights));
    }
  },
});

// Автоматическое сохранение настроек при изменениях
listenerMiddleware.startListening({
  matcher: isAnyOf(setSettings, setSetting, addToExcluded, addToExcludedPath),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;

    // Сохраняем только если данные уже загружены
    if (!state.settings.isLoaded) {
      return;
    }

    try {
      const dispatch = listenerApi.dispatch as AppDispatch;

      switch (action.type) {
        case 'settings/setSettings':
          const settings = action.payload as RootState['settings']['settings'];
          // Сохраняем все настройки
          await Promise.all(
            Object.entries(settings).map(([key, value]) =>
              dispatch(writeSetting({ key, value }))
            )
          );
          break;
        case 'settings/setSetting':
          const { key, value } = action.payload as {
            key: string;
            value: unknown;
          };
          await dispatch(writeSetting({ key, value }));
          break;
        case 'settings/addToExcluded':
        case 'settings/addToExcludedPath':
          await dispatch(
            writeSetting({
              key: 'excludedList',
              value: state.settings.settings.excludedList,
            })
          );
          break;
      }
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      // Можно добавить уведомление пользователю об ошибке
    }
  },
});
