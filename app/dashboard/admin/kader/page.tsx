"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  PencilLine,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import {
  EmptyState,
  InfoPanel,
  PageHeader,
  PageStatusState,
} from "@/components/ui/PageParts";
import { useToast } from "@/components/ui/Toast";
import {
  deleteKader,
  getCurrentUser,
  getKaderList,
  updateKader,
} from "@/lib/api";
import { NIK_LENGTH } from "@/lib/constants";
import { onlyDigits } from "@/lib/form-utils";
import { CreateKaderPayload, KaderProfile, UpdateKaderPayload } from "@/types";

const EMPTY_FORM: CreateKaderPayload = {
  nik: "",
  username: "",
  email: "",
  nama: "",
  password: "",
};
function isAdmin(user: KaderProfile | null) {
  return user?.role?.toUpperCase() === "ADMIN";
}

function normalizeForm(formData: CreateKaderPayload): CreateKaderPayload {
  return {
    nik: formData.nik.trim(),
    username: formData.username.trim(),
    email: formData.email.trim(),
    nama: formData.nama.trim(),
    password: formData.password.trim(),
  };
}

function roleBadgeClass(role?: string) {
  return role?.toUpperCase() === "ADMIN"
    ? "bg-indigo-50 text-indigo-700 border-indigo-100"
    : "bg-[#e6fbf5] text-[#0d9488] border-teal-100";
}

