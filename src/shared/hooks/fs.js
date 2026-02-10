import {
  create,
  writeTextFile,
  open,
  readTextFile,
  readDir,
  mkdir,
  exists,
  stat,
  BaseDirectory,
} from '@tauri-apps/plugin-fs';
import toast from 'react-hot-toast';

const ensureDirectory = async (dirname) => {
  try {
    const dirExists = await exists(`AcademyNomad\\${dirname}`, {
      baseDir: BaseDirectory.Document,
    });

    if (!dirExists) {
      await mkdir(`AcademyNomad\\${dirname}`, {
        baseDir: BaseDirectory.Document,
        recursive: true,
      });
    }
  } catch (error) {
    console.error(`Ошибка создания директории ${dirname}:`, error);
  }
};

const createDirectory = async (dirname) => {
  await mkdir(`AcademyNomad\\${dirname}`, {
    baseDir: BaseDirectory.Document,
  });
};

export const readDirectory = async (dirname) => {
  try {
    await ensureDirectory(dirname);
    const entries = await readDir(`AcademyNomad\\${dirname}`, {
      baseDir: BaseDirectory.Document,
    });

    const filteredEntries = [];
    for (const entry of entries) {
      if (entry.name.endsWith('.md')) {
        const dateModified = await stat(`AcademyNomad\\${dirname}\\${entry.name}`, {
          baseDir: BaseDirectory.Document,
        });
        filteredEntries.push({
          name: entry.name,
          dateModified: dateModified?.mtime?.toISOString(),
        });
      }
    }

    return filteredEntries;
  } catch (error) {
    console.error(`Ошибка чтения директории ${dirname}:`, error);
    return [];
  }
};

export const createFile = async (filepath, content) => {
  const file = await create(`AcademyNomad\\${filepath}`, {
    baseDir: BaseDirectory.Document,
  });
  await writeTextFile(`AcademyNomad\\${filepath}`, content, {
    baseDir: BaseDirectory.Document,
  });
  await file.close();
};

export const saveFile = async (filepath, content) => {
  try {
    await writeTextFile(`AcademyNomad\\${filepath}`, content, {
      baseDir: BaseDirectory.Document,
    });
  } catch (error) {
    if (error.includes('os error 3')) {
      try {
        console.log('Файл не найден, создаем его');
        await createFile(filepath, content);
      } catch (error) {
        if (error.includes('os error 3')) {
          console.log('Директория не найдена, создаем ее');
          try {
            console.log('filepath', filepath);
            filepath.includes('projects')
              ? await createDirectory('projects')
              : await createDirectory('notes');
            console.log('Директория создана, сохраняем файл');
            await createFile(filepath, content);
          } catch (error) {
            toast.error(`Ошибка сохранения файла ${filepath}: ${error}`);
            console.error(`Ошибка сохранения файла ${filepath}:`, error);
          }
        }
      }
    }
  }
};

export const loadFile = async (filepath) => {
  try {
    const fileExists = await exists(`AcademyNomad\\${filepath}`, {
      baseDir: BaseDirectory.Document,
    });

    if (!fileExists) {
      // Создаем пустой файл если его нет
      await saveFile(filepath, '');
      return '';
    }

    const content = await readTextFile(`AcademyNomad\\${filepath}`, {
      baseDir: BaseDirectory.Document,
    });

    return content;
  } catch (error) {
    console.error(`Ошибка чтения файла ${filepath}:`, error);
    // Если файл не удалось прочитать, создаем пустой
    await saveFile(filepath, '');
    return '';
  }
};
