import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, ReactNode } from 'react';

export interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  action?: () => void;
  noButtons?: boolean;
  closingCross?: boolean;
}

export default function Modal({
  isOpen = true,
  onClose,
  title,
  children,
  action,
  noButtons = false,
  closingCross = true,
}: ModalProps) {
  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Запоминаем, что клик начался на backdrop
      (e.currentTarget as HTMLElement).dataset.backdropClick = 'true';
    }
  };

  const handleBackdropMouseUp = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.backdropClick === 'true') {
      onClose();
    }
    // Очищаем флаг
    delete (e.currentTarget as HTMLElement).dataset.backdropClick;
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={handleBackdropMouseDown}
        onMouseUp={handleBackdropMouseUp}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-xl max-w-[600px] p-6"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-[600] md:px-20 text-center px-3">
              {title}
            </h2>
            {closingCross && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>

          <div>{children}</div>

          {!noButtons && (
            <>
              <div className="flex justify-center mt-4 gap-2">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 w-[100px]"
                  onClick={action}
                >
                  Да
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:red-bg-hover w-[100px]"
                >
                  Назад
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
