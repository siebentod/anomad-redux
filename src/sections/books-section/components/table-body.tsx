import type { TableBodyProps } from '../types';

const TableBody = ({
  files,
  renderRows,
}: TableBodyProps) => {
  if (files.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={7} className="text-center py-6 text-gray-500 text-lg">
            Файлы не найдены.
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-border-dark">
      {files.map((file, index) => renderRows(file, index))}
    </tbody>
  );
};

export default TableBody;
