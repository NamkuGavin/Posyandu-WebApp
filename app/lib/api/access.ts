import { getCurrentUser } from "@/lib/api/auth";
import { isAdminProfile } from "@/lib/roles";

export async function assertOperationalWriteAccess() {
  const profile = await getCurrentUser();

  if (isAdminProfile(profile)) {
    throw new Error(
      "Akun admin hanya memiliki akses baca untuk data operasional kader.",
    );
  }
}
