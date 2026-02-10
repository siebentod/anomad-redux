import React from 'react';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  inline?: boolean;
  className?: string;
}

export default function Spinner({ size = 'md', inline = false, className = '' }: SpinnerProps) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const spinnerElement = (
    <span
      className={`animate-spin rounded-full border border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${inline ? 'inline-block' : ''} ${className}`}
    />
  );

  if (inline) {
    return spinnerElement;
  }

  return (
    <div className="flex justify-center items-center">
      {spinnerElement}
    </div>
  );
}