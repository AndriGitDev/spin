import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPIN - Start Picking Instead of Negotiating",
  description: "Make decisions faster with our spinning wheel app. Stop the back-and-forth and let the wheel decide!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
