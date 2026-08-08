import type { Metadata } from "next";
import { Syne, Manrope, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Caldera",
    template: "%s · Caldera",
  },
  description:
    "Conquer. Earn. Get Outbid. Territory control on Robinhood Chain.",
  icons: {
    icon: [{ url: "/caldera-logo.png", type: "image/png" }],
  },
  twitter: {
    card: "summary",
    site: "@calderagamexyz",
    creator: "@calderagamexyz",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} font-body antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
