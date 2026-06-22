"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getAbsensiList,
  getBalitaList,
  getPengukuranList,
} from "@/lib/api";
import { Absensi, Balita, Pengukuran } from "@/types";

type LoadState = "loading" | "success" | "error";

type UsePeriodDataOptions = {
  includeAttendance?: boolean;
};

export function usePeriodData(
  month: number,
  year: number,
  { includeAttendance = false }: UsePeriodDataOptions = {},
) {
  const [balita, setBalita] = useState<Balita[]>([]);
  const [measurements, setMeasurements] = useState<Pengukuran[]>([]);
  const [attendance, setAttendance] = useState<Absensi[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let isActive = true;
    const requests = [
      getBalitaList(),
      getPengukuranList(month, year),
      includeAttendance
        ? getAbsensiList(month, year)
        : Promise.resolve([] as Absensi[]),
    ] as const;

    Promise.resolve().then(() => {
      if (isActive) setLoadState("loading");
    });

    Promise.all(requests)
      .then(([balitaData, measurementData, attendanceData]) => {
        if (!isActive) return;
        setBalita(balitaData);
        setMeasurements(measurementData);
        setAttendance(attendanceData);
        setLoadState("success");
      })
      .catch((error) => {
        console.error(error);
        if (isActive) setLoadState("error");
      });

    return () => {
      isActive = false;
    };
  }, [includeAttendance, month, reloadKey, year]);

  return {
    attendance,
    balita,
    loadState,
    measurements,
    reload,
  };
}
