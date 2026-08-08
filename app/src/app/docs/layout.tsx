import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Caldera protocol docs — lands, ETH seize pricing, mining, staking, and fair launch on Robinhood Chain.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
