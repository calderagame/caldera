import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UI Preview · Continent board",
  robots: { index: false, follow: false },
};

export default function UiPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
