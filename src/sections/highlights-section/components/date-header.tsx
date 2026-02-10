import type { DateHeaderProps } from '../types';

export default function DateHeader({ date, index }: DateHeaderProps) {
  return (
    <div
      key={`date-${index}`}
      className="mt-4 px-3 text-sm font-bold text-[rgb(209,114,119)] uppercase tracking-wide"
    >
      {date}
    </div>
  );
}