import React from 'react';
import Modal from 'src/shared/ui/modal';
import Settings from 'src/sections/settings';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export default function SettingsModal({ isOpen, onClose, onSubmit }: SettingsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Настройки"
      noButtons
      closingCross
    >
      <Settings closeModal={onClose} />
    </Modal>
  );
}