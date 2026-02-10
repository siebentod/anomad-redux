import React from 'react';
import Modal from 'src/shared/ui/modal';
import Button from 'src/shared/ui/Button';
import { useAppSelector } from 'src/redux';
import { selectExcludedList } from 'src/redux/settings/settingsSelectors';
import { removeFromExcluded } from 'src/redux/settings/settingsSlice';
import { AnyAction, Dispatch } from '@reduxjs/toolkit';

export interface ExcludeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  dispatch: Dispatch<AnyAction>;
}

export default function ExcludeModal({ isOpen, onClose, onSubmit, dispatch }: ExcludeModalProps) {
  const excludedList = useAppSelector(selectExcludedList);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Исключить путь"
      noButtons
      closingCross
    >
      <p className="mx-auto text-center max-w-[400px]">Введите путь</p>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          className="border border-gray-300 rounded-md w-full p-2"
          name="path"
          placeholder="C:\путь\к\папке"
        />
        <div className="flex justify-center mt-4 gap-2">
          <Button type="submit" primary>
            Добавить
          </Button>
          <Button
            type="button"
            onClick={onClose}
            primary={false}
          >
            Закрыть
          </Button>
        </div>
      </form>

      {excludedList.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Исключенные пути ({excludedList.length}):
          </h3>
          <div
            className="max-h-[350px] overflow-y-auto border border-gray-200 rounded-md bg-gray-50"
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="space-y-1 p-2">
              {excludedList.map((item: any, index: number) => (
                <div
                  key={`${item.path || item.file_name}-${index}`}
                  className="flex items-center justify-between bg-white rounded px-3 py-2 shadow-sm"
                >
                  <span
                    className="text-xs text-gray-600 font-mono flex-1 truncate mr-2"
                    style={{ maxWidth: '500px' }}
                    title={item.path || item.file_name}
                  >
                    {item.path || item.file_name}
                  </span>
                  <button
                    onClick={() => {
                      const identifier = item.path || item.file_name;
                      if (identifier) {
                        dispatch(removeFromExcluded(identifier));
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-sm font-bold hover:bg-red-50 rounded px-1 py-0.5 transition-colors"
                    title="Удалить"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}