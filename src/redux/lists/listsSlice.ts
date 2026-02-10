import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { LazyStore } from '@tauri-apps/plugin-store';
import type { Lists, List, ListItem, File } from 'shared/types';

const storeFile = new LazyStore('lists.json');


interface ListsState {
  lists: Lists;
  isLoaded: boolean;
}

const initialState: ListsState = {
  lists: [],
  isLoaded: false,
};

// Вспомогательные функции для работы с массивом списков
const findListByName = (lists: Lists, name: string): List | undefined => {
  return lists.find((list) => list.name === name);
};

const updateListByName = (
  lists: Lists,
  name: string,
  items: ListItem[]
): Lists => {
  const existingIndex = lists.findIndex((list) => list.name === name);
  if (existingIndex !== -1) {
    const newLists = [...lists];
    newLists[existingIndex] = { ...newLists[existingIndex], items };
    return newLists;
  }
  return [...lists, { name, items }];
};

// Thunk для загрузки списков
export const loadLists = createAsyncThunk(
  'lists/loadLists',
  async (_, { rejectWithValue }) => {
    try {
      const entries = await storeFile.entries();
      const loadedListsObj = Object.fromEntries(entries) as Record<string, ListItem[]>;
      
      if (!Object.keys(loadedListsObj).length) {
        return [];
      }

      // Преобразуем объект в массив списков
      const loadedLists: Lists = Object.entries(loadedListsObj).map(([name, items]) => ({
        name,
        items,
      }));

      return loadedLists;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка при загрузке списков';
      console.error('Ошибка загрузки списков:', error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Thunk для сохранения списка
export const writeList = createAsyncThunk(
  'lists/writeList',
  async ({ listName, value }: { listName: string; value: ListItem[] }, { rejectWithValue }) => {
    try {
      await storeFile.set(listName, value);
      await storeFile.save();
      return { listName, value };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка при сохранении списка';
      console.error(`Ошибка сохранения списка "${listName}":`, error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Thunk для сохранения всех списков
export const writeAllLists = createAsyncThunk(
  'lists/writeAllLists',
  async (newLists: Lists, { rejectWithValue }) => {
    try {
      // Преобразуем массив обратно в объект для сохранения в файл
      await Promise.all(
        newLists.map((list) =>
          storeFile.set(list.name, list.items)
        )
      );
      await storeFile.save();
      return newLists;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка при сохранении всех списков';
      console.error('Ошибка сохранения всех списков:', error);
      return rejectWithValue(errorMessage);
    }
  }
);

const listsSlice = createSlice({
  name: 'lists',
  initialState,
  reducers: {
    setLists: (state, action: PayloadAction<Lists>) => {
      state.lists = action.payload;
    },
    setList: (state, action: PayloadAction<{ listName: string; value: ListItem[] }>) => {
      const { listName, value } = action.payload;
      state.lists = updateListByName(state.lists, listName, value);
    },
    addToList: (state, action: PayloadAction<{ listName: string; itemData: File }>) => {
      const { listName, itemData } = action.payload;
      const foundList = findListByName(state.lists, listName);
      const currentList = (foundList?.items as ListItem[]) || [];
      
      const existingIndex = currentList.findIndex(
        (item) => item.file_name === itemData.file_name
      );

      if (existingIndex === -1) {
        const newItem: ListItem = {
          ...itemData,
          dateAdded: new Date().toISOString(),
        };
        state.lists = updateListByName(state.lists, listName, [...currentList, newItem]);
      }
    },
    removeFromList: (state, action: PayloadAction<{ listName: string; fileName: string }>) => {
      const { listName, fileName } = action.payload;
      const foundList = findListByName(state.lists, listName);
      if (foundList) {
        const currentList = foundList.items as ListItem[];
        const filteredItems = currentList.filter((item) => item.file_name !== fileName);
        state.lists = updateListByName(state.lists, listName, filteredItems);
      }
    },
    removeList: (state, action: PayloadAction<string>) => {
      const listName = action.payload;
      state.lists = state.lists.filter((list) => list.name !== listName);
    },
    updateFileInAllLists: (state, action: PayloadAction<{ file: File; field?: string }>) => {
      const { file: updatedFile, field = 'full_path' } = action.payload;
      let hasChanges = false;

      const updatedLists: Lists = state.lists.map((list) => {
        const updatedItems = (list.items as ListItem[]).map((file) => {
          if (updatedFile[field] === file[field]) {
            hasChanges = true;
            return { ...updatedFile, dateAdded: file.dateAdded };
          }
          return file;
        });

        return { ...list, items: updatedItems };
      });

      if (hasChanges) {
        state.lists = updatedLists;
      }
    },
    updateFilesInAllLists: (state, action: PayloadAction<File[]>) => {
      const updatedFiles = action.payload;
      // Создаем Map для быстрого поиска по full_path
      const updatedFilesMap = new Map(updatedFiles.map(file => [file.full_path, file]));
      let hasChanges = false;

      const updatedLists: Lists = state.lists.map((list) => {
        const updatedItems = (list.items as ListItem[]).map((file) => {
          const updatedFile = updatedFilesMap.get(file.full_path);
          if (updatedFile) {
            hasChanges = true;
            return { ...updatedFile, dateAdded: file.dateAdded };
          }
          return file;
        });

        return { ...list, items: updatedItems };
      });

      if (hasChanges) {
        state.lists = updatedLists;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadLists.pending, (state) => {
        state.isLoaded = false;
      })
      .addCase(loadLists.fulfilled, (state, action) => {
        state.lists = action.payload;
        state.isLoaded = true;
      })
      .addCase(loadLists.rejected, (state, action) => {
        console.error('Не удалось загрузить списки:', action.payload);
        state.lists = [];
        state.isLoaded = true;
      })
      .addCase(writeList.fulfilled, (state, action) => {
        const { listName, value } = action.payload;
        state.lists = updateListByName(state.lists, listName, value);
      })
      .addCase(writeList.rejected, (state, action) => {
        console.error('Не удалось записать список:', action.payload);
        // Состояние не изменяем, так как запись не удалась
      })
      .addCase(writeAllLists.fulfilled, (state, action) => {
        state.lists = action.payload;
      })
      .addCase(writeAllLists.rejected, (state, action) => {
        console.error('Не удалось записать все списки:', action.payload);
        // Состояние не изменяем, так как запись не удалась
      });
  },
});

export const {
  setLists,
  setList,
  addToList,
  removeFromList,
  removeList,
  updateFileInAllLists,
  updateFilesInAllLists,
} = listsSlice.actions;

export default listsSlice.reducer;
