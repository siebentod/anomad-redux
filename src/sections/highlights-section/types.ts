import type { Highlight } from '../books-section/types';

// Обработанный highlight для отображения
export interface ProcessedHighlight {
  page: number;
  highlighted_text: string;
  annotation_text?: string;
  date?: string;
  timestamp: number; // обработанная дата для сортировки
  fileName: string;
  full_path: string;
  color?: number[];
}

// Элементы для группировки в списке highlights
export type GroupedHighlightItem =
  | { type: 'date-header'; date: string }
  | { type: 'file-header'; fileName: string }
  | { type: 'highlight'; data: ProcessedHighlight };

// Пропсы для компонентов
export interface HighlightItemProps {
  highlight: ProcessedHighlight;
  onClick: (highlight: ProcessedHighlight) => void;
}

export interface HighlightsListProps {
  groupedHighlights: GroupedHighlightItem[];
  visibleHighlightsCount: number;
  totalFiltered: number;
  renderItem: (item: GroupedHighlightItem, index: number) => React.ReactNode;
  setVisibleHighlightsCount: React.Dispatch<React.SetStateAction<number>>;
}

export interface DateHeaderProps {
  date: string;
  index: number;
}

export interface BookHeaderProps {
  fileName: string;
  index: number;
  onHideBook: (fileName: string) => void;
  onSelectBook: (fileName: string) => void;
}

export interface SelectedBookChipProps {
  bookName: string;
  onRemove: () => void;
}

export interface FilterControlsProps {
  showOnlyAnnotated: boolean;
  searchText: string;
  onToggleAnnotated: () => void;
  onSearchChange: (text: string) => void;
}

export interface FilterState {
  searchText: string;
  selectedBook: string | null;
  hiddenBooks: string[];
  showOnlyAnnotated: boolean;
}