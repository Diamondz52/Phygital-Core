import { AuthForm } from "@/features/auth";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  return <AuthForm mode={mode}/>;
}
