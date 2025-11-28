import { Field, ErrorMessage } from 'formik';
import clsx from 'clsx';

interface InputProps {
  name: string;
  type: string;
  placeholder: string;
  hasError?: boolean;
}

const Input = ({ name, type, placeholder, hasError }: InputProps) => (
  <div className="mb-4">
    <Field
      name={name}
      type={type}
      placeholder={placeholder}
      className={clsx(
        'w-full p-3 border rounded-lg focus:outline-none focus:ring-2',
        'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white',
        hasError
          ? 'border-red-500 ring-red-500'
          : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
      )}
    />
    <ErrorMessage name={name} component="div" className="text-red-500 text-sm mt-1" />
  </div>
);

export default Input;
