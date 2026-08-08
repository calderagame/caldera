"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { DocsSectionView } from "@/components/DocsContent";
import { DOC_NAV, DOC_SECTIONS } from "@/lib/docs";

export default function DocsPage() {
  const [active, setActive] = useState(DOC_NAV[0]?.id ?? "overview");

  useEffect(() => {
    const nodes = DOC_NAV.map((s) => document.getElementById(s.id)).filter(
      (n): n is HTMLElement => !!n,
    );
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.4, 0.7] },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-void">
      <Nav active="docs" />

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 15% 0%, rgba(255,106,0,0.08), transparent 55%), radial-gradient(ellipse 45% 35% at 90% 20%, rgba(216,74,5,0.07), transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <aside className="sticky top-24 hidden h-[calc(100vh-8rem)] w-52 shrink-0 overflow-y-auto lg:block">
          <p className="text-[10px] uppercase tracking-[0.22em] text-copper">
            Documentation
          </p>
          <nav className="mt-5 flex flex-col gap-1">
            {DOC_NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={[
                  "border-l px-3 py-1.5 text-[12px] tracking-[0.04em] transition",
                  active === item.id
                    ? "border-copper text-foam"
                    : "border-line/60 text-mist hover:border-mist hover:text-foam",
                ].join(" ")}
              >
                {item.title}
              </a>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 animate-fadeUp">
          <header className="border-b border-line/60 pb-10">
            <p className="text-[10px] uppercase tracking-[0.28em] text-copper">
              Caldera Protocol
            </p>
            <h1 className="mt-3 font-display text-4xl tracking-tight text-foam sm:text-5xl lg:text-6xl">
              Docs
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-mist">
              How conquest, pricing, mining, and staking work on Robinhood
              Chain — written for operators and players who want the full
              picture.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.14em] text-mist">
              <span className="text-foam">7 territories</span>
              <span>ETH seize</span>
              <span>85 · 3 · 10 · 2</span>
              <span>Fair launch</span>
            </div>
          </header>

          {/* Mobile TOC */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {DOC_NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="shrink-0 border border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-mist hover:border-copper hover:text-foam"
              >
                {item.title}
              </a>
            ))}
          </div>

          {DOC_SECTIONS.map((section) => (
            <DocsSectionView key={section.id} section={section} />
          ))}

          <footer className="border-t border-line/60 py-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">
              Caldera · Seven vents · one board · Robinhood Chain
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
