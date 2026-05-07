import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="New account"
      mascot="/assets/Mascots/mas6.svg"
      title="Build your orbit from day one."
    >
      <AuthForm mode="register" />
    </AuthShell>
  );
}
