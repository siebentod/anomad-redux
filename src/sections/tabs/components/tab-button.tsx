import { invoke } from '@tauri-apps/api/core';
import toast from 'react-hot-toast';
import { useAppDispatch } from 'src/redux';
import { addToList } from 'src/redux/lists/listsSlice';
import type { File } from 'src/shared/types';

interface TabButtonProps {
  tab: string;
  isActive: boolean;
  onClick: () => void;
}

export function TabButton({ tab, isActive, onClick }: TabButtonProps) {
  const dispatch = useAppDispatch();

  const onDropToTab = async (fileData: File, tab: string) => {
    try {
      console.log('fileData', fileData);
      const result = await invoke('set_metadata', {
        filePath: fileData.full_path,
      });
      if (result) {
        dispatch(
          addToList({
            listName: tab,
            itemData: { ...fileData, pdf_creator: result },
          })
        );
        toast.success(`Файл добавлен в список ${tab}`);
      } else {
        dispatch(
          addToList({
            listName: tab,
            itemData: { ...fileData, pdf_creator: `error-${Date.now()}` },
          })
        );
        toast.error("Файл добавлен в проект только по имени из-за невозможности редактирования (скорее всего, файл открыт)", {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Ошибка добавления файла в список:', error);
      toast.error(`Ошибка добавления файла в список: ${error}`);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Добавляем класс подсветки
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    // Убираем подсветку только если курсор действительно покинул элемент
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      e.currentTarget.classList.remove('drag-over');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const tabName = e.currentTarget.getAttribute('data-project-tab');
    if (tabName) {
      const dragData = e.dataTransfer.getData('text/plain');
      if (dragData) {
        const fileData = JSON.parse(dragData) as File;
        onDropToTab(fileData, tabName);
      }
    }
  };

  return (
    <button
      onClick={onClick}
      {...(!isActive && { 'data-project-tab': tab })}
      {...(!isActive && {
        onDragOver: handleDragOver,
        onDragEnter: handleDragEnter,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop,
      })}
      className={`py-2 px-4 text-sm font-medium text-center transition-colors duration-150 ease-in-out
        ${
          isActive
            ? 'border-b-2 border-[rgb(236,115,121)] text-[rgb(236,115,121)]'
            : 'text-text-secondary hover:text-gray-400'
        }
      `}
    >
      {tab || 'All'}
    </button>
  );
}