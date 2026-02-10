import React from 'react';
import DarkX from 'src/shared/assets/icons/DarkX.svg';

interface InputProps {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  placeholder?: string;
  value?: string;
  className?: string;
}

const Input: React.FC<InputProps> = ({
  onChange = () => {},
  onClear = () => {},
  placeholder = '',
  value,
  className,
}) => {
  return (
    <div className='relative h-max my-auto'>
      <div className="relative w-full">
        <input
          onChange={onChange}
          placeholder={placeholder}
          className={className}
          {...(value !== undefined ? { value } : {})}
        />
      </div>
      {value && (
        <button
          type="button"
          className="absolute right-1 top-1/2 bg-transparent border-none cursor-pointer flex content-center -translate-y-1/2 p-4"
          onClick={onClear}
        >
          <img src={DarkX} alt="" className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default Input;
