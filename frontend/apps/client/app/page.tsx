import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// The proxy already gates on the refresh cookie; this repeats the check only so
// a direct hit on "/" lands on the right screen, then enters Setup — the first
// screen of the Phase 1 salon-core flow.
export default async function Home() {
  const cookieStore = await cookies();
  if (!cookieStore.get("coifyn_refresh")) {
    redirect("/login");
  }

  redirect("/setup");
}
