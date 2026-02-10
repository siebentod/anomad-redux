import { cn } from 'src/shared/lib/cn';
import { formatDate, parseISODate } from 'src/shared/lib/utils';
import { useDragNDrop } from '../hooks/use-drag-n-drop';
import Spinner from 'src/shared/ui/Spinner';
import type { File } from 'src/shared/types';
import type { Highlight } from '../types';

interface TableRowProps {
  fullTableMode: boolean;
  file: File;
  isHighlighted: boolean;
  isMissing: boolean;
  isLoading: boolean;
  onContextMenu: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onRowClick: (e: React.MouseEvent) => void;
  isHidden: boolean;
  hideBook: (title: string) => void;
  onSearchFile?: (file: File) => void;
  COLUMNS: { key: string; label: string }[];
  lastElementRef?: React.RefObject<HTMLTableRowElement | null>;
}

const TableRow = ({
  fullTableMode,
  file,
  isHighlighted,
  isMissing,
  isLoading,
  onContextMenu,
  onRowClick,
  isHidden,
  hideBook,
  onSearchFile,
  COLUMNS,
  lastElementRef,
}: TableRowProps) => {
  const { handleDragStart, handleDragEnd } = useDragNDrop();
  const highlightsCount = file.highlights?.length;
  const annotations =
    file.highlights?.reduce((acc: number, highlight: Highlight) => {
      if (highlight.highlight_type === 'annotation') {
        return acc + 1;
      }
      return acc;
    }, 0) || 0;

  return (
    <tr
      ref={lastElementRef}
      draggable
      onDragStart={(e) => handleDragStart(e, file)}
      onDragEnd={handleDragEnd}
      className={cn(
        'transition duration-150 ease-in-out cursor-pointer',
        isHighlighted && 'bg-dark-green',
        isMissing && 'bg-dark-red'
      )}
      onClick={(e) => onRowClick(e)}
      data-file-title={file.title}
      onContextMenu={onContextMenu}
    >
      {COLUMNS.map((col) => (
        <td
          key={col.key}
          className={cn(
            'py-1 px-1 text-sm text-text-primary truncate',
            col.key === 'title' && 'max-w-96'
          )}
        >
          {col.key === 'status' ? (
            <>
              {isHidden ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    hideBook(file.title);
                  }}
                >
                  🙈
                </button>
              ) : (
                ''
              )}
              {file.is_locked ? '🔒' : ''}
              {file.extension !== 'pdf' && file.extension}
              {isLoading ? <Spinner size="xs" inline /> : ''}
              {file.isFromLists ? <span className ="text-blue-500">{highlightsCount}</span> : highlightsCount}
              <span className="text-red-400">{annotations || ''}</span>
              {!fullTableMode && !isLoading && (!file.highlights || file.isFromLists) && onSearchFile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSearchFile(file);
                  }}
                  className="ml-1 text-blue-400 hover:text-blue-500"
                  title="Поиск файла"
                >
                  🔍
                </button>
              )}
            </>
          ) : col.key === 'modified_date' ? (
            formatDate(parseISODate(file.modified_date || ''))
          ) : (
            <span title={file.full_path}>
              {String(file[col.key as keyof typeof file] || '')}
            </span>
          )}
        </td>
      ))}
    </tr>
  );
};

export default TableRow;
