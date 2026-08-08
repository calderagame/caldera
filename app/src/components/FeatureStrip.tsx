"use client";

import { Pickaxe, Shield, Flame, Coins, Landmark } from "lucide-react";

const FEATURES = [
  {
    icon: Pickaxe,
    title: "Mine",
    body: "Hold a vent. Accrue CLDR from buyback-funded vault.",
  },
  {
    icon: Shield,
    title: "Control",
    body: "Seven scarce territories. Own the floor or lose it.",
  },
  {
    icon: Flame,
    title: "Burn",
    body: "Seize ETH buys CLDR into the core — supply meets conquest.",
  },
  {
    icon: Coins,
    title: "Earn",
    body: "Outbid returns 85% ETH. Stake CLDR for the 3% stream.",
  },
  {
    icon: Landmark,
    title: "Govern",
    body: "Transparent split. No team mint. Protocol is the machine.",
  },
] as const;

export function FeatureStrip() {
  return (
    <section className="border-y border-[rgba(255,120,40,0.12)] bg-panel">
      <div className="mx-auto grid max-w-[1400px] divide-y divide-[rgba(255,120,40,0.12)] sm:grid-cols-2 sm:divide-x lg:grid-cols-5 lg:divide-y-0">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="group px-5 py-6 transition hover:-translate-y-0.5"
          >
            <f.icon
              className="h-5 w-5 stroke-[1.25] text-copper transition group-hover:scale-105"
              aria-hidden
            />
            <h3 className="mt-4 font-display text-xs uppercase tracking-[0.2em] text-foam">
              {f.title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-mist">
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
