import type { RootState } from '../index';
import type { ExcludedListItem } from 'shared/types';

// Селекторы
export const selectSettings = (state: RootState) => state.settings.settings;
export const selectIsSettingsLoaded = (state: RootState) =>
  state.settings.isLoaded;
export const selectSetting = (key: string) => (state: RootState) => {
  const settings = state.settings.settings;
  return settings[key] !== undefined
    ? settings[key]
    : state.settings.defaultSettings[key];
};
export const selectTypesQuery = (state: RootState) => {
  const settings = state.settings.settings;
  const typesQuery = settings.types.join('|');
  return typesQuery ? `ext:${typesQuery}` : '';
};

export const selectExcludedList = (state: RootState) =>
  state.settings.settings.excludedList || [];

export const selectExcludedQuery = (state: RootState) => {
  const excludedList = selectExcludedList(state);
  if (!excludedList.length) return '';

  return excludedList
    .map((item) =>
      item.path ? `!path:"${item.path}"` : `!wfn:"${item.file_name}"`
    )
    .join(' ');
};

export const selectPdfReaderPath = (state: RootState) => {
  const settings = state.settings.settings;
  return settings.pdfReaderPath || state.settings.defaultSettings.pdfReaderPath;
};
