import type { File } from 'shared/types';

/**
 * Объединяет файлы из списка проекта с highlights из общего списка файлов
 */
export function mergeProjectFilesWithHighlights(
  projectItems: File[],
  everythingFiles: File[]
): File[] {
  // Создаем Map для быстрого поиска файлов по full_path
  const everythingFilesMap = new Map(
    everythingFiles.map(file => [file.full_path, file])
  );

  return projectItems.map((listFile) => {
    const fileWithHighlights = everythingFilesMap.get(listFile.full_path);
    return fileWithHighlights
      ? { ...listFile, highlights: fileWithHighlights.highlights }
      : listFile;
  });
}