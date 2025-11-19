import React from 'react';
import clsx from 'clsx';

interface GenericInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const GenericInput = ({ className, hasError, ...props }: GenericInputProps) => {
  return (
    <input
      {...props}
      className={clsx(
        'w-full p-3 border rounded-lg focus:outline-none focus:ring-2',
        hasError
          ? 'border-red-500 ring-red-500'
          : 'border-gray-300 focus:ring-indigo-500',
        props.disabled && 'bg-gray-100 cursor-not-allowed',
        className
      )}
    />
  );
};

export default GenericInput;
