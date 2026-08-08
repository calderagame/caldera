"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Nav } from "@/components/Nav";
import { ContinentBoard } from "@/components/ContinentBoard";
import { CommandHud } from "@/components/CommandHud";
import { formatLandId } from "@/lib/lands";

const Globe = dynamic(
  () => import("@/components/Globe").then((m) => m.Globe),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[36vh] items-center justify-center bg-void">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist">
          Acquiring orbital lock…
        </p>
      </div>
    ),
  },
);

/**
 * Design preview: territory cards + Caldera globe + Command.
 * Not linked in main nav — open /ui-preview to evaluate.
 */
export default function UiPreviewPage() {
  const [selected, setSelected] = useState<number | null>(5);
  const [focusRequest, setFocusRequest] = useState<{
    id: number;
    nonce: number;
  } | null>(null);

  const onSelect = (id: number) => {
    setSelected(id);
    setFocusRequest((prev) => ({ id, nonce: (prev?.nonce ?? 0) + 1 }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-void">
      <Nav active="home" />

      <div className="border-b border-copper/40 bg-copper/10 px-4 py-2 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-copper">
          UI preview · territory board + globe · not production home
        </p>
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 0%, rgba(197,255,0,0.08), transparent 55%)",
        }}
      />

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="animate-fadeUp max-w-xl">
          <p className="text-[10px] uppercase tracking-[0.28em] text-copper">
            Caldera
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-foam sm:text-5xl">
            Board view
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-mist">
            Clarity board: every territory as a hard card with live
            floor. Globe stays for presence — cards are for speed.
          </p>
        </header>

        <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="flex min-h-0 flex-col gap-5">
            <div className="relative min-h-[38vh] overflow-hidden border border-line/70 bg-ink lg:min-h-[42vh]">
              <Globe
                selected={selected}
                onSelect={onSelect}
                states={{}}
                focusRequest={focusRequest}
              />
              <p className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.14em] text-mist">
                {selected == null ? "Select a territory" : formatLandId(selected)}
              </p>
            </div>

            <ContinentBoard selected={selected} onSelect={onSelect} />
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="mx-auto w-full max-w-md">
              <CommandHud landId={selected} onFocusLand={onSelect} />
            </div>
          </aside>
        </div>

        <footer className="border-t border-line/60 py-8">
          <p className="max-w-2xl text-sm text-mist">
            Bu sayfa sadece tasarım denemesi. Beğenirsen production home’a
            taşıyabiliriz — ekonomi ve 7 kıta aynı kalır.
          </p>
        </footer>
      </main>
    </div>
  );
}
