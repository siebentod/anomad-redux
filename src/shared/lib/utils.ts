export function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function parsePDFDate(pdfDate: string) {
  if (!pdfDate) return 0;
  // Извлекаем компоненты: D:YYYYMMDDHHmmss
  const match = pdfDate.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!match) return 0;

  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  return new Date(year, month - 1, day, hour, minute, second).getTime();
}

export function parseISODate(isoString: string): number {
  if (!isoString) return 0;
  const date = new Date(isoString);
  return date.getTime();
}

export function getDateKey(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}