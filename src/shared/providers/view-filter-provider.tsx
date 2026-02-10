import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
} from 'react';
import { useAppDispatch } from 'src/redux';
import { setFetchCount, setLoading } from 'src/redux/files/filesSlice';
import { useViewFilter } from 'src/shared/hooks/use-view-filter';
import { DEFAULT_FETCH_COUNT } from 'src/redux/files/config';

interface ViewFilterContextType {
  selectedBook: string | null;
  hiddenBooks: string[];
  selectBook: (fileName: string) => void;
  removeBookFilter: () => void;
  hideBook: (fileName: string) => void;
  visibleHighlightsCount: number;
  setVisibleHighlightsCount: (count: number | ((prev: number) => number)) => void;
  resetCount: () => void;
  activeProject: string;
  setActiveProject: (project: string) => void;
  showOnlyAnnotated: boolean;
  setShowOnlyAnnotated: (showOnlyAnnotated: boolean) => void;
  activeMode: 'highlights' | 'no-highlights';
  setActiveMode: (mode: 'highlights' | 'no-highlights') => void;
}

const ViewFilterContext = createContext<ViewFilterContextType | null>(null);

interface ViewFilterProviderProps {
  children: ReactNode;
}

export function ViewFilterProvider({ children }: ViewFilterProviderProps) {
  const dispatch = useAppDispatch();
  const [visibleHighlightsCount, setVisibleHighlightsCount] = useState<number>(50);
  const [activeProject, setActiveProjectState] = useState('');
  const [activeMode, setActiveMode] = useState<'highlights' | 'no-highlights'>(
    'highlights'
  );
  const [showOnlyAnnotated, setShowOnlyAnnotated] = useState<boolean>(false);

  const resetCount = useCallback(() => {
    setVisibleHighlightsCount(50);
  }, []);

  const viewFilter = useViewFilter(resetCount);

  const setActiveProject = useCallback((project: string) => {
    dispatch(setLoading(true));
    dispatch(setFetchCount(DEFAULT_FETCH_COUNT));
    setActiveProjectState(project);
    viewFilter.selectBook(null);
  }, [dispatch]);

  const contextValue = {
    ...viewFilter,
    visibleHighlightsCount,
    setVisibleHighlightsCount,
    resetCount,
    activeProject,
    setActiveProject,
    showOnlyAnnotated,
    setShowOnlyAnnotated,
    activeMode,
    setActiveMode,
  };

  return (
    <ViewFilterContext.Provider value={contextValue}>
      {children}
    </ViewFilterContext.Provider>
  );
}

export function useViewFilterContext() {
  const context = useContext(ViewFilterContext);
  if (!context) {
    throw new Error(
      'useViewFilterContext must be used within a ViewFilterProvider'
    );
  }
  return context;
}
