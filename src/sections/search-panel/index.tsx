import { useViewFilterContext } from 'src/shared/providers/view-filter-provider';
import { useModalContext } from 'src/sections/modals/modalContext';
import Input from 'src/shared/ui/Input';

import Checkbox from './components/search-checkbox';
import SearchForm from './components/search-form';
import SearchButton from './components/search-button';
import SettingsButton from './components/settings-button';
import ExcludeButton from './components/exclude-button';
import { useSearch } from './hooks/useSearch';

export default function SearchPanel() {
  const { activeProject, activeMode, setActiveMode } = useViewFilterContext();
  const { search, setSearch, handleSearch } = useSearch(
    activeProject,
    activeMode
  );
  const { open: openModal } = useModalContext();

  return (
    <>
      <SearchForm
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
      >
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          className="text-sm w-full px-4 py-1.5 h-[24px]
                bg-gray-100 rounded-lg
                border-none
                focus:outline-none focus:bg-white
                shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]"
        />
        <SearchButton onClick={handleSearch} />
        <ExcludeButton onClick={() => openModal('exclude')} />
        <Checkbox
          checked={activeMode === 'highlights'}
          onChange={(checked) =>
            setActiveMode(checked ? 'highlights' : 'no-highlights')
          }
          className=""
        />
        <SettingsButton onClick={() => openModal('settings')} />
      </SearchForm>
    </>
  );
}
