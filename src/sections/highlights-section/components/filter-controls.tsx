import Checkbox from 'src/shared/ui/Checkbox';
import type { FilterControlsProps } from '../types';

export default function FilterControls({
  showOnlyAnnotated,
  searchText,
  onToggleAnnotated,
  onSearchChange,
}: FilterControlsProps) {
  return (
    <div className="px-3 py-2 flex items-center space-x-3">
      <Checkbox
        checked={showOnlyAnnotated}
        onChange={() => onToggleAnnotated()}
        aria-label="Только аннотации"
      />
      <div className="flex flex-col flex-shrink-0">
        <div className="text-sm font-medium text-text-secondary">Только аннотации</div>
      </div>
      <input
        type="text"
        placeholder="Search..."
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 min-w-0 px-2 py-1 bg-input-dark border border-border-light rounded text-sm text-text-secondary placeholder-text-muted focus:outline-none"
      />
    </div>
  );
}