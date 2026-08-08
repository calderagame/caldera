"use client";

import { Flame, Activity, Layers, Gauge, Clock } from "lucide-react";

type Props = {
  active: string;
  floor: string;
  seizes: string;
  vault: string;
  onViewMap: () => void;
};

export function DiagnosticsPanel({
  active,
  floor,
  seizes,
  vault,
  onViewMap,
}: Props) {
  const rows = [
    {
      icon: Flame,
      label: "Core Temperature",
      value: "NOMINAL",
      hint: "Lava feed stable",
    },
    {
      icon: Layers,
      label: "Active Territories",
      value: active,
      hint: "of 7 vents",
    },
    {
      icon: Activity,
      label: "24h Activity",
      value: seizes === "—" ? "—" : seizes,
      hint: "total seizes (all-time)",
    },
    {
      icon: Gauge,
      label: "Current Yield",
      value: `${vault} CLDR`,
      hint: "mining vault",
    },
    {
      icon: Clock,
      label: "Genesis Floor",
      value: `${floor} ETH`,
      hint: "current epoch entry",
    },
  ];

  return (
    <aside className="cal-panel flex h-full flex-col">
      <div className="border-b border-[rgba(255,120,40,0.12)] px-4 py-3">
        <p className="cal-label flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-copper animate-lavaPulse" />
          Network Status
        </p>
        <h2 className="mt-1 font-display text-lg uppercase tracking-[0.12em] text-foam">
          Reactor Diagnostics
        </h2>
      </div>

      <ul className="flex flex-1 flex-col divide-y divide-[rgba(255,120,40,0.1)]">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-start gap-3 px-4 py-3.5 transition hover:-translate-y-0.5 hover:bg-ink"
          >
            <row.icon
              className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.25] text-copper"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="cal-label">{row.label}</p>
              <p className="mt-1 font-mono text-sm text-foam tabular-nums">
                {row.value}
              </p>
              <p className="mt-0.5 text-[11px] text-mist">{row.hint}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-[rgba(255,120,40,0.12)] p-4">
        <button type="button" onClick={onViewMap} className="cal-btn-primary w-full">
          View Live Map
        </button>
      </div>
    </aside>
  );
}
