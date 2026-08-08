"use client";

import Link from "next/link";
import { Nav } from "@/components/Nav";

const STEPS = [
  {
    n: "01",
    title: "Pick a territory",
    body: "Seven vents · one board. Seven territories — zoom the globe, select one, open Command.",
    cue: "Select · Focus",
  },
  {
    n: "02",
    title: "Seize with ETH",
    body: "Pay the live floor. Ownership flips instantly. Genesis lands open at the shared starting price.",
    cue: "ETH · Floor +10%",
  },
  {
    n: "03",
    title: "Mine while you hold",
    body: "Each seize feeds the buyback vault. Land holders claim CLDR from that vault — no team prefund.",
    cue: "Vault → Claim",
  },
  {
    n: "04",
    title: "Exit on outbid",
    body: "When someone seizes your land, you receive 85% of the new price in ETH — immediately. No stuck inventory.",
    cue: "85% ETH · Instant",
  },
  {
    n: "05",
    title: "Stake (optional)",
    body: "Stake CLDR to earn a share of the 3% ETH slice on every seize across the world. Unstake anytime.",
    cue: "3% · Instant unstake",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-void">
      <Nav active="how" />

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% -5%, rgba(255,106,0,0.10), transparent 58%), radial-gradient(ellipse 40% 35% at 92% 40%, rgba(216,74,5,0.06), transparent 52%)",
        }}
      />

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
        <header className="animate-fadeUp border-b border-line/70 pb-12">
          <p className="text-[10px] uppercase tracking-[0.28em] text-copper">
            Caldera
          </p>
          <h1 className="mt-3 font-display text-[2.75rem] leading-[0.95] tracking-tight text-foam sm:text-6xl">
            How it
            <br />
            works
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-mist">
            Conquer a territory. Earn while you hold. Cash out when outbid.
            One loop — no seasons required.
          </p>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mist">
            <span className="text-foam">7 territories</span>
            <span>ETH seize</span>
            <span>CLDR mine</span>
            <span>Fair launch</span>
          </div>
        </header>

        <ol className="relative mt-4">
          {/* spine */}
          <div
            aria-hidden
            className="absolute bottom-8 left-[1.15rem] top-8 w-px bg-gradient-to-b from-copper/70 via-line to-transparent sm:left-[1.35rem]"
          />

          {STEPS.map((step, i) => (
            <li
              key={step.n}
              className="relative grid grid-cols-[2.5rem_1fr] gap-4 py-8 sm:grid-cols-[3rem_1fr] sm:gap-6 animate-fadeUp"
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              <div className="relative z-10 flex flex-col items-center">
                <span className="flex h-9 w-9 items-center justify-center border border-copper/55 bg-ink font-mono text-[11px] text-copper sm:h-10 sm:w-10">
                  {step.n}
                </span>
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-copper">
                  {step.cue}
                </p>
                <h2 className="mt-1.5 font-display text-2xl tracking-tight text-foam sm:text-3xl">
                  {step.title}
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-mist sm:text-[15px]">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <section
          className="mt-4 animate-fadeUp border border-copper/35 bg-panel/90 px-5 py-6 sm:px-7"
          style={{ animationDelay: "620ms" }}
        >
          <p className="text-[10px] uppercase tracking-[0.22em] text-copper">
            Every seize splits
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["85%", "Previous owner"],
              ["3%", "CLDR stakers"],
              ["10%", "Buyback → vault"],
              ["2%", "Protocol"],
            ].map(([pct, label]) => (
              <div key={pct}>
                <p className="font-display text-2xl text-foam tabular-nums">
                  {pct}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center animate-fadeUp"
          style={{ animationDelay: "720ms" }}
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-copper bg-copper/15 px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-foam transition hover:bg-copper/25"
          >
            Open the globe
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center justify-center border border-line px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-mist transition hover:border-mist hover:text-foam"
          >
            Full protocol docs
          </Link>
        </div>

        <footer className="mt-16 border-t border-line/60 pt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">
            Caldera · Seven vents · one board · Robinhood Chain
          </p>
        </footer>
      </main>
    </div>
  );
}
