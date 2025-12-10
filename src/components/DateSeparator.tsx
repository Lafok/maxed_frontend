import React from 'react';

interface DateSeparatorProps {
  date: string;
}

const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
  return (
    <div className="flex items-center my-4">
      <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
      <span className="flex-shrink mx-4 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 px-2 rounded-full">
        {date}
      </span>
      <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
    </div>
  );
};

export default DateSeparator;
