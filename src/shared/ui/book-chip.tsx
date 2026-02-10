interface BookChipProps {
  title: string;
  isToggled: boolean;
  onClick: (title: string) => void;
}

export default function BookChip({
  title,
  isToggled,
  onClick,
}: BookChipProps) {
  return (
    <div className="flex items-center bg-gray-700 rounded px-2 py-1 text-sm text-gray-200 w-max">
      <span className="max-w-[200px] truncate" title={title}>
        {title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick(title);
        }}
        className={`ml-1 ${
          isToggled ? 'text-red-400' : 'text-gray-400'
        } hover:text-white`}
        aria-label={
          isToggled
            ? `Включить "${title}" обратно`
            : `Исключить "${title}"`
        }
      >
        {isToggled ? '✓' : '×'}
      </button>
    </div>
  );
}
