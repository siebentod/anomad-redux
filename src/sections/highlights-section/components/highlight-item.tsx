import { useState } from 'react';
import type { HighlightItemProps } from '../types';

function HighlightItem({ highlight, onClick }: HighlightItemProps) {
  const [expanded, setExpanded] = useState(false);

  const text = highlight.highlighted_text || highlight.annotation_text || '';

  const needsExpansion = text.length > 200;
  const displayText =
    expanded || !needsExpansion ? text : text.slice(0, 200) + '...';

  const date = new Date(highlight.timestamp);

  const formattedDate = date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex">
      {/* Vertical color strip */}
      <div
        className="w-1 flex-shrink-0 rounded-l-sm mt-[1px]"
        style={{
          backgroundColor: highlight.color
            ? `rgb(${highlight.color[0] * 255}, ${highlight.color[1] * 255}, ${
                highlight.color[2] * 255
              })`
            : 'black',
        }}
      />
      <div
        className="flex-1 px-3 pl-2 pb-2 pt-2 border-b border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer group"
        onClick={() => onClick(highlight)}
      >
        <div className="flex justify-between items-start mb-1">
          <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
            {formattedDate}
          </span>
          <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
            Стр. {highlight.page}
          </span>
        </div>

        <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
          {displayText}
        </div>

        {needsExpansion && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="mt-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            {expanded ? 'Свернуть' : 'Показать полностью'}
          </button>
        )}

        {highlight.annotation_text && highlight.highlighted_text && (
          <div className="mt-1 pt-1 border-t border-gray-800/50">
            <span className="text-xs text-gray-400 italic">
              Заметка: {highlight.annotation_text}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default HighlightItem;
