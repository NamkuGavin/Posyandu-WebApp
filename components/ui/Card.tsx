import { ReactNode, MouseEventHandler } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export default function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div onClick={onClick} className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}
