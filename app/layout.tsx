import type { Metadata } from "next";
import Script from "next/script";
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
        <Script src="https://swetrix.org/swetrix.js" strategy="afterInteractive" />
        <Script id="swetrix-init" strategy="afterInteractive">
          {`
            document.addEventListener('DOMContentLoaded', function() {
              if (window.swetrix) {
                swetrix.init('JxnEBvQfmUjb', {
                  apiURL: 'https://swetrixapi.kindra.is/log',
                });
                swetrix.trackViews();
              }
            });
            if (document.readyState !== 'loading' && window.swetrix) {
              swetrix.init('JxnEBvQfmUjb', {
                apiURL: 'https://swetrixapi.kindra.is/log',
              });
              swetrix.trackViews();
            }
          `}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://swetrixapi.kindra.is/log/noscript?pid=JxnEBvQfmUjb"
            alt=""
            referrerPolicy="no-referrer-when-downgrade"
          />
        </noscript>
      </body>
    </html>
  );
}
