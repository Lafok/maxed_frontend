import clsx from 'clsx';

interface ButtonProps {
  type?: 'submit' | 'button' | 'reset';
  children: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
}

const Button = ({
  type = 'submit',
  children,
  disabled,
  fullWidth,
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled}
    className={clsx(
      'p-3 rounded-lg font-semibold transition-colors',
      'bg-indigo-600 text-white hover:bg-indigo-700',
      disabled && 'bg-gray-400 cursor-not-allowed',
      fullWidth && 'w-full'
    )}
  >
    {children}
  </button>
);

export default Button;
