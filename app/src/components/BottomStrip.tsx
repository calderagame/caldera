"use client";

import { LAND_COUNT } from "@/lib/lands";
import { XLink } from "@/components/XLink";

export function BottomStrip({
  floor,
  pending,
  vault,
  seizes,
  active,
  landLabel,
}: {
  floor: string;
  pending: string;
  vault: string;
  seizes: string;
  active: string;
  landLabel: string;
}) {
  const ticker = [
    "SEVEN VENTS · ONE BOARD",
    "ZOOM TO SELECT",
    "SEIZE WITH ETH",
    "85% BACK ON OUTBID",
    "3% STAKERS · 10% BUYBACK · 2% PROTOCOL",
    "FAIR LAUNCH",
    "NO TEAM SUPPLY",
    `${LAND_COUNT} TERRITORIES`,
    "ROBINHOOD CHAIN",
    "CLDR ON STONKS",
  ];

  return (
    <footer className="relative z-30 border-t border-line/80 bg-void/95">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-mist sm:px-6">
        <Metric label="Floor" value={`${floor} ETH`} hot />
        <Metric label="Vault" value={`${vault} CLDR`} hot />
        <Metric label="Yours" value={`${pending} CLDR`} />
        <Metric label="Last Focus" value={landLabel} />
        <Metric label="Active" value={active} />
        <Metric label="Seizes" value={seizes} />
        <Metric label="Chain" value="Robinhood" />
        <Metric label="Territories" value={`${LAND_COUNT}`} />
        <span className="text-copper">Fair Launch · No Team Supply</span>
        <span className="inline-flex items-center gap-2">
          <XLink className="h-6 w-6" />
          <span className="text-mist">Stonks</span>
        </span>
      </div>

      <div className="overflow-hidden border-t border-line/50 py-1.5">
        <div className="flex w-max animate-ticker whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] text-mist/80">
          {[...ticker, ...ticker].map((t, i) => (
            <span key={`${t}-${i}`} className="mx-6">
              {t}
              <span className="mx-6 text-copper/50">◆</span>
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

function Metric({
  label,
  value,
  hot,
}: {
  label: string;
  value: string;
  hot?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span>{label}</span>
      <span className={hot ? "text-gold" : "text-foam"}>{value}</span>
    </span>
  );
}
