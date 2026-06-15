"use client";

import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, Baby, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import {
  EmptyState,
  InfoPanel,
  PageHeader,
  PageStatusState,
} from "@/components/ui/PageParts";
import { getBalitaList, getPengukuranList } from "@/lib/api";
import { Balita, Pengukuran } from "@/types";

function CariBalitaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [balitaList, setBalitaList] = useState<Balita[]>([]);
  const [currentPengukuran, setCurrentPengukuran] = useState<Pengukuran[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const isMeasurementMode = searchParams.get("mode") === "ukur";
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(() => {
      if (isActive) setLoadState("loading");
    });

    Promise.all([getBalitaList(), getPengukuranList(currentMonth, currentYear)])
      .then(([balitaData, pengukuranData]) => {
        if (!isActive) return;
        setBalitaList(balitaData);
        setCurrentPengukuran(pengukuranData);
        setLoadState("success");
      })
      .catch((err) => {
        console.error(err);
        if (isActive) setLoadState("error");
      });

    return () => {
      isActive = false;
    };
  }, [currentMonth, currentYear]);

  useEffect(() => {
    const nameParam = searchParams.get("name");
    if (nameParam) {
      setSearchTerm(nameParam);
    }
  }, [searchParams]);

  const measuredBalitaIds = new Set(
    currentPengukuran.map((pengukuran) => pengukuran.balitaId).filter(Boolean),
  );

  const selectableBalitaList = isMeasurementMode
    ? balitaList.filter((balita) => {
        const isMeasuredThisMonth = measuredBalitaIds.has(balita.id);
        return !isMeasuredThisMonth;
      })
    : balitaList;

  const filteredData = selectableBalitaList.filter((balita) =>
    balita.nama.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const emptyTitle =
    isMeasurementMode && selectableBalitaList.length === 0
      ? "Semua balita sudah diukur bulan ini"
      : "Balita tidak ditemukan";
  const emptyDescription =
    isMeasurementMode && selectableBalitaList.length === 0
      ? "Tidak ada balita yang perlu diinput pengukurannya untuk periode saat ini."
      : "Coba ketik nama lain atau periksa kembali ejaan nama balita.";

  if (loadState !== "success") {
    return (
      <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
        <Navbar
          title={isMeasurementMode ? "Input Pengukuran" : "Pilih Balita"}
        />
        <main className="p-4 sm:p-6 max-w-3xl mx-auto mt-2">
          <PageStatusState
            tone={loadState === "error" ? "error" : "loading"}
            title={
              loadState === "error"
                ? "Data pencarian belum bisa dimuat"
                : "Memuat data pencarian"
            }
            description={
              loadState === "error"
                ? "Terjadi gangguan saat mengambil data balita atau status pengukuran bulan ini. Coba muat ulang halaman."
                : "Mengambil data balita dan status pengukuran bulan ini."
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
      <Navbar title={isMeasurementMode ? "Input Pengukuran" : "Pilih Balita"} />

      <main className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 mt-2">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors bg-white shrink-0 shadow-sm"
          >
            <ArrowLeft size={20} className="text-black" />
          </Link>
          <PageHeader
            eyebrow={isMeasurementMode ? "Pengukuran" : "Pencarian"}
            title={
              isMeasurementMode
                ? "Pilih Balita yang Belum Diukur"
                : "Pilih Balita"
            }
            description={
              isMeasurementMode
                ? "Daftar ini hanya menampilkan balita yang perlu pengukuran pada bulan ini."
                : "Cari nama balita lalu buka detail untuk melihat riwayat dan data lengkap."
            }
          />
        </div>

        {isMeasurementMode && (
          <InfoPanel title="Mode input pengukuran">
            Pilih salah satu balita. Setelah dipilih, halaman akan langsung
            membuka form pengukuran.
          </InfoPanel>
        )}

        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10"
            size={20}
          />
          <input
            type="text"
            placeholder="Ketik nama balita"
            className="pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-white w-full focus:outline-none focus:ring-2 focus:ring-teal-100 text-base shadow-sm font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {filteredData.length > 0 ? (
            filteredData.map((balita) => (
              <Card
                key={balita.id}
                onClick={() =>
                  router.push(
                    isMeasurementMode
                      ? `/dashboard/balita/${balita.id}/ukur`
                      : `/dashboard/balita/${balita.id}`,
                  )
                }
                className="p-5 flex items-start gap-4 cursor-pointer hover:border-teal-200 hover:shadow-md hover:shadow-teal-50 transition-all border border-gray-100 shadow-sm rounded-xl bg-white"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    balita.jenisKelamin === "PEREMPUAN"
                      ? "bg-[#fce5f1] text-pink-500"
                      : "bg-[#e5f5fd] text-sky-500"
                  }`}
                >
                  <Baby size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-black text-black truncate">
                    {balita.nama}
                  </h2>
                  <p className="text-sm text-gray-700 mt-1">
                    {balita.jenisKelamin === "PEREMPUAN"
                      ? "Perempuan"
                      : "Laki-laki"}
                  </p>
                  {isMeasurementMode && (
                    <p className="inline-flex mt-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-black">
                      Belum diukur bulan ini
                    </p>
                  )}
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    Wali: {balita.namaWali}. RT {balita.rt}/RW {balita.rw}
                  </p>
                </div>
              </Card>
            ))
          ) : (
            <EmptyState title={emptyTitle} description={emptyDescription} />
          )}
        </div>
      </main>
    </div>
  );
}

export default function CariBalitaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 text-black font-sans flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-gray-500">
              Memuat pencarian...
            </p>
          </div>
        </div>
      }
    >
      <CariBalitaContent />
    </Suspense>
  );
}
