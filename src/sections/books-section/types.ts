import type { File } from 'src/shared/types';

export interface Highlight {
  page: number;
  highlighted_text: string;
  annotation_text?: string;
  date?: string;
  highlight_type: string;
  color?: number[];
}

// Расширяем базовый тип File для добавления highlights
export interface FileWithHighlights extends File {
  highlights?: Highlight[];
  isFromLists?: boolean;
}

export interface TableColumn {
  key: string;
  label: string;
  editable?: boolean;
  sortable?: boolean;
}

export interface TableHeaderProps {
  columns: TableColumn[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
  getSortIcon: (column: string) => string;
}

export interface TableBodyProps {
  files: File[];
  renderRows: (file: File, index: number) => React.ReactNode;
}
export interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  className?: string;
}
