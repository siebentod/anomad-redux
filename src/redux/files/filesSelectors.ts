import type { RootState } from '../index';

export const selectFiles = (state: RootState) => state.files.files;
export const selectIsLoading = (state: RootState) => state.files.isLoading;
export const selectError = (state: RootState) => state.files.error;
export const selectSearchError = (state: RootState) => state.files.searchError;
export const selectLastSearchTime = (state: RootState) => state.files.lastSearchTime;
export const selectFetchCount = (state: RootState) => state.files.fetchCount;
