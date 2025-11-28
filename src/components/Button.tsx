import clsx from 'clsx';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
}

const Button = ({
  type = 'button',
  children,
  fullWidth,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) => (
  <button
    type={type}
    {...props}
    className={clsx(
      'font-semibold transition-colors rounded-lg',
      size === 'md' ? 'p-3' : 'px-2 py-1 text-sm',
      variant === 'primary'
        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
      props.disabled && 'bg-gray-400 cursor-not-allowed hover:bg-gray-400',
      fullWidth && 'w-full',
      className
    )}
  >
    {children}
  </button>
);

export default Button;
