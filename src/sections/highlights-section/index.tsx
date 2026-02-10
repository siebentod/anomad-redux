import { invoke } from '@tauri-apps/api/core';
import FilterControls from './components/filter-controls';
import SelectedBookChip from './components/selected-book-chip';
import HighlightsList from './components/highlights-list';
import HighlightItem from './components/highlight-item';
import DateHeader from './components/date-header';
import BookHeader from './components/book-header';
import Spinner from 'src/shared/ui/Spinner';
import { useCallback, useState } from 'react';
import { useHighlights } from './hooks/use-highlights';
import { selectIsLoading } from 'src/redux/files/filesSelectors';
import { useAppSelector } from 'src/redux';
import { useViewFilterContext } from 'src/shared/providers/view-filter-provider';
import { selectPdfReaderPath } from 'src/redux/settings/settingsSelectors';
import type { ProcessedHighlight } from './types';
import toast from 'react-hot-toast';

interface OpenFileResult {
  success: boolean;
  path: string;
}

export default function HighlightsFeed() {
  const {
    selectedBook,
    hiddenBooks,
    removeBookFilter,
    visibleHighlightsCount,
    setVisibleHighlightsCount,
    resetCount,
    selectBook,
    hideBook,
  } = useViewFilterContext();
  const [searchText, setSearchText] = useState<string>('');
  const [showOnlyAnnotated, setShowOnlyAnnotated] = useState<boolean>(false);
  const isLoading = useAppSelector(selectIsLoading);
  const programPath = useAppSelector(selectPdfReaderPath);

  const toggleShowOnlyAnnotated = useCallback(() => {
    setShowOnlyAnnotated((prev) => {
      resetCount();
      const next = !prev;
      return next;
    });
  }, [resetCount]);

  const filters = { selectedBook, hiddenBooks, searchText, showOnlyAnnotated };

  const { groupedHighlights, totalFiltered } = useHighlights(
    filters,
    visibleHighlightsCount
  );

  const handleOpenHighlight = async (highlight: ProcessedHighlight) => {
    const result = await invoke('open_file', {
      params: {
        path: highlight.full_path,
        page: highlight.page,
        ...(programPath ? {program_path: programPath} : {}),
      },
    });
    if (!(result as OpenFileResult).success) {
      toast.error(`Не удалось открыть приложение ${programPath} Открываю в ${(result as OpenFileResult).path === 'explorer' ? 'приложении по умолчанию' : (result as OpenFileResult).path}...`);
    }
  };

  return (
    <div className="overflow-y-auto border border-t-0 border-border-dark">
      <div className="bg-surface">
        {selectedBook && (
          <SelectedBookChip
            bookName={selectedBook}
            onRemove={removeBookFilter}
          />
        )}

        <FilterControls
          showOnlyAnnotated={showOnlyAnnotated}
          searchText={searchText}
          onToggleAnnotated={toggleShowOnlyAnnotated}
          onSearchChange={setSearchText}
        />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <HighlightsList
            groupedHighlights={groupedHighlights}
            visibleHighlightsCount={visibleHighlightsCount}
            totalFiltered={totalFiltered}
            setVisibleHighlightsCount={setVisibleHighlightsCount}
            renderItem={(item, index) =>
              item.type === 'date-header' ? (
                <DateHeader
                  key={`date-${index}`}
                  date={item.date}
                  index={index}
                />
              ) : item.type === 'file-header' ? (
                <BookHeader
                  key={`file-${index}`}
                  fileName={item.fileName}
                  index={index}
                  onHideBook={hideBook}
                  onSelectBook={selectBook}
                />
              ) : (
                <HighlightItem
                  key={`highlight-${index}`}
                  highlight={item.data}
                  onClick={handleOpenHighlight}
                />
              )
            }
          />
        )}
      </div>
    </div>
  );
}
