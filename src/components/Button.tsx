import clsx from 'clsx';
import React from 'react';

// Расширяем интерфейс, чтобы он принимал все стандартные атрибуты кнопки, включая onClick
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
  ...props // Собираем все остальные пропсы (включая onClick, disabled)
}: ButtonProps) => (
  <button
    type={type}
    // Передаем остальные пропсы на элемент button
    {...props}
    className={clsx(
      'font-semibold transition-colors rounded-lg',
      // Стили для размера
      size === 'md' ? 'p-3' : 'px-2 py-1 text-sm',
      // Стили для варианта
      variant === 'primary' 
        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
      // Состояние disabled
      props.disabled && 'bg-gray-400 cursor-not-allowed hover:bg-gray-400',
      // На всю ширину
      fullWidth && 'w-full',
      // Пользовательские классы
      className
    )}
  >
    {children}
  </button>
);

export default Button;
