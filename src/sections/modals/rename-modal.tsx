import React from 'react';
import Modal from 'src/shared/ui/modal';
import Button from 'src/shared/ui/Button';
import type { File } from 'src/shared/types';

export interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  file: File | null;
}

export default function RenameModal({ isOpen, onClose, onSubmit, file }: RenameModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Переименовать файл"
      noButtons
      closingCross
    >
      {file && (
        <>
          <p className="mx-auto text-center max-w-[400px] mb-4">
            Введите новое имя для файла
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Текущее имя: <span className="font-mono">{file.title}</span>
          </p>
          <form onSubmit={onSubmit}>
            <input
              type="text"
              className="border border-gray-300 rounded-md w-full p-2 mb-4"
              name="newName"
              placeholder="Новое имя файла"
              defaultValue={file.title}
              autoFocus
            />
            <div className="flex justify-center gap-2">
              <Button type="submit" primary>
                Переименовать
              </Button>
              <Button
                type="button"
                onClick={onClose}
                primary={false}
              >
                Отмена
              </Button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}