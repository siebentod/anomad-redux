import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { File } from 'shared/types';
import { DEFAULT_FETCH_COUNT } from './config';

interface FilesState {
  files: File[];
  isLoading: boolean;
  error: string | null;
  searchError: string | null;
  currentQuery: string;
  currentFilters: Record<string, any>;
  lastSearchTime: string | null;
  fetchCount: number;
}

const initialState: FilesState = {
  files: [],
  isLoading: false,
  error: null,
  searchError: null,
  currentQuery: '',
  currentFilters: {},
  lastSearchTime: null,
  fetchCount: DEFAULT_FETCH_COUNT,
};

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    setFiles: (state, action: PayloadAction<File[]>) => {
      const existingFilesMap = new Map(state.files.map(file => [file.full_path, file]));

      state.files = action.payload.map(newFile => {
        const existingFile = existingFilesMap.get(newFile.full_path);
        // Если получен файл с хайлайтами, всегда берем его
        if (newFile.highlights) {
          return newFile;
        }
        // Если получен файл без хайлайтов, но он уже есть с хайлайтами, используем старый с хайлайтами
        if (existingFile && existingFile.highlights) {
          return existingFile;
        }
        // Если нет, используем новый
        return newFile;
      });
      state.lastSearchTime = new Date().toISOString();
    },
    replaceFileByField: (state, action: PayloadAction<{ file: File; field?: string }>) => {
      const { file, field = 'full_path' } = action.payload;
      const originalFiles = [...state.files];
      state.files = state.files.map((item) => {
        if (item[field] === file[field]) {
          console.log('replaceFileByField: Заменяю файл по полю', field, ':', {
            старый: item,
            новый: file
          });
          return file;
        }
        return item;
      });

      const hasChanges = state.files.some((newFile, index) => newFile !== originalFiles[index]);
      if (hasChanges) {
        console.log('replaceFileByField: Замена произошла, найдено изменений:', state.files.length - originalFiles.length + state.files.filter((f, i) => f !== originalFiles[i]).length);
      } else {
        console.log('replaceFileByField: Замена НЕ произошла, файл не найден по полю', field, 'со значением:', file[field]);
        console.log('replaceFileByField: Доступные значения поля', field, 'в файлах:', state.files.map(f => f[field]));
      }

      state.lastSearchTime = new Date().toISOString();
    },
    removeFile: (state, action: PayloadAction<string>) => {
      state.files = state.files.filter(
        (file) => file.file_name !== action.payload
      );
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSearchError: (state, action: PayloadAction<string | null>) => {
      state.searchError = action.payload;
    },
    setCurrentQuery: (state, action: PayloadAction<string>) => {
      state.currentQuery = action.payload;
    },
    setCurrentFilters: (state, action: PayloadAction<Record<string, any>>) => {
      state.currentFilters = action.payload;
    },
    clearFiles: (state) => {
      state.files = [];
      state.currentQuery = '';
      state.currentFilters = {};
      state.error = null;
      state.searchError = null;
    },
    setFetchCount: (state, action: PayloadAction<number>) => {
      state.fetchCount = action.payload;
    },
  },
});

export const {
  setFiles,
  replaceFileByField,
  removeFile,
  setLoading,
  setError,
  setSearchError,
  setCurrentQuery,
  setCurrentFilters,
  clearFiles,
  setFetchCount,
} = filesSlice.actions;

export default filesSlice.reducer;
