import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { LazyStore } from '@tauri-apps/plugin-store';
import type { Settings, ExcludedListItem, File } from 'shared/types';

const storeFile = new LazyStore('settings.json');

const defaultSettings: Settings = {
  types: ['pdf', 'djvu'],
  excludedList: [],
  pdfReaderPath: '',
};

interface SettingsState {
  settings: Settings;
  isLoaded: boolean;
  defaultSettings: Settings;
}

const initialState: SettingsState = {
  settings: defaultSettings,
  isLoaded: false,
  defaultSettings,
};

// Thunk для загрузки настроек
export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async (_, { rejectWithValue }) => {
    try {
      const entries = await storeFile.entries();
      const loadedSettings = Object.fromEntries(entries) as Settings;
      const mergedSettings = { ...defaultSettings, ...loadedSettings };
      return mergedSettings;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка при загрузке настроек';
      console.error('Ошибка загрузки настроек:', error);
      return rejectWithValue(errorMessage);
    }
  }
);

// Thunk для сохранения настройки
export const writeSetting = createAsyncThunk(
  'settings/writeSetting',
  async ({ key, value }: { key: string; value: unknown }, { rejectWithValue }) => {
    try {
      await storeFile.set(key, value);
      await storeFile.save();
      return { key, value };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка при сохранении настройки';
      console.error(`Ошибка сохранения настройки "${key}":`, error);
      return rejectWithValue(errorMessage);
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<Settings>) => {
      state.settings = action.payload;
    },
    setSetting: (state, action: PayloadAction<{ key: string; value: unknown }>) => {
      const { key, value } = action.payload;
      state.settings = { ...state.settings, [key]: value };
    },
    addToExcluded: (state, action: PayloadAction<File>) => {
      const itemData = action.payload;
      const currentList = state.settings.excludedList || [];

      const existingIndex = currentList.findIndex(
        (item) => item.file_name === itemData.file_name
      );

      if (existingIndex === -1) {
        const newItem: ExcludedListItem = {
          file_name: itemData.file_name,
          dateAdded: new Date().toISOString(),
        };
        state.settings.excludedList = [...currentList, newItem];
      }
    },
    addToExcludedPath: (state, action: PayloadAction<string>) => {
      const path = action.payload;
      const currentList = state.settings.excludedList || [];

      const existingIndex = currentList.findIndex((item) => item.path === path);

      if (existingIndex === -1) {
        const newItem: ExcludedListItem = {
          path,
          dateAdded: new Date().toISOString(),
        };
        state.settings.excludedList = [...currentList, newItem];
      }
    },
    removeFromExcluded: (state, action: PayloadAction<string>) => {
      const identifier = action.payload;
      const currentList = state.settings.excludedList || [];
      state.settings.excludedList = currentList.filter(
        (item) => item.file_name !== identifier && item.path !== identifier
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSettings.pending, (state) => {
        state.isLoaded = false;
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.isLoaded = true;
      })
      .addCase(loadSettings.rejected, (state, action) => {
        console.error('Не удалось загрузить настройки:', action.payload);
        state.settings = defaultSettings;
        state.isLoaded = true;
      })
      .addCase(writeSetting.fulfilled, (state, action) => {
        const { key, value } = action.payload;
        state.settings = { ...state.settings, [key]: value };
      })
      .addCase(writeSetting.rejected, (state, action) => {
        console.error('Не удалось записать настройку:', action.payload);
        // Состояние не изменяем, так как запись не удалась
      });
  },
});

export const { setSettings, setSetting, addToExcluded, addToExcludedPath, removeFromExcluded } = settingsSlice.actions;

export default settingsSlice.reducer;
