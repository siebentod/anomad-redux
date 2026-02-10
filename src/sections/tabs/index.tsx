import { ProjectCreator } from './components/project-creator';
import { TabsList } from './components/tabs-list';
import { TabButton } from './components/tab-button';
import { useViewFilterContext } from 'src/shared/providers/view-filter-provider';
import { useAppSelector, useAppDispatch } from 'src/redux';
import { setList } from 'src/redux/lists/listsSlice';
import { selectLists } from 'src/redux/lists/listsSelectors';
import type { List } from 'src/shared/types';

function Tabs() {
  const { activeProject, setActiveProject } = useViewFilterContext();

  const dispatch = useAppDispatch();
  const lists = useAppSelector(selectLists);

  const listsKeys = ['', ...lists.map((l: List) => l.name)];

  const tabs = listsKeys
    .sort((a, b) => {
      if (a === '') return -1;
      if (b === '') return 1;

      return a.localeCompare(b);
    })
    .map((project) => project);

  const createNewProject = async (projectName: string) => {
    if (!listsKeys.includes(projectName)) {
      dispatch(setList({ listName: projectName, value: [] }));
    }

    setActiveProject(projectName);
  };

  return (
    <div className="w-full bg-surface flex flex-col border border-border-dark">
      <div className="flex items-center">
        <ProjectCreator onCreate={createNewProject} tabsCount={tabs.length} />
        <TabsList
          tabs={tabs}
          renderTab={(tab) => (
            <TabButton
              key={tab}
              tab={tab}
              isActive={activeProject === tab}
              onClick={() => setActiveProject(tab)}
            />
          )}
        />
      </div>
    </div>
  );
}

export default Tabs;
