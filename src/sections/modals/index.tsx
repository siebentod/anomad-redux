import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useModalContext } from 'src/sections/modals/modalContext';
import { useAppDispatch } from 'src/redux';
import {
  addToExcludedPath,
  removeFromExcluded,
} from 'src/redux/settings/settingsSlice';
import { loadLists, updateFileInAllLists } from 'src/redux/lists/listsSlice';
import { replaceFileByField } from 'src/redux/files/filesSlice';
import SettingsModal from './settings-modal';
import ExcludeModal from './exclude-modal';
import DeleteModal from './delete-modal';
import RenameModal from './rename-modal';
import toast from 'react-hot-toast';

// Вспомогательная функция для получения данных модалки по имени
const getModalData = (
  modalContext: ReturnType<typeof useModalContext>,
  name: string
) => ({
  isOpen: modalContext.isOpen(name),
  value: modalContext.getModalValue(name),
});

export default function ModalsContainer() {
  const modalContext = useModalContext();
  const dispatch = useAppDispatch();

  // Получение данных для каждой модалки
  const settingsData = getModalData(modalContext, 'settings');
  const excludeData = getModalData(modalContext, 'exclude');
  const deleteData = getModalData(modalContext, 'delete');
  const renameData = getModalData(modalContext, 'rename');

  // Обработчик закрытия модалки
  const close = (name: string) => {
    modalContext.close(name);
  };

  // Обработчик submit для модалки настроек (пока пустой)
  const submitModalSettings = () => {
    // Логика сохранения настроек
    close('settings');
  };

  // Обработчик submit для модалки исключения пути
  const submitModalExclude = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const pathInput = form.path as HTMLInputElement;
    const path = pathInput?.value;

    if (path) {
      try {
        dispatch(addToExcludedPath(path));
        await dispatch(loadLists());
        close('exclude');
      } catch (error) {
        console.error('Ошибка открытия файла:', error);
      }
    }
  };

  // Обработчик submit для модалки удаления (пока пустой)
  const submitModalDelete = async () => {
    // Логика удаления
    // const baseName = deleteData.value?.name;
    // if (!baseName) return;
    // deleteTranslation(baseName);
    close('delete');
  };

  // Обработчик submit для модалки переименования
  const submitModalRename = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newNameInput = form.newName as HTMLInputElement;
    const inputFileName = newNameInput?.value;

    if (!renameData.value || !inputFileName) return;

    try {
      const newFileName = `${inputFileName}.${renameData.value.extension}`;

      const newPath = await invoke('edit_filename', {
        originalFullPath: renameData.value.full_path,
        newFilename: newFileName,
      });
      console.log('newPath', newPath);

      if (newPath) {
        const updatedFile = {
          ...renameData.value,
          file_name: newFileName,
          full_path: newPath,
          title: inputFileName,
        };
        console.log('updatedFile', updatedFile);

        dispatch(updateFileInAllLists({ file: updatedFile, field: 'id' }));
        dispatch(replaceFileByField({ file: updatedFile, field: 'id' }));
        toast.success('Файл успешно переименован');
      } else {
        toast.error('Ошибка переименования файла');
      }

      close('rename');
    } catch (error) {
      console.error('Ошибка переименования файла:', error);
    }
  };

  return (
    <>
      <SettingsModal
        isOpen={settingsData.isOpen}
        onClose={() => close('settings')}
        onSubmit={submitModalSettings}
      />

      <ExcludeModal
        isOpen={excludeData.isOpen}
        onClose={() => close('exclude')}
        onSubmit={submitModalExclude}
        dispatch={dispatch}
      />

      <DeleteModal
        isOpen={deleteData.isOpen}
        onClose={() => close('delete')}
        onSubmit={submitModalDelete}
        currentName={deleteData.value?.name}
      />

      <RenameModal
        isOpen={renameData.isOpen}
        onClose={() => close('rename')}
        onSubmit={submitModalRename}
        file={renameData.value}
      />
    </>
  );
}
