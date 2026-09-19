import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Real session validation happens server-side via the API. This only checks
// presence of the session cookie set at login, then sends staff into Setup —
// the first screen of the Phase 1 salon-core flow.
export default async function Home() {
  const cookieStore = await cookies();
  if (!cookieStore.get("coifyn_session")) {
    redirect("/login");
  }

  redirect("/setup");
}
