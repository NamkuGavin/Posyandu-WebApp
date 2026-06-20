"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Home,
  Baby,
  ClipboardCheck,
  BarChart3,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, logout } from "@/lib/api";
import { KaderProfile } from "@/types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<KaderProfile | null>(null);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const baseMenuItems = [
    {
      label: "Beranda",
      href: "/dashboard",
      icon: Home,
      description: "Ringkasan harian",
    },
    {
      label: "Balita",
      href: "/dashboard/balita",
      icon: Baby,
      description: "Daftar & data balita",
    },
    {
      label: "Absen",
      href: "/dashboard/absen",
      icon: ClipboardCheck,
      description: "Kehadiran bulanan",
    },
    {
      label: "Laporan",
      href: "/dashboard/laporan",
      icon: BarChart3,
      description: "Statistik Posyandu",
    },
  ];
  const isAdmin = profile?.role?.toUpperCase() === "ADMIN";
  const menuItems = isAdmin
    ? [
        ...baseMenuItems,
        {
          label: "Admin",
          href: "/dashboard/admin/kader",
          icon: ShieldCheck,
          description: "Kelola akun kader",
        },
      ]
    : baseMenuItems;

  useEffect(() => {
    getCurrentUser()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  const displayName = profile?.nama || profile?.username || "Pengguna";
  const displayEmail = profile?.email || profile?.nik || "Profil pengguna";
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "P";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLogoutDialogOpen(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 left-0 w-[300px] bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white">
              <Image
                src="/icons/logo-original.png"
                alt="Mitra Posyandu Logo"
                width={300}
                height={300}
                className="rounded-xl"
                priority
              />
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight text-black">
                Posyandu ILP Ceria 9
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Sidorejo Kidul
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">
            Menu
          </p>

          <div className="space-y-2">
            {menuItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(`${item.href}/`)) ||
                (item.href === "/dashboard/admin/kader" &&
                  pathname.startsWith("/dashboard/admin"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center justify-between p-3 rounded-xl transition-all relative overflow-hidden group
                    ${
                      isActive
                        ? "bg-teal-50/50 text-teal-600"
                        : "text-gray-400 hover:bg-gray-50 hover:text-gray-800"
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={
                        isActive
                          ? "text-teal-600"
                          : "text-gray-400 group-hover:text-gray-600"
                      }
                    >
                      <item.icon size={22} />
                    </div>
                    <div>
                      <h4
                        className={`text-sm font-bold ${isActive ? "text-teal-600" : "text-gray-800"}`}
                      >
                        {item.label}
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-6 bg-teal-600 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t space-y-6">
          <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#b8f5e6] flex items-center justify-center text-teal-800 font-bold text-sm">
              {avatarInitial}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold text-gray-800 truncate">
                {displayName}
              </h4>
              <p className="text-[10px] text-gray-800 truncate">
                {displayEmail}
              </p>
              {profile?.role && (
                <p className="text-[10px] font-black text-[#0d9488] uppercase tracking-widest mt-0.5">
                  {profile.role}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsLogoutDialogOpen(true)}
            className="flex items-center justify-center gap-3 w-full text-rose-600 font-bold text-sm hover:bg-rose-50 p-3 rounded-xl transition-colors group cursor-pointer active:scale-95"
          >
            <LogOut
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Keluar
          </button>
        </div>
      </div>

      {isLogoutDialogOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-rose-50">
            <div className="mx-auto w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mb-4 text-rose-600">
              <AlertTriangle size={26} />
            </div>
            <h3 className="text-lg font-black text-black mb-2">
              Keluar dari akun?
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Sesi pengguna akan diakhiri dan Anda perlu login kembali untuk
              mengakses dashboard.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutDialogOpen(false)}
                disabled={isLoggingOut}
                className="flex-1 bg-white hover:bg-gray-50 active:scale-[0.99] border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-2xl shadow-sm transition-all text-xs disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-2xl shadow-sm transition-all text-xs disabled:opacity-60"
              >
                {isLoggingOut ? "Keluar..." : "Ya, Keluar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
