import { useState, useMemo } from 'react';
import type { File } from 'src/shared/types';

export const useTableSort = (files: File[], defaultSort: string | null) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedFiles = useMemo(() => {
    const sort = defaultSort || sortColumn;
    if (!sort) {
      return files;
    }

    return [...files].sort((a, b) => {
      let valA = a[sort as keyof File];
      let valB = b[sort as keyof File];

      valA =
        valA === null || valA === undefined
          ? ''
          : Array.isArray(valA)
          ? valA.join(', ').toLowerCase()
          : String(valA).toLowerCase();
      valB =
        valB === null || valB === undefined
          ? ''
          : Array.isArray(valB)
          ? valB.join(', ').toLowerCase()
          : String(valB).toLowerCase();

      if (valA < valB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [files, sortColumn, sortDirection, defaultSort]);

  const getSortIcon = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? '▲' : '▼';
    }
    if (!sortColumn && column === 'modified_date') return '▼';
    return '';
  };

  const handleSort = (column: string) => {
    setSortColumn((prevColumn) => {
      if (prevColumn === column) {
        setSortDirection((prevDirection) =>
          prevDirection === 'asc' ? 'desc' : 'asc'
        );
        return prevColumn;
      } else {
        setSortDirection('asc');
        return column;
      }
    });
  };

  return {
    sortColumn,
    sortDirection,
    sortedFiles,
    getSortIcon,
    handleSort,
  };
};
