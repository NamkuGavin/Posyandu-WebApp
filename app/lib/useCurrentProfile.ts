"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/api";
import { isAdminProfile } from "@/lib/roles";
import { KaderProfile } from "@/types";

export function useCurrentProfile() {
  const [profile, setProfile] = useState<KaderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    getCurrentUser()
      .then((data) => {
        if (isActive) setProfile(data);
      })
      .catch(() => {
        if (isActive) setProfile(null);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  return {
    profile,
    isLoading,
    isAdmin: isAdminProfile(profile),
  };
}
