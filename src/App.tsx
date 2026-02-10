import Split from 'react-split';
import { Toaster } from 'react-hot-toast';
import BooksSection from 'src/sections/books-section';
import HighlightsSection from 'src/sections/highlights-section';
import { useAppSelector } from 'src/redux';
import { selectIsSettingsLoaded } from 'src/redux/settings/settingsSelectors';
import ModalsContainer from 'src/sections/modals';
import Tabs from 'src/sections/tabs';
import SearchPanel from 'src/sections/search-panel';
import { useViewFilterContext } from 'src/shared/providers/view-filter-provider';
import { ViewFilterProvider } from 'src/shared/providers/view-filter-provider';
import { ModalProvider } from 'src/sections/modals/modalContext';

function App() {
  const isSettingsLoaded = useAppSelector(selectIsSettingsLoaded);

  const { activeMode } = useViewFilterContext();

  if (!isSettingsLoaded) return <div>Загрузка...</div>;

  return (
    <>
      <div className="mx-auto p-8 relative">
        <SearchPanel />

        <div className="mt-8">
          <div className="overflow-x-auto">
            <Tabs />

            {activeMode === 'highlights' ? (
              <Split
                className="flex max-h-[75dvh] bg-surface"
                sizes={[50, 50]}
                minSize={200}
                gutterSize={8}
                direction="horizontal"
              >
                <BooksSection />
                <HighlightsSection />
              </Split>
            ) : (
              <BooksSection />
            )}
          </div>
        </div>
      </div>

      <ModalsContainer />

      <Toaster
        position="top-center"
        gutter={12}
        containerStyle={{ margin: '8px' }}
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: '14px',
            maxWidth: '500px',
            padding: '4px 8px',
            backgroundColor: '#005AE1',
            color: 'white',
          },
        }}
      />
    </>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider>
      <ViewFilterProvider>
        {children}
      </ViewFilterProvider>
    </ModalProvider>
  );
}

function AppWithProviders() {
  return (
    <Providers>
      <App />
    </Providers>
  );
}

export default AppWithProviders;
