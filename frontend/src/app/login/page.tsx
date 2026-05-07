import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      mascot="/assets/Mascots/mas3.svg"
      title="Return to your healthy loop."
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
