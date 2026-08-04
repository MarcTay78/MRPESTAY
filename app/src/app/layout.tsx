import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ESTAY MRP",
  description: "Solid Wood Dining Set Production Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
