// Общие типы для приложения

export interface File {
  id?: string;
  file_name: string;
  full_path: string;
  title: string;
  extension: string;
  status?: string;
  modified_date?: string;
  created_date?: string;
  pdf_creator?: string;
  size?: number;
  is_locked?: boolean;
  [key: string]: any; // Для дополнительных полей
}

export interface ExcludedListItem {
  file_name?: string;
  path?: string;
  dateAdded: string;
}

export interface ListItem extends File {
  dateAdded: string;
}

export interface List {
  name: string;
  items: ExcludedListItem[] | ListItem[];
}

export type Lists = List[];

export interface Settings {
  types: string[];
  excludedList: ExcludedListItem[];
  pdfReaderPath: string;
  [key: string]: any;
}