export default function AdminKaderPage() {
  const [currentUser, setCurrentUser] = useState<KaderProfile | null>(null);
  const [kaderList, setKaderList] = useState<KaderProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadState, setLoadState] = useState<
    "loading" | "success" | "error" | "forbidden"
  >("loading");
  const [dialogMode, setDialogMode] = useState<"edit" | null>(null);
  const [selectedKader, setSelectedKader] = useState<KaderProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KaderProfile | null>(null);
  const [formData, setFormData] = useState<CreateKaderPayload>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { success, error, warning } = useToast();

  const refreshKaderList = async () => {
    const list = await getKaderList();
    setKaderList(list);
  };

  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(() => {
      if (isActive) setLoadState("loading");
    });

    getCurrentUser()
      .then(async (profile) => {
        if (!isActive) return;
        setCurrentUser(profile);

        if (!isAdmin(profile)) {
          setLoadState("forbidden");
          return;
        }

        const list = await getKaderList();
        if (!isActive) return;
        setKaderList(list);
        setLoadState("success");
      })
      .catch((err) => {
        console.error(err);
        if (isActive) setLoadState("error");
      });

    return () => {
      isActive = false;
    };
  }, []);

  const filteredKaderList = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return kaderList;

    return kaderList.filter((kader) =>
      [kader.nama, kader.username, kader.email, kader.nik]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [kaderList, searchTerm]);

  const totalAdmin = kaderList.filter(
    (kader) => kader.role?.toUpperCase() === "ADMIN",
  ).length;
  const totalKader = kaderList.filter(
    (kader) => kader.role?.toUpperCase() !== "ADMIN",
  ).length;

  const openEditDialog = (kader: KaderProfile) => {
    if (kader.role?.toUpperCase() === "ADMIN") {
      warning("Akun admin hanya ditampilkan sebagai referensi dan tidak diedit di halaman kader.");
      return;
    }

    setSelectedKader(kader);
    setFormData({
      nik: kader.nik || "",
      username: kader.username || "",
      email: kader.email || "",
      nama: kader.nama || "",
      password: "",
    });
    setDialogMode("edit");
  };

  const resetDialog = () => {
    setDialogMode(null);
    setSelectedKader(null);
    setFormData(EMPTY_FORM);
  };

  const closeDialog = () => {
    if (isSaving) return;
    resetDialog();
  };

  const handleFormChange = (field: keyof CreateKaderPayload, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const buildUpdatePayload = (payload: CreateKaderPayload) => {
    const updatePayload: UpdateKaderPayload = {};

    if (payload.nik !== (selectedKader?.nik || "")) updatePayload.nik = payload.nik;
    if (payload.username !== (selectedKader?.username || "")) {
      updatePayload.username = payload.username;
    }
    if (payload.email !== (selectedKader?.email || "")) {
      updatePayload.email = payload.email;
    }
    if (payload.nama !== (selectedKader?.nama || "")) updatePayload.nama = payload.nama;
    if (payload.password) updatePayload.password = payload.password;

    return updatePayload;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = normalizeForm(formData);

    if (!payload.nik || !payload.username || !payload.email || !payload.nama) {
      warning("NIK, username, email, dan nama wajib diisi.");
      return;
    }

    if (payload.nik.length !== NIK_LENGTH) {
      warning("NIK kader harus 16 digit angka.");
      return;
    }

    if (payload.password && payload.password.length < 8) {
      warning("Password baru minimal 8 karakter.");
      return;
    }

    try {
      setIsSaving(true);

      if (dialogMode === "edit" && selectedKader?.id) {
        const updatePayload = buildUpdatePayload(payload);

        if (Object.keys(updatePayload).length === 0) {
          warning("Tidak ada perubahan data untuk disimpan.");
          return;
        }

        await updateKader(selectedKader.id, updatePayload);
        success("Akun kader berhasil diperbarui.");
      }

      await refreshKaderList();
      resetDialog();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : "Gagal menyimpan akun kader.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;

    if (deleteTarget.id === currentUser?.id) {
      warning("Akun yang sedang digunakan tidak bisa dihapus dari halaman ini.");
      return;
    }

    if (deleteTarget.role?.toUpperCase() === "ADMIN") {
      warning("Akun admin tidak bisa dihapus dari halaman manajemen kader.");
      return;
    }

    try {
      setIsDeleting(true);
      await deleteKader(deleteTarget.id);
      await refreshKaderList();
      success("Akun kader berhasil dihapus.");
      setDeleteTarget(null);
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : "Gagal menghapus akun kader.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loadState !== "success") {
    return (
      <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
        <Navbar title="Admin" />
        <main className="p-4 sm:p-6 max-w-6xl mx-auto mt-2">
          <PageStatusState
            tone={loadState === "loading" ? "loading" : "error"}
            title={
              loadState === "forbidden"
                ? "Akses admin diperlukan"
                : loadState === "error"
                ? "Halaman admin belum bisa dimuat"
                : "Memuat halaman admin"
            }
            description={
              loadState === "forbidden"
                ? "Akun yang sedang digunakan tidak memiliki role ADMIN untuk mengelola akun kader."
                : loadState === "error"
                ? "Terjadi gangguan saat mengambil profil pengguna atau daftar kader. Coba muat ulang halaman."
                : "Mengambil profil pengguna dan daftar kader sebelum menampilkan halaman admin."
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
      <Navbar title="Admin Kader" />

      <main className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 mt-2">
        <PageHeader
          eyebrow="Admin"
        title="Manajemen Akun Kader"
          description="Pantau, perbarui, atau hapus akun kader yang telah mendaftar secara mandiri."
        />

        <InfoPanel title="Akses admin" icon={ShieldCheck}>
          Pembuatan akun dilakukan kader melalui halaman registrasi publik.
          Admin dapat memperbarui atau menghapus akun kader, sedangkan akun
          admin tidak dapat diubah dari halaman ini.
        </InfoPanel>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-4 rounded-xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Total Akun
            </p>
            <p className="text-2xl font-black text-gray-950 mt-2">
              {kaderList.length}
            </p>
          </Card>
          <Card className="p-4 rounded-xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Kader
            </p>
            <p className="text-2xl font-black text-[#0d9488] mt-2">
              {totalKader}
            </p>
          </Card>
          <Card className="p-4 rounded-xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Admin
            </p>
            <p className="text-2xl font-black text-indigo-700 mt-2">
              {totalAdmin}
            </p>
          </Card>
        </div>

        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10"
            size={20}
          />
          <input
            type="text"
            placeholder="Cari nama, username, email, atau NIK"
            className="pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-white w-full focus:outline-none focus:ring-2 focus:ring-teal-100 text-base shadow-sm font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredKaderList.length > 0 ? (
            filteredKaderList.map((kader) => {
              const displayName = kader.nama || kader.username || "Tanpa nama";
              const isCurrentUser = kader.id === currentUser?.id;
              const isKaderAccount = kader.role?.toUpperCase() !== "ADMIN";

              return (
                <Card
                  key={kader.id || kader.username}
                  className="p-5 rounded-xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#f0fbf9] text-[#0d9488] flex items-center justify-center shrink-0">
                      <UserRound size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-black text-gray-950 truncate">
                          {displayName}
                        </h2>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${roleBadgeClass(
                            kader.role,
                          )}`}
                        >
                          {kader.role || "KADER"}
                        </span>
                        {isCurrentUser && (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black text-gray-500">
                            Akun aktif
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-600 mt-1">
                        @{kader.username || "-"}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs font-semibold text-gray-600">
                        <p className="truncate">Email: {kader.email || "-"}</p>
                        <p className="truncate">NIK: {kader.nik || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 mt-4 pt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => openEditDialog(kader)}
                      disabled={!isKaderAccount}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-100 bg-[#f0fbf9] px-4 py-2.5 text-xs font-black text-[#0d9488] hover:bg-teal-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <PencilLine size={15} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(kader)}
                      disabled={isCurrentUser || !isKaderAccount}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-600 hover:bg-rose-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      Hapus
                    </button>
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="lg:col-span-2">
              <EmptyState
                title="Akun kader tidak ditemukan"
                description="Coba gunakan nama, username, email, atau NIK lain."
              />
            </div>
          )}
        </div>
      </main>

      {dialogMode && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-white shadow-2xl border border-gray-100 rounded-t-3xl sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 rounded-t-3xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black text-[#0d9488] uppercase tracking-widest">
                    Edit Akun
                  </p>
                  <h3 className="text-lg font-black text-gray-950 mt-1">
                    Edit Akun Kader
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={isSaving}
                  className="w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-600 inline-flex items-center justify-center hover:bg-gray-50 active:scale-95 disabled:opacity-60"
                  aria-label="Tutup form"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nama Kader"
                value={formData.nama}
                onChange={(e) => handleFormChange("nama", e.target.value)}
                placeholder="Nama lengkap kader"
              />
              <Input
                label="Username"
                value={formData.username}
                onChange={(e) => handleFormChange("username", e.target.value)}
                placeholder="kader01"
              />
              <Input
                label="NIK"
                value={formData.nik}
                onChange={(e) =>
                  handleFormChange("nik", onlyDigits(e.target.value, NIK_LENGTH))
                }
                inputMode="numeric"
                maxLength={NIK_LENGTH}
                placeholder="16 digit NIK"
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange("email", e.target.value)}
                placeholder="kader@example.com"
              />
              <div className="sm:col-span-2">
                <Input
                  label="Password Baru (opsional)"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleFormChange("password", e.target.value)}
                  placeholder="Kosongkan jika tidak ingin mengganti password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={closeDialog}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-black text-gray-700 hover:bg-gray-50 active:scale-[0.99] disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1fb999] px-5 py-3.5 text-sm font-black text-white shadow-sm hover:bg-teal-600 active:scale-[0.99] disabled:bg-gray-200 disabled:text-gray-400"
              >
                <Check size={17} />
                {isSaving ? "Menyimpan..." : "Simpan Akun Kader"}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-rose-50">
            <div className="mx-auto w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mb-4 text-rose-600">
              <AlertTriangle size={26} />
            </div>
            <h3 className="text-lg font-black text-black mb-2">
              Hapus akun kader?
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Akun <strong>{deleteTarget.nama || deleteTarget.username}</strong>{" "}
              akan dihapus dari daftar pengguna. Tindakan ini tidak dapat
              dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 bg-white hover:bg-gray-50 active:scale-[0.99] border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-2xl shadow-sm transition-all text-xs disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-2xl shadow-sm transition-all text-xs disabled:opacity-60"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
