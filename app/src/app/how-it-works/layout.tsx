import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Pick a territory, seize with ETH, mine CLDR, exit on outbid — Caldera in five steps.",
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
