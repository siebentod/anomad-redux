import type { File } from 'src/shared/types';

export const useDragNDrop = () => {
  const handleDragStart = (e: React.DragEvent, file: File) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(file));
    e.dataTransfer.effectAllowed = 'move';
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
  };

  return {
    handleDragStart,
    handleDragEnd,
  };
};
