import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const inputId = props.id || props.name;

    return (
      <div className="form-field relative">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1.5 transition-colors duration-200"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            {...props}
            id={inputId}
            className={`
              w-full px-3 py-2.5 border rounded-lg shadow-sm
              transition-all duration-200
              placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent
              disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500
              ${error
                ? 'border-red-500 focus:ring-red-500 bg-red-50/50'
                : 'border-gray-300 focus:ring-blue-500 hover:border-gray-400'
              }
              ${className}
            `}
          />
          {error && (
            <div className="absolute right-2 top-2.5 text-red-500">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-600 transition-all duration-200 animate-[fadeIn_0.2s_ease-in-out]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';