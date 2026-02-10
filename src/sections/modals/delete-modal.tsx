import Modal from 'src/shared/ui/modal';
import Button from 'src/shared/ui/Button';

export interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  currentName?: string;
}

export default function DeleteModal({ isOpen, onClose, onSubmit, currentName }: DeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Удалить ${currentName || 'элемент'}`}
      noButtons
      closingCross
    >
      <p className="mx-auto text-center max-w-[400px]">
        Данное действие необратимо. Вы уверены?
      </p>
      <div className="flex justify-center mt-4 gap-2">
        <Button onClick={onSubmit} primary>
          Да
        </Button>
        <Button onClick={onClose} primary={false}>
          Назад
        </Button>
      </div>
    </Modal>
  );
}