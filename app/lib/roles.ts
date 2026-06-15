import { KaderProfile } from "@/types";

export function isAdminProfile(profile?: Pick<KaderProfile, "role"> | null) {
  return profile?.role?.toUpperCase() === "ADMIN";
}
