import type { Metadata } from "next";
import "@coifyn/ui/styles.css";
import { Toaster } from "@coifyn/ui";
import { Providers } from "./providers";
import { AppShell } from "../components/AppShell";

export const metadata: Metadata = {
  title: "Coifyn — Salon Console",
  description: "Manage your salon, chairs, queue and bookings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
