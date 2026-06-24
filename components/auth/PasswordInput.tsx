"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Input from "@/components/ui/Input";

type PasswordInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
};

export default function PasswordInput({
  label,
  value,
  onChange,
  placeholder = "Masukkan password",
  autoComplete = "current-password",
  error,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        label={label}
        type={isVisible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pr-12"
        autoComplete={autoComplete}
        error={error}
      />
      <button
        type="button"
        aria-label={isVisible ? "Sembunyikan password" : "Tampilkan password"}
        onClick={() => setIsVisible((visible) => !visible)}
        className="absolute right-3 top-[36px] rounded-lg p-2 text-gray-500 transition-colors hover:text-teal-600"
      >
        {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
}
