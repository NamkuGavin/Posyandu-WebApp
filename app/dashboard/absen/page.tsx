"use client";

import { useEffect, useState } from "react";
import {
  Baby,
  CheckCircle2,
  ChevronDown,
  Search,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import {
  EmptyState,
  InfoPanel,
  PageHeader,
  PageStatusState,
} from "@/components/ui/PageParts";
import { getBalitaList, getAbsensiList, bulkUpdateAbsensi } from "@/lib/api";
import { useCurrentProfile } from "@/lib/useCurrentProfile";
import { useToast } from "@/components/ui/Toast";
import { Absensi, Balita } from "@/types";

const months = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function AbsenBalitaPage() {
  const [filter, setFilter] = useState("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [balitaList, setBalitaList] = useState<Balita[]>([]);
  const [absenData, setAbsenData] = useState<Absensi[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const { isAdmin, isLoading: isRoleLoading } = useCurrentProfile();
  const { warning } = useToast();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthOptions = months.slice(0, currentMonth);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const selectedMonthName = months[selectedMonth - 1];

  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(() => {
      if (isActive) setLoadState("loading");
    });

    Promise.all([getBalitaList(), getAbsensiList(selectedMonth, currentYear)])
      .then(([balitaData, absensiData]) => {
        if (!isActive) return;
        setBalitaList(balitaData);
        setAbsenData(absensiData);
        setLoadState("success");
      })
      .catch((err) => {
        console.error(err);
        if (isActive) setLoadState("error");
      });

    return () => {
      isActive = false;
    };
  }, [selectedMonth, currentYear]);

  const handleStatusChange = async (
    id: string,
    newStatus: "hadir" | "tidak",
  ) => {
    if (isAdmin || isRoleLoading) {
      warning("Admin hanya dapat melihat data absensi tanpa mengubah status.");
      return;
    }

    const isHadir = newStatus === "hadir";

    setAbsenData((prev) => {
      const existing = prev.find((absensi) => absensi.balitaId === id);
      if (existing) {
        return prev.map((absensi) =>
          absensi.balitaId === id ? { ...absensi, isHadir } : absensi,
        );
      }

      return [
        ...prev,
        { balitaId: id, isHadir, bulan: selectedMonth, tahun: currentYear },
      ];
    });

    try {
      await bulkUpdateAbsensi([
        { balitaId: id, isHadir, bulan: selectedMonth, tahun: currentYear },
      ]);
    } catch {
      const list = await getAbsensiList(selectedMonth, currentYear);
      setAbsenData(list);
    }
  };

  const hadirCount = absenData.filter((absensi) => absensi.isHadir).length;
  const belumHadirCount = Math.max(balitaList.length - hadirCount, 0);
  const filteredData = balitaList.filter((item) => {
    const absen = absenData.find((absensi) => absensi.balitaId === item.id);
    const currentStatus = absen?.isHadir ? "hadir" : "tidak";

    if (filter === "Sudah hadir" && currentStatus !== "hadir") return false;
    if (filter === "Belum hadir" && currentStatus !== "tidak") return false;
    return item.nama.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loadState !== "success") {
    return (
      <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
        <Navbar title="Absen Balita" />
        <main className="p-4 sm:p-6 max-w-6xl mx-auto mt-2">
          <PageStatusState
            tone={loadState === "error" ? "error" : "loading"}
            title={
              loadState === "error"
                ? "Data absensi belum bisa dimuat"
                : "Memuat data absensi"
            }
            description={
              loadState === "error"
                ? "Terjadi gangguan saat mengambil data balita atau absensi periode ini. Coba muat ulang halaman."
                : "Mengambil data balita dan absensi periode ini."
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
      <Navbar title="Absen Balita" />
      <main className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 mt-2">
        <PageHeader
          eyebrow="Absensi"
          title={`Absen ${selectedMonthName} ${currentYear}`}
          description="Tandai hadir atau tidak hadir untuk setiap balita. Perubahan langsung disimpan ke server."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <Users className="text-blue-600" size={22} />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Total
                </p>
                <p className="text-2xl font-black text-gray-950">
                  {balitaList.length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-600" size={22} />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Hadir
                </p>
                <p className="text-2xl font-black text-emerald-600">
                  {hadirCount}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <XCircle className="text-rose-600" size={22} />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Belum Hadir
                </p>
                <p className="text-2xl font-black text-rose-600">
                  {belumHadirCount}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
            <div>
              <label className="text-xs font-black text-gray-500 ml-1">
                Bulan absen {currentYear}
              </label>
              <div className="relative mt-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setLoadState("loading");
                    setSelectedMonth(Number(e.target.value));
                  }}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-xl p-3.5 pr-10 text-base font-bold text-black focus:outline-none focus:ring-2 focus:ring-teal-100 shadow-sm cursor-pointer"
                >
                  {monthOptions.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-xs font-black text-gray-500 ml-1">
                Cari balita
              </label>
              <Search
                className="absolute left-4 bottom-3.5 text-gray-400 z-10"
                size={20}
              />
              <input
                type="text"
                placeholder="Ketik nama balita"
                className="pl-12 pr-4 py-3.5 mt-2 border border-gray-200 rounded-xl bg-white w-full focus:outline-none focus:ring-2 focus:ring-teal-100 text-base shadow-sm font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <InfoPanel title="Petunjuk absensi">
          Gunakan tombol Hadir bila balita datang ke posyandu. Gunakan Tidak
          bila belum hadir pada periode yang dipilih.
        </InfoPanel>

        {isAdmin && (
          <InfoPanel title="Mode admin baca saja" icon={ShieldCheck}>
            Admin dapat memantau absensi per periode, tetapi perubahan status
            hadir atau tidak hadir hanya dilakukan oleh kader.
          </InfoPanel>
        )}

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {["Semua", "Sudah hadir", "Belum hadir"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-5 py-2.5 rounded-full text-sm font-black whitespace-nowrap transition-all duration-300 active:scale-95 border ${
                filter === tab
                  ? "bg-[#1fb999] text-white border-[#1fb999] shadow-sm shadow-teal-100"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredData.length > 0 ? (
            filteredData.map((balita) => {
              const isHadir = absenData.find(
                (absensi) => absensi.balitaId === balita.id,
              )?.isHadir;

              return (
                <Card
                  key={balita.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white border border-gray-100 shadow-sm rounded-xl gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        balita.jenisKelamin === "PEREMPUAN"
                          ? "bg-[#fce5f1] text-pink-500"
                          : "bg-[#e5f5fd] text-sky-500"
                      }`}
                    >
                      <Baby size={22} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-black text-black truncate">
                        {balita.nama}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        RT {balita.rt}/RW {balita.rw}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(balita.id, "hadir")}
                      disabled={isAdmin || isRoleLoading}
                      className={`px-5 py-3 rounded-xl text-sm font-black transition-all active:scale-95 ${
                        isHadir
                          ? "bg-[#22c55e] text-white shadow-sm shadow-green-100"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      Hadir
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(balita.id, "tidak")}
                      disabled={isAdmin || isRoleLoading}
                      className={`px-5 py-3 rounded-xl text-sm font-black transition-all active:scale-95 ${
                        isHadir === false
                          ? "bg-[#ffe4e6] text-[#e11d48] shadow-sm shadow-rose-100"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      Tidak
                    </button>
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="md:col-span-2">
              <EmptyState
                title="Data tidak ditemukan"
                description="Coba ganti filter atau ketik nama balita lainnya."
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
