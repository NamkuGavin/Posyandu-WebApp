import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-bold text-gray-800 block">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full min-h-12 px-4 py-3 rounded-xl border transition-all outline-none
            placeholder:text-gray-400 text-black font-semibold
            ${error 
              ? "border-rose-500 focus:ring-4 focus:ring-rose-50" 
              : "border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-xs font-bold text-rose-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
