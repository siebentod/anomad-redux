import type { SelectedBookChipProps } from '../types';

export default function SelectedBookChip({
  bookName,
  onRemove,
}: SelectedBookChipProps) {
  return (
    <div className="px-3 py-2 flex flex-wrap gap-2 items-center">
      <div
        className="flex items-center bg-gray-700 rounded px-2 py-1 text-sm text-gray-200 cursor-pointer"
        onClick={onRemove}
      >
        <span className="max-w-[200px] truncate" title={bookName}>
          {bookName}
        </span>
        <button
          className="ml-1 text-gray-400"
          aria-label="Удалить фильтр по книге"
        >
          ×
        </button>
      </div>
    </div>
  );
}
