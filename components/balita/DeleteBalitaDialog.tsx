"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

const DELETE_REASONS = [
  { label: "Pindah Alamat", value: "PINDAH_ALAMAT" },
  { label: "Usia > 60", value: "USIA_LEBIH_60_BULAN" },
  { label: "Permintaan wali", value: "PERMINTAAN_WALI" },
] as const;

type DeleteBalitaDialogProps = {
  isOpen: boolean;
  balitaName: string;
  onClose: () => void;
  onConfirm: (reason: string, note?: string) => Promise<void>;
};

export default function DeleteBalitaDialog({
  isOpen,
  balitaName,
  onClose,
  onConfirm,
}: DeleteBalitaDialogProps) {
  const [selectedReason, setSelectedReason] = useState(
    DELETE_REASONS[0].value as string,
  );
  const [note, setNote] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const requiresNote = selectedReason === "PERMINTAAN_WALI";
  const isDisabled = isDeleting || (requiresNote && !note.trim());

  const resetState = () => {
    setSelectedReason(DELETE_REASONS[0].value);
    setNote("");
    setIsDeleting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-red-50/50 bg-white p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <Trash2 size={26} />
        </div>
        <h3 className="mb-2 text-lg font-black text-black">
          Hapus Data Balita
        </h3>
        <p className="mb-6 text-xs leading-relaxed text-gray-600">
          Apakah Anda yakin ingin menghapus data <strong>{balitaName}</strong>?
          Tindakan ini tidak dapat dibatalkan.
        </p>

        <div className="mb-6 space-y-3 text-left">
          <p className="ml-1 text-xs font-bold text-gray-500">
            Alasan Penghapusan
          </p>
          {DELETE_REASONS.map((reason) => (
            <button
              key={reason.value}
              type="button"
              onClick={() => {
                setSelectedReason(reason.value);
                if (reason.value !== "PERMINTAAN_WALI") setNote("");
              }}
              className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all active:scale-[0.98] ${
                selectedReason === reason.value
                  ? "border-rose-400 bg-rose-50/30"
                  : "border-gray-200 bg-white"
              }`}
            >
              <span className="text-xs font-bold text-black">
                {reason.label}
              </span>
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                  selectedReason === reason.value
                    ? "border-rose-500"
                    : "border-gray-300"
                }`}
              >
                {selectedReason === reason.value && (
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                )}
              </span>
            </button>
          ))}

          {requiresNote && (
            <div className="space-y-2">
              <label
                htmlFor="catatan-hapus-balita"
                className="ml-1 text-xs font-bold text-gray-500"
              >
                Catatan permintaan wali
              </label>
              <textarea
                id="catatan-hapus-balita"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={200}
                rows={3}
                placeholder="Contoh: wali meminta data dihapus karena pindah domisili"
                className="w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-xs font-semibold text-black outline-none transition-all placeholder:text-gray-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold text-gray-500">
                  Wajib diisi untuk alasan permintaan wali.
                </p>
                <p className="text-[10px] font-bold text-gray-400">
                  {note.length}/200
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-xl border border-orange-200 bg-[#fffdf0] p-3.5 text-left text-orange-600">
          <AlertTriangle size={18} className="shrink-0" />
          <span className="text-[11px] font-bold">
            Data akan dihapus dari daftar aktif
          </span>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-2xl border border-gray-300 bg-white px-6 py-3 text-xs font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.99]"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isDisabled}
            onClick={async () => {
              if (isDisabled) return;
              setIsDeleting(true);
              try {
                await onConfirm(
                  selectedReason,
                  requiresNote ? note.trim() : undefined,
                );
                resetState();
              } finally {
                setIsDeleting(false);
              }
            }}
            className="flex-1 rounded-2xl bg-rose-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-rose-600/15 transition-all hover:bg-rose-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
