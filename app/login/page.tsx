import LoginForm from "@/components/auth/LoginForm";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <AuthPageLayout
      icon={<ShieldCheck size={22} />}
      title="Masuk Akun"
      description="Gunakan NIK atau username dan password akun Anda."
    >
      <LoginForm />
    </AuthPageLayout>
  );
}
