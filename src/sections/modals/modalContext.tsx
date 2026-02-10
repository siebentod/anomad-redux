import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Интерфейсы для модального контекста
export interface ModalState {
  modals: Record<string, boolean>;        // Состояние открытия модалок
  modalValues: Record<string, any>;       // Значения, передаваемые в модалки
}

export interface ModalContextType extends ModalState {
  open: (name: string, value?: any) => void;
  close: (name: string) => void;
  toggle: (name: string) => void;
  isOpen: (name: string) => boolean;
  getModalValue: (name: string) => any;
}

// Действия для reducer
type ModalAction =
  | { type: 'OPEN_MODAL'; payload: { name: string; value?: any } }
  | { type: 'CLOSE_MODAL'; payload: { name: string } }
  | { type: 'TOGGLE_MODAL'; payload: { name: string } };

// Начальное состояние
const initialState: ModalState = {
  modals: {},
  modalValues: {},
};

// Reducer для управления состоянием модалок
function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'OPEN_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.name]: true,
        },
        modalValues: {
          ...state.modalValues,
          [action.payload.name]: action.payload.value,
        },
      };

    case 'CLOSE_MODAL':
      const { [action.payload.name]: _, ...remainingModals } = state.modals;
      const { [action.payload.name]: __, ...remainingValues } = state.modalValues;
      return {
        ...state,
        modals: remainingModals,
        modalValues: remainingValues,
      };

    case 'TOGGLE_MODAL':
      const isCurrentlyOpen = state.modals[action.payload.name];
      if (isCurrentlyOpen) {
        // Закрываем модалку
        const { [action.payload.name]: ___, ...remainingModalsToggle } = state.modals;
        const { [action.payload.name]: ____, ...remainingValuesToggle } = state.modalValues;
        return {
          ...state,
          modals: remainingModalsToggle,
          modalValues: remainingValuesToggle,
        };
      } else {
        // Открываем модалку
        return {
          ...state,
          modals: {
            ...state.modals,
            [action.payload.name]: true,
          },
        };
      }

    default:
      return state;
  }
}

// Создание контекста
const ModalContext = createContext<ModalContextType | undefined>(undefined);

// Props для ModalProvider
interface ModalProviderProps {
  children: ReactNode;
}

// Provider компонент
export function ModalProvider({ children }: ModalProviderProps) {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  // Функции для управления модалками
  const open = (name: string, value?: any) => {
    dispatch({ type: 'OPEN_MODAL', payload: { name, value } });
  };

  const close = (name: string) => {
    dispatch({ type: 'CLOSE_MODAL', payload: { name } });
  };

  const toggle = (name: string) => {
    dispatch({ type: 'TOGGLE_MODAL', payload: { name } });
  };

  const isOpen = (name: string): boolean => {
    return !!state.modals[name];
  };

  const getModalValue = (name: string): any => {
    return state.modalValues[name];
  };

  const value: ModalContextType = {
    ...state,
    open,
    close,
    toggle,
    isOpen,
    getModalValue,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}

// Хук для использования контекста
export function useModalContext(): ModalContextType {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
}