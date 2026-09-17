import { LoginForm } from "./LoginForm";

export function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-xl font-semibold">Sign in to Coifyn operator console</h1>
      <LoginForm />
    </main>
  );
}
