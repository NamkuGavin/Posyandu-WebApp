import { AlertCircle } from "lucide-react";

type MeasurementInputProps = {
  id?: string;
  label: string;
  suffix: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  optional?: boolean;
  placeholder?: string;
  step?: string;
  hint?: string;
  dense?: boolean;
};

export default function MeasurementInput({
  id,
  label,
  suffix,
  value,
  onChange,
  error,
  disabled = false,
  optional = false,
  placeholder = "0.0",
  step = "any",
  hint,
  dense = false,
}: MeasurementInputProps) {
  return (
    <div className={dense ? "space-y-1" : "space-y-2"}>
      <label
        htmlFor={id}
        className={`block text-xs font-bold ${
          dense ? "text-black" : "text-gray-700"
        }`}
      >
        {label}
        {optional && (
          <span className="ml-1 text-gray-400">(opsional)</span>
        )}
      </label>
      <div
        className={`relative overflow-hidden rounded-xl border shadow-sm transition-all ${
          disabled
            ? "border-gray-100 bg-gray-50"
            : error
              ? "border-rose-400 bg-white focus-within:ring-2 focus-within:ring-rose-200"
              : "border-gray-200 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20"
        }`}
      >
        <input
          id={id}
          type="number"
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-transparent pr-12 text-sm font-bold text-black outline-none placeholder:text-gray-300 disabled:cursor-not-allowed disabled:text-gray-400 ${
            dense ? "p-3.5" : "px-3 py-3"
          }`}
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
          {suffix}
        </span>
      </div>
      {hint && <p className="text-[10px] font-medium text-gray-400">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-[10px] font-medium text-rose-500">
          <AlertCircle size={10} />
          {error}
        </p>
      )}
    </div>
  );
}
