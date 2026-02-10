import { useState, useCallback } from 'react';

export function useViewFilter(resetCount: () => void) {
  const [hiddenBooks, setHiddenBooks] = useState<string[]>([]);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);

  const selectBook = useCallback((fileName: string | null) => {
    setSelectedBook(fileName);
    setHiddenBooks([]);
    resetCount();
  }, [resetCount]);

  const removeBookFilter = useCallback(() => {
    setSelectedBook(null);
    resetCount();
  }, [resetCount]);

  const hideBook = useCallback((fileName: string) => {
    setHiddenBooks((prev) => {
      if (prev.includes(fileName)) {
        return prev.filter((book) => book !== fileName);
      } else {
        return [...prev, fileName];
      }
    });
    setSelectedBook(null);
    resetCount();
  }, [resetCount]);

  return {
    selectedBook,
    hiddenBooks,
    selectBook,
    removeBookFilter,
    hideBook,
  };
}