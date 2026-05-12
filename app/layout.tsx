import "./globals.css";
import type { Metadata, Viewport } from "next";
import Nav from "@/components/Nav";
import StolenWatcher from "@/components/StolenWatcher";

export const metadata: Metadata = {
  title: "Ownd — Run it. Own it.",
  description: "Territory-based running tracker. Every street you run becomes yours.",
  themeColor: "#05070a",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#05070a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="phone-shell">
          <div className="phone">
            <div className="scroll-area">{children}</div>
            <Nav />
            <StolenWatcher />
          </div>
        </div>
      </body>
    </html>
  );
}
