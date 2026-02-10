import { formatDate, parsePDFDate, getDateKey } from 'src/shared/lib/utils';
import { useAppSelector } from 'src/redux';
import { selectFiles } from 'src/redux/files/filesSelectors';
import type { FilterState, ProcessedHighlight, GroupedHighlightItem } from '../types';
import type { Highlight } from 'src/sections/books-section/types';

export function useHighlights(filters: FilterState, visibleHighlightsCount: number) {
  const data = useAppSelector(selectFiles);
  const resultHighlights: ProcessedHighlight[] = data.length
    ? data
        .flatMap(
          (file) =>
            file.highlights?.map((highlight: Highlight) => ({
              page: highlight.page,
              highlighted_text: highlight.highlighted_text,
              annotation_text: highlight.annotation_text,
              date: highlight.date, // оригинальная дата
              timestamp: parsePDFDate(highlight.date || ''), // обработанная дата
              fileName: file.title,
              full_path: file.full_path,
              color: highlight.color,
            } as ProcessedHighlight)) || []
        )
        .sort((a, b) => b.timestamp - a.timestamp)
    : [];

  // Фильтрация
  const filteredAll: ProcessedHighlight[] = resultHighlights.filter((h) => {
    const matchesAnnotationFilter =
      !filters.showOnlyAnnotated || Boolean(h.annotation_text);
    const matchesSearch =
      filters.searchText === '' ||
      (h.highlighted_text &&
        h.highlighted_text.toLowerCase().includes(filters.searchText.toLowerCase())) ||
      (h.annotation_text &&
        h.annotation_text.toLowerCase().includes(filters.searchText.toLowerCase()));
    const matchesBook = !filters.selectedBook || h.fileName === filters.selectedBook;
    const matchesExclusion = !filters.hiddenBooks.includes(h.fileName);
    return (
      matchesAnnotationFilter &&
      matchesSearch &&
      matchesBook &&
      matchesExclusion
    );
  });

  const visibleHighlights: ProcessedHighlight[] = filteredAll.slice(0, visibleHighlightsCount);

  // Группировка
  const dateMap = new Map();
  const dateOrder: string[] = [];

  visibleHighlights.forEach((highlight: ProcessedHighlight) => {
    const dateKey = getDateKey(highlight.timestamp);
    const fileName = highlight.fileName || 'Без названия';

    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {
        date: formatDate(highlight.timestamp),
        files: new Map(),
        fileOrder: [],
      });
      dateOrder.push(dateKey);
    }

    const dateEntry = dateMap.get(dateKey);

    if (!dateEntry.files.has(fileName)) {
      dateEntry.files.set(fileName, []);
      dateEntry.fileOrder.push(fileName);
    }

    dateEntry.files.get(fileName).push(highlight);
  });

  const groupedHighlights: GroupedHighlightItem[] = [];
  dateOrder.forEach((dateKey: string) => {
    const dateEntry = dateMap.get(dateKey);
    groupedHighlights.push({ type: 'date-header', date: dateEntry.date });

    if (filters.selectedBook) {
      dateEntry.fileOrder.forEach((fileName: string) => {
        const highlightsForFile = dateEntry.files.get(fileName) || [];
        highlightsForFile.forEach((h: ProcessedHighlight) =>
          groupedHighlights.push({ type: 'highlight', data: h })
        );
      });
    } else {
      dateEntry.fileOrder.forEach((fileName: string) => {
        groupedHighlights.push({ type: 'file-header', fileName });
        const highlightsForFile = dateEntry.files.get(fileName) || [];
        highlightsForFile.forEach((h: ProcessedHighlight) =>
          groupedHighlights.push({ type: 'highlight', data: h })
        );
      });
    }
  });

  return {
    groupedHighlights,
    totalFiltered: filteredAll.length,
  };
}
