import React, { useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useContextMenu } from 'src/shared/hooks/useContextMenu';
import { useIntersectionObserver } from 'src/shared/hooks/useIntersectionObserver';
import { useAppDispatch } from 'src/redux';
import { selectFiles, selectFetchCount } from 'src/redux/files/filesSelectors';
import { selectIsLoading } from 'src/redux/files/filesSelectors';
import { setFetchCount } from 'src/redux/files/filesSlice';
import { DEFAULT_FETCH_COUNT } from 'src/redux/files/config';
import { selectLists } from 'src/redux/lists/listsSelectors';

import { useTableSort } from './hooks/use-table-sort';
import TableHeader from './components/table-header';
import TableBody from './components/table-body';
import TableRow from './components/table-row';

import type { File } from 'src/shared/types';
import type { TableColumn } from './types';
import { useViewFilterContext } from 'src/shared/providers/view-filter-provider';
import { mergeProjectFilesWithHighlights } from './utils';
import { setLoading, replaceFileByField } from 'src/redux/files/filesSlice';
import { updateFileInAllLists } from 'src/redux/lists/listsSlice';
import {
  searchFiles,
  buildIncludeQuery,
} from 'src/sections/search-panel/hooks/searchUtils';
import { useAppSelector } from 'src/redux';
import {
  selectTypesQuery,
  selectExcludedQuery,
  selectPdfReaderPath,
} from 'src/redux/settings/settingsSelectors';
import toast from 'react-hot-toast';
import type { List } from 'src/shared/types';

interface OpenFileResult {
  success: boolean;
  path: string;
}

const COLUMNS: TableColumn[] = [
  { key: 'status', label: '', editable: true, sortable: false },
  { key: 'title', label: 'Название', editable: true, sortable: false },
  { key: 'modified_date', label: 'Дата-М', sortable: false },
];

function Table() {
  const dispatch = useAppDispatch();
  const { selectBook, hiddenBooks, hideBook, activeProject, activeMode } =
    useViewFilterContext();
  const { showFileContextMenu } = useContextMenu();
  const fetchCount = useAppSelector(selectFetchCount);
  const typesQuery = useAppSelector(selectTypesQuery);
  const excludedQuery = useAppSelector(selectExcludedQuery);
  const programPath = useAppSelector(selectPdfReaderPath);

  const lastElementRef = useIntersectionObserver<HTMLTableRowElement>(
    () => {
      if (isLoading) return;
      dispatch(setLoading(true));
      dispatch(setFetchCount(fetchCount + DEFAULT_FETCH_COUNT));
    },
    { threshold: 0.1, triggerOnce: true }
  );

  const lists = useAppSelector(selectLists);
  const everythingFiles = useAppSelector(selectFiles);
  const isLoading = useAppSelector(selectIsLoading);
  const files = useMemo(() => {
    if (!activeProject) return everythingFiles;
    const projectItems =
      (lists?.find((list: List) => list.name === activeProject)
        ?.items as File[]) || [];
    return mergeProjectFilesWithHighlights(projectItems, everythingFiles);
  }, [activeProject, lists, everythingFiles]);

  const filesFromLists = useMemo(() => {
    return lists.flatMap((l: List) => l.items) as File[];
  }, [lists]);

  const defaultSort = activeProject ? 'modified_date' : null;
  const { sortColumn, sortDirection, sortedFiles, getSortIcon, handleSort } =
    useTableSort(files, defaultSort);

  const handleFileContextMenu = (file: File) => {
    showFileContextMenu({ file, activeProject });
  };

  const handleRowClick = async (event: React.MouseEvent, file: File) => {
    if (event.ctrlKey) {
      const result = await invoke('open_file', {
        params: {
          path: file.full_path,
          ...(programPath ? { program_path: programPath } : {}),
        },
      });

      if (!(result as OpenFileResult).success) {
        toast.error(
          `Не удалось открыть приложение ${programPath} Открываю в ${
            (result as OpenFileResult).path === 'explorer'
              ? 'приложении по умолчанию'
              : (result as OpenFileResult).path
          }...`
        );
      }
    } else {
      selectBook(file.title);
    }
  };

  const handleSearchFile = async (file: File) => {
    try {
      dispatch(setLoading(true));

      const includeQuery = buildIncludeQuery([file.file_name]);
      const query = `${typesQuery} ${excludedQuery} ${includeQuery}`.trim();

      const { files: result } = await searchFiles({
        query,
        includeHighlights: true,
        count: 1,
      });

      if (result.length > 0) {
        const updatedFile = result[0];
        // Обновляем файл с хайлайтами во всех списках
        dispatch(updateFileInAllLists({ file: updatedFile }));
        // Также обновляем в files store
        dispatch(
          replaceFileByField({
            file: updatedFile,
          })
        );
      }
    } catch (err) {
      console.error('Error searching file:', err);
      toast.error(`Ошибка поиска файла: ${err}`);
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (!sortedFiles) return null;

  return (
    <div className="max-h-[calc(100vh-150px)] overflow-y-auto border border-t-0 border-border-dark">
      <table className="min-w-full bg-surface">
        <TableHeader
          columns={COLUMNS}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          getSortIcon={getSortIcon}
        />
        <TableBody
          files={sortedFiles}
          renderRows={(file, index) => {
            const isHidden = hiddenBooks.includes(file.title);
            const isMissing =
              !isLoading &&
              Boolean(activeProject) &&
              !everythingFiles.some((f) => f.full_path === file.full_path);
            const isHighlighted =
              !activeProject &&
              filesFromLists.some((f) => f.full_path === file.full_path);
            const isLastItem = Boolean(
              sortedFiles && index === sortedFiles.length - 1
            );
            return (
              <TableRow
                key={`${file.full_path}`}
                COLUMNS={COLUMNS}
                file={file}
                isHighlighted={isHighlighted}
                isHidden={isHidden}
                isMissing={isMissing}
                isLoading={isLoading}
                fullTableMode={activeMode !== 'highlights'}
                onContextMenu={() => handleFileContextMenu(file)}
                onRowClick={(e: React.MouseEvent) => handleRowClick(e, file)}
                onSearchFile={handleSearchFile}
                hideBook={hideBook}
                lastElementRef={
                  isLastItem && !activeProject && !isLoading
                    ? lastElementRef
                    : undefined
                }
              />
            );
          }}
        />
      </table>
    </div>
  );
}

export default Table;
