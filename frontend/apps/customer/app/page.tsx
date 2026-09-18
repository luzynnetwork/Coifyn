import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Phase 0 placeholder: real session validation happens server-side via the API.
// This only checks presence of the session cookie set at login.
export default async function Home() {
  const cookieStore = await cookies();
  if (!cookieStore.get("coifyn_customer_session")) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Coifyn — empty shell.
      </p>
    </main>
  );
}
