import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    const baseStyles = "inline-flex min-h-11 items-center justify-center rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-200",
      secondary: "bg-teal-50 text-teal-700 hover:bg-teal-100",
      outline: "border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50",
      ghost: "text-gray-600 hover:bg-gray-100",
      danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-200",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs",
      md: "px-5 py-3 text-sm",
      lg: "px-8 py-4 text-base",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading...</span>
          </div>
        ) : children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
