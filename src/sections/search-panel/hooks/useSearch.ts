import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAppSelector, useAppDispatch } from 'src/redux';
import { store } from 'src/redux';
import {
  selectIsSettingsLoaded,
  selectTypesQuery,
} from 'src/redux/settings/settingsSelectors';
import {
  selectLists,
  selectIsListsLoaded,
  selectFileByFullPath,
} from 'src/redux/lists/listsSelectors';
import { selectExcludedQuery } from 'src/redux/settings/settingsSelectors';
import { setFiles, setLoading } from 'src/redux/files/filesSlice';
import { selectFetchCount } from 'src/redux/files/filesSelectors';
import { DEFAULT_FETCH_COUNT } from 'src/redux/files/config';
import { selectList } from 'src/redux/lists/listsSelectors';
import {
  searchFiles,
  buildSearchQuery,
  buildIncludeQuery,
} from './searchUtils';

export function useSearch(activeProject: string, activeMode: string) {
  const dispatch = useAppDispatch();
  const isSettingsLoaded = useAppSelector(selectIsSettingsLoaded);
  const typesQuery = useAppSelector(selectTypesQuery);
  const isListsLoaded = useAppSelector(selectIsListsLoaded);
  const excludedQuery = useAppSelector(selectExcludedQuery);
  const fetchCount = useAppSelector(selectFetchCount);
  const currentActiveListItems = useAppSelector(selectList(activeProject));

  const [search, setSearch] = useState('');
  const searchRequestIdRef = useRef(0);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(async () => {
    if (!isSettingsLoaded || !isListsLoaded) return;

    // Увеличиваем ID запроса, чтобы игнорировать результаты старых запросов
    const currentRequestId = ++searchRequestIdRef.current;

    try {
      dispatch(setLoading(true));
      // Получаем актуальный список на момент выполнения
      const currentActiveList = !activeProject ? null : currentActiveListItems;

      if (currentActiveList && currentActiveList.length === 0) {
        dispatch(setFiles([]));
        return;
      }

      const filePaths =
        currentActiveList?.map((item: any) => item.full_path) || [];
      const includeQuery = buildIncludeQuery(filePaths);
      const query = buildSearchQuery({
        search,
        typesQuery,
        excludedQuery,
        includeQuery,
      });

      const includeHighlights =
        activeMode === 'highlights' && fetchCount <= DEFAULT_FETCH_COUNT
          ? true
          : false;

      const { files: result } = await searchFiles({
        query,
        includeHighlights,
        count: fetchCount,
      });

      // Проверяем, не устарел ли этот запрос
      if (currentRequestId !== searchRequestIdRef.current) {
        console.log(
          'Игнорируем результат устаревшего запроса',
          currentRequestId,
          searchRequestIdRef.current
        );
        return;
      }

      console.log('result', result);
      const processedResult = result.map((file: any) => {
        if (!file.highlights) {
          // Эта хрень нужна потому что мы в асинхронной функции
          const fileFromLists = selectFileByFullPath(file.full_path)(
            store.getState()
          );
          return fileFromLists ? { isFromLists: true, ...fileFromLists } : file;
        }
        return file;
      });
      console.log('processedResult', processedResult);

      dispatch(setFiles(processedResult as any));
    } catch (err) {
      // Игнорируем ошибки устаревших запросов
      if (currentRequestId !== searchRequestIdRef.current) {
        console.log('Игнорируем ошибку устаревшего запроса');
        return;
      }
      console.error('Error choosing folder or reading files:', err);
      toast.error(`Ошибка: ${err}`);
    } finally {
      dispatch(setLoading(false));
    }
  }, [
    isSettingsLoaded,
    isListsLoaded,
    excludedQuery,
    typesQuery,
    search,
    dispatch,
    activeProject,
    activeMode,
    fetchCount,
  ]);

  useEffect(() => {
    // Очищаем предыдущий таймаут
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (isListsLoaded && isSettingsLoaded) {
      // Добавляем небольшую задержку, чтобы избежать множественных вызовов
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch();
      }, 100);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [activeProject, handleSearch, isListsLoaded, isSettingsLoaded]);

  return {
    search,
    setSearch,
    handleSearch,
  };
}
