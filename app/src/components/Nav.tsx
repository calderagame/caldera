"use client";

import Image from "next/image";
import Link from "next/link";
import { ConnectButton } from "@/components/ConnectButton";
import { XLink } from "@/components/XLink";
import { targetChain } from "@/lib/chains";

type NavActive = "home" | "how" | "docs";

const LINKS: { href: string; label: string; id: NavActive }[] = [
  { href: "/", label: "Home", id: "home" },
  { href: "/how-it-works", label: "How it works", id: "how" },
  { href: "/docs", label: "Docs", id: "docs" },
];

export function Nav({ active = "home" }: { active?: NavActive }) {
  return (
    <header className="relative z-20 flex items-center justify-between gap-4 border-b border-line/70 px-4 py-3 sm:px-6">
      <Link href="/" className="flex shrink-0 items-center gap-3">
        <Image
          src="/caldera-logo.png"
          alt="Caldera"
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
          priority
        />
        <div>
          <p className="font-display text-lg tracking-[0.08em] text-foam">
            CALDERA
          </p>
          <p className="text-[10px] uppercase tracking-[0.22em] text-mist">
            Seven vents · one board
          </p>
        </div>
      </Link>

      <nav className="hidden items-center gap-5 text-[11px] uppercase tracking-[0.18em] text-mist lg:flex xl:gap-6">
        {LINKS.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            className={
              active === link.id ? "text-foam" : "transition hover:text-foam"
            }
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <nav className="flex max-w-[42vw] items-center gap-3 overflow-x-auto text-[10px] uppercase tracking-[0.14em] text-mist lg:hidden">
        {LINKS.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            className={[
              "shrink-0 whitespace-nowrap",
              active === link.id ? "text-foam" : "hover:text-foam",
            ].join(" ")}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
        <span className="hidden border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-mist sm:inline">
          {targetChain.name}
        </span>
        <XLink className="h-8 w-8" />
        <ConnectButton />
      </div>
    </header>
  );
}
