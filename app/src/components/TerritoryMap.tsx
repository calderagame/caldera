"use client";

import { useMemo } from "react";
import { useReadContracts } from "wagmi";
import { formatEther } from "viem";
import {
  CALDERA_GAME,
  gameAbi,
  isConfigured,
} from "@/lib/contracts";
import {
  CONTINENTS,
  LAND_COUNT,
  formatLandCode,
  formatLandId,
  territoryStatus,
  type TerritoryStatus,
} from "@/lib/lands";

const STATUS_STYLE: Record<
  TerritoryStatus,
  { label: string; fill: string; border: string }
> = {
  neutral: {
    label: "Neutral",
    fill: "rgba(255,255,255,0.04)",
    border: "rgba(255,120,40,0.25)",
  },
  owned: {
    label: "Owned",
    fill: "rgba(84,210,122,0.12)",
    border: "#54D27A",
  },
  contested: {
    label: "Contested",
    fill: "rgba(255,138,61,0.14)",
    border: "#FF8A3D",
  },
  burning: {
    label: "Burning",
    fill: "rgba(255,106,0,0.22)",
    border: "#FF6A00",
  },
};

type Props = {
  selected: number | null;
  onSelect: (id: number) => void;
};

export function TerritoryMap({ selected, onSelect }: Props) {
  const contracts = useMemo(
    () =>
      isConfigured
        ? Array.from({ length: LAND_COUNT }, (_, i) => ({
            address: CALDERA_GAME,
            abi: gameAbi,
            functionName: "getLand" as const,
            args: [BigInt(i + 1)] as const,
          }))
        : [],
    [],
  );

  const { data } = useReadContracts({
    contracts,
    query: { enabled: isConfigured, refetchInterval: 12_000 },
  });

  return (
    <section className="cal-panel flex h-full min-h-[360px] flex-col">
      <div className="flex items-center justify-between border-b border-[rgba(255,120,40,0.12)] px-4 py-3">
        <div>
          <p className="cal-label">Live Feed</p>
          <h2 className="mt-0.5 font-display text-base uppercase tracking-[0.14em] text-foam">
            Territory Map
          </h2>
        </div>
        <Legend />
      </div>

      <div className="relative flex-1 overflow-hidden bg-[#0a0a0a] p-4">
        {/* Basalt field with lava rivers (SVG) */}
        <svg
          viewBox="0 0 100 72"
          className="absolute inset-0 h-full w-full opacity-40"
          aria-hidden
        >
          <rect width="100" height="72" fill="#0a0a0a" />
          <path
            d="M0 40 Q25 28 50 42 T100 35"
            fill="none"
            stroke="#FF6A00"
            strokeWidth="0.4"
            opacity="0.5"
          />
          <path
            d="M0 55 Q30 48 60 58 T100 50"
            fill="none"
            stroke="#D84A05"
            strokeWidth="0.35"
            opacity="0.4"
          />
          <path
            d="M10 10 Q40 20 70 8 T100 18"
            fill="none"
            stroke="#FF8A3D"
            strokeWidth="0.25"
            opacity="0.3"
          />
        </svg>

        <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {CONTINENTS.map((land, idx) => {
            const raw = data?.[idx]?.result as
              | readonly [string, bigint, bigint, bigint, bigint]
              | undefined;
            const owner = raw?.[0];
            const price = raw?.[1];
            const seizeCount = raw ? Number(raw[3]) : 0;
            const status = territoryStatus(owner, seizeCount);
            const style = STATUS_STYLE[status];
            const active = selected === land.id;

            return (
              <button
                key={land.id}
                type="button"
                onClick={() => onSelect(land.id)}
                className="group text-left transition hover:-translate-y-0.5"
                style={{
                  border: `1px solid ${active ? "#FF6A00" : style.border}`,
                  background: style.fill,
                  boxShadow: active
                    ? "0 0 0 1px rgba(255,106,0,0.45)"
                    : undefined,
                }}
              >
                <div className="px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] tracking-[0.16em] text-copper">
                      {formatLandCode(land.id)}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist">
                      {style.label}
                    </span>
                  </div>
                  <p className="mt-1.5 font-display text-sm uppercase tracking-[0.08em] text-foam">
                    {formatLandId(land.id)}
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-mist">
                    {price !== undefined
                      ? `${Number(formatEther(price)).toFixed(4)} ETH`
                      : "— ETH"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Legend() {
  const items: TerritoryStatus[] = [
    "owned",
    "contested",
    "neutral",
    "burning",
  ];
  return (
    <div className="hidden flex-wrap items-center gap-3 sm:flex">
      {items.map((s) => (
        <span
          key={s}
          className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-mist"
        >
          <span
            className="h-2 w-2"
            style={{ background: STATUS_STYLE[s].border }}
          />
          {STATUS_STYLE[s].label}
        </span>
      ))}
    </div>
  );
}
