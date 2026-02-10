import React from 'react';
import type { TableHeaderProps, TableColumn } from '../types';
import { cn } from 'src/shared/lib/cn';

const TableHeader: React.FC<TableHeaderProps> = ({
  columns,
  onSort,
  getSortIcon,
}) => {
  return (
    <thead className="">
      <tr className="text-left text-sm text-text-secondary uppercase tracking-wider border-b border-border-dark">
        {columns.map((col: TableColumn) => (
          <th
            key={col.key}
            className={cn("py-2 px-1 transition duration-150 whitespace-nowrap", col.sortable && "cursor-pointer")}
            onClick={() => onSort(col.key)}
          >
            {col.label} {getSortIcon(col.key)}
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default TableHeader;
