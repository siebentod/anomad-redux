import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { File, Lists, List } from '../../shared/types';

export const selectLists = (state: RootState) => state.lists.lists;
export const selectIsListsLoaded = (state: RootState) => state.lists.isLoaded;
export const selectList = (listName: string) =>
  createSelector(
    [selectLists],
    (lists: Lists) => {
      const foundList = lists.find((list: List) => list.name === listName);
      return foundList ? foundList.items : [];
    }
  );

// Пока нигде не используется
export const selectAllFilesFromLists = createSelector(
  [selectLists],
  (lists: Lists) => {
    const filesMap = new Map<string, File>();

    lists.forEach((list: List) => {
      (list.items as File[]).forEach((item: File) => {
        if (!filesMap.has(item.full_path)) {
          filesMap.set(item.full_path, item);
        }
      });
    });

    return Array.from(filesMap.values());
  }
);

export const selectFileByFullPath = (fullPath: string) =>
  createSelector(
    [selectLists],
    (lists: Lists): File | null => {
      for (const list of lists) {
        const file = (list.items as File[]).find((item: File) => item.full_path === fullPath);
        if (file) {
          return file;
        }
      }
      return null;
    }
  );
