"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

interface NavbarProps {
  title?: string;
}

export default function Navbar({ title = "Beranda" }: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Sidebar isOpen={open} onClose={() => setOpen(false)} />

      <nav className="bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Buka menu"
              onClick={() => setOpen(true)}
              className="w-11 h-11 -ml-1 text-black hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center"
            >
              <Menu size={24} strokeWidth={2.5} />
            </button>

            <h1 className="font-bold text-lg text-black">{title}</h1>
          </div>
        </div>
      </nav>
    </>
  );
}
