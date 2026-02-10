import React, { useState } from 'react';
import type { EditableCellProps } from '../types';

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onSave,
  onCancel,
  className = '',
}) => {
  const [localValue, setLocalValue] = useState(value);

  const handleSave = () => {
    onSave(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className={className}
      autoFocus
    />
  );
};

export default EditableCell;
