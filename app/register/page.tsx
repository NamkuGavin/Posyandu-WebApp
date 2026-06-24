import { UserPlus } from "lucide-react";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthPageLayout
      icon={<UserPlus size={22} />}
      title="Daftar Akun Kader"
      description="Buat akun secara mandiri untuk mengakses layanan kader Posyandu."
    >
      <RegisterForm />
    </AuthPageLayout>
  );
}
