import type { BookHeaderProps } from '../types';

export default function FileHeader({
  fileName,
  index,
  onHideBook,
  onSelectBook
}: BookHeaderProps) {
  return (
    <div key={`file-${index}`} className="mt-1.5 flex items-center">
      {/* <button onClick={() => onHideBook(fileName)}>🙈</button> */}
      <div
        className="px-1 text-md font-semibold text-gray-300 truncate pr-4 hover:text-white cursor-pointer"
        onClick={() => onSelectBook(fileName)}
        title={`Показать только "${fileName}"`}
      >
        {fileName}
      </div>
    </div>
  );
}