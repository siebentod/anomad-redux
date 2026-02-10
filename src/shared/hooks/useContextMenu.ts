import { Menu, Submenu } from '@tauri-apps/api/menu';
import { invoke } from '@tauri-apps/api/core';
import toast from 'react-hot-toast';
import { store } from 'src/redux';
import { useAppSelector, useAppDispatch } from 'src/redux';
import { useModalContext } from 'src/sections/modals/modalContext';
import {
  addToList,
  loadLists,
  removeFromList,
  setList,
  updateFileInAllLists,
} from 'src/redux/lists/listsSlice';
import {
  addToExcluded,
  addToExcludedPath,
} from 'src/redux/settings/settingsSlice';
import { selectLists, selectList } from 'src/redux/lists/listsSelectors';
import {
  selectTypesQuery,
  selectExcludedQuery,
} from 'src/redux/settings/settingsSelectors';
import { replaceFileByField, removeFile } from 'src/redux/files/filesSlice';
import type { File, List } from 'src/shared/types';

interface ContextMenuItem {
  id: string;
  text: string;
  showCondition: boolean;
  action: () => Promise<void>;
}

type MenuItem = ContextMenuItem | Submenu;

function processDateToEverythingQuery(isoString: string): string {
  const date = new Date(isoString);

  // Добавляем 3 часа к UTC времени
  date.setUTCHours(date.getUTCHours() + 3);

  // Получаем компоненты даты и времени в формате UTC после добавления 3 часов
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

async function searchFileByField(file: File, field: string): Promise<any> {
  const state = store.getState();
  const typesQuery = selectTypesQuery(state);
  const excludedQuery = selectExcludedQuery(state);
  const query = `${typesQuery} ${excludedQuery}`;
  const resultArr = (await invoke('get_everything', {
    params: { query },
  })) as any[];
  const result = resultArr.find((f) => f[field] === file[field]);
  return result;
}

async function tryToFindFile(file: File): Promise<any> {
  let result: any;

  // Первая попытка: frn
  result = (await invoke('get_everything_with_meta', {
    params: { query: `frn:"${file.id}"` },
  })) as any[];
  if (result?.length === 1) return result[0];
  if (result?.length > 1) {
    toast.error('Найдено более одного файла по frn');
    return;
  }

  // Вторая попытка: dc
  const formattedDate = processDateToEverythingQuery(file.created_date || '');
  result = (await invoke('get_everything_with_meta', {
    params: { query: `dc:"${formattedDate}"` },
  })) as any[];
  if (result?.length === 1) return result[0];
  if (result?.length > 1) {
    toast.error('Найдено более одного файла по дате создания');
    return;
  }

  // Третья попытка: поиск на фронте
  result = await searchFileByField(file, 'pdf_creator');
  if (result) return result;
  if (Array.isArray(result) && result.length > 1) {
    toast.error('Найдено более одного файла при альтернативном поиске');
    return;
  }

  toast.error('Файл не найден ни одним способом');
  return;
}

const confirm = async (message: string): Promise<boolean> => {
  return window.confirm(message);
};

export const useContextMenu = () => {
  const dispatch = useAppDispatch();
  const lists = useAppSelector(selectLists);
  const modalContext = useModalContext();

  const showFileContextMenu = async ({
    file,
    activeProject,
  }: {
    file: File;
    activeProject: string | null;
  }) => {
    const listsKeys = lists.map((l: List) => l.name);

    const listsSubmenu: Submenu = await Submenu.new({
      text: 'Добавить в список',
      items: listsKeys.map((list: string) => ({
        id: list,
        text: list,
        action: async () => {
          try {
            const result = await invoke('set_metadata', {
              filePath: file.full_path,
            });
            if (result) {
              dispatch(
                addToList({
                  listName: list,
                  itemData: { ...file, pdf_creator: result },
                })
              );
              toast.success(`Файл добавлен в список ${list}`);
            } else {
              toast.error('Ошибка добавления файла в список');
            }
          } catch (error) {
            console.error('Ошибка добавления файла в список:', error);
            toast.error(`Ошибка добавления файла в список: ${error}`);
          }
        },
      })),
    });

    const allItems: MenuItem[] = [
      {
        id: 'show_in_explorer',
        text: 'Показать в проводнике',
        showCondition: true,
        action: async () => {
          try {
            await invoke('show_in_explorer', { path: file.full_path });
          } catch (error) {
            console.error('Ошибка показа в проводнике:', error);
          }
        },
      },
      {
        id: 'delete_file',
        text: 'Удалить файл',
        showCondition: true,
        action: async () => {
          try {
            const confirmed = await confirm(
              'Вы уверены, что хотите удалить этот файл?'
            );
            if (confirmed) {
              await invoke('delete_file', { path: file.full_path });
              dispatch(removeFile(file.file_name));
            }
          } catch (error) {
            console.error('Ошибка удаления файла:', error);
          }
        },
      },
      {
        id: 'open_with',
        text: 'Скрыть',
        showCondition: !activeProject,
        action: async () => {
          try {
            dispatch(addToExcluded(file));
            dispatch(removeFile(file.file_name));
          } catch (error) {
            console.error('Ошибка открытия файла:', error);
          }
        },
      },
      {
        id: 'hide_folder',
        text: 'Скрыть папку',
        showCondition: !activeProject,
        action: async () => {
          try {
            const folderPath = file.full_path
              .split('\\')
              .slice(0, -1)
              .join('\\');
            dispatch(addToExcludedPath(folderPath));
            await dispatch(loadLists());
            toast.success(`Папка успешно скрыта`);
          } catch (error) {
            console.error('Ошибка открытия файла:', error);
            toast.error(`Ошибка при скрытии папки: ${error}`);
          }
        },
      },
      {
        id: 'meta',
        text: 'Set Metadata',
        showCondition: true,
        action: async () => {
          try {
            const result = await invoke('set_metadata', {
              filePath: file.full_path,
            });
            if (result) {
              toast.success(`Метаданные обновлены`);
            } else {
              toast.error('Ошибка обновления метаданных');
            }
          } catch (error) {
            console.error('Ошибка открытия файла:', error);
            toast.error(`Ошибка открытия файла: ${error}`);
          }
        },
      },
      {
        id: 'Попытаться найти файл',
        text: 'Попытаться найти файл',
        showCondition: true,
        action: async () => {
          try {
            const updatedFile = await tryToFindFile(file);
            if (!updatedFile?.title) {
              toast.error('Файл не найден');
              return;
            }
            dispatch(updateFileInAllLists({ file: updatedFile, field: 'id' }));
            dispatch(replaceFileByField({ file: updatedFile, field: 'id' }));
            toast.success('Имя успешно обновлено.');
          } catch (error) {
            toast.error('Ошибка поиска.');
            console.error('Ошибка поиска:', error);
          }
        },
      },
      {
        id: 'rename_file',
        text: 'Переименовать',
        showCondition: true,
        action: async () => {
          modalContext.open('rename', file);
        },
      },
      {
        id: 'Удалить из списка',
        text: 'Удалить из списка',
        showCondition: !!activeProject,
        action: async () => {
          try {
            dispatch(
              removeFromList({
                listName: activeProject!,
                fileName: file.file_name,
              })
            );
          } catch (error) {
            console.error('Ошибка открытия файла:', error);
          }
        },
      },
      listsSubmenu,
    ];

    try {
      const menu = await Menu.new({
        items: [
          ...allItems.filter((item): item is ContextMenuItem => 'showCondition' in item && item.showCondition !== false),
          listsSubmenu,
        ],
      });

      await menu.popup();
    } catch (error) {
      console.error('Ошибка создания контекстного меню:', error);
    }
  };

  return { showFileContextMenu };
};
