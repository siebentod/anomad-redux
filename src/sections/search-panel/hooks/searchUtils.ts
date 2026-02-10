import { invoke } from '@tauri-apps/api/core';
import { DEFAULT_FETCH_COUNT } from 'src/redux/files/config';

export interface SearchParams {
  query: string;
  includeHighlights: boolean;
  count: number;
}

export interface SearchResult {
  files: any[];
  requestId?: number;
}

export async function searchFiles(params: SearchParams): Promise<SearchResult> {
  const { query, includeHighlights, count } = params;

  const result = await invoke('get_everything', {
    params: {
      query,
      include_highlights: includeHighlights,
      count,
    },
  });

  return { files: result as any[] };
}

export function buildSearchQuery({
  search,
  typesQuery,
  excludedQuery,
  includeQuery,
}: {
  search?: string;
  typesQuery?: string;
  excludedQuery?: string;
  includeQuery?: string;
}): string {
  return `${search || ''} ${typesQuery || ''} ${excludedQuery || ''} ${includeQuery || ''}`.trim();
}

export function buildIncludeQuery(filePaths: string[]): string {
  if (!filePaths.length) return '';
  return filePaths.map(filePath => `<${filePath}>`).join(' | ');
}