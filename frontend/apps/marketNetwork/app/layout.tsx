import type { Metadata } from "next";
import "@coifyn/ui/styles.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Coifyn Discover",
  description: "Find and book verified stylists near you.",
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
