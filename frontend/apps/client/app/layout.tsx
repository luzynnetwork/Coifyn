import type { Metadata } from "next";
import "@coifyn/ui/styles.css";
import { Providers } from "./providers";

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
