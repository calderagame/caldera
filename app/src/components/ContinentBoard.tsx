"use client";

import { useReadContracts } from "wagmi";
import { formatEther } from "viem";
import {
  CALDERA_GAME,
  gameAbi,
  isConfigured,
} from "@/lib/contracts";
import { CONTINENTS, formatLandCode } from "@/lib/lands";

function short(addr?: string) {
  if (!addr || addr === "0x0000000000000000000000000000000000000000")
    return null;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function fmtEth(v?: bigint) {
  if (v === undefined) return "—";
  const n = Number(formatEther(v));
  if (n === 0) return "0";
  if (n >= 0.01) return n.toFixed(4);
  return n.toFixed(5);
}

type Props = {
  selected: number | null;
  onSelect: (id: number) => void;
};

/** Territory board — Caldera HUD language. */
export function ContinentBoard({ selected, onSelect }: Props) {
  const { data } = useReadContracts({
    contracts: isConfigured
      ? CONTINENTS.flatMap((c) => [
          {
            address: CALDERA_GAME,
            abi: gameAbi,
            functionName: "getLand" as const,
            args: [BigInt(c.id)] as const,
          },
          {
            address: CALDERA_GAME,
            abi: gameAbi,
            functionName: "nextPrice" as const,
            args: [BigInt(c.id)] as const,
          },
        ])
      : [],
    query: { enabled: isConfigured, refetchInterval: 12_000 },
  });

  return (
    <div className="w-full">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-copper">
            Continent board
          </p>
          <p className="mt-1 font-display text-xl text-foam sm:text-2xl">
            Pick · Seize · Hold
          </p>
        </div>
        <p className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-mist sm:block">
          7 lands · live floors
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CONTINENTS.map((c, i) => {
          const land = data?.[i * 2]?.result as
            | readonly [string, bigint, bigint, bigint, bigint]
            | undefined;
          const next = data?.[i * 2 + 1]?.result as bigint | undefined;
          const owner = land?.[0];
          const claimed = !!short(owner);
          const active = selected === c.id;

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className={[
                "group relative flex flex-col border bg-panel px-3 py-3 text-left transition",
                active
                  ? "border-copper"
                  : "border-line/80 hover:border-copper/60",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0"
                    style={{ background: c.accent }}
                    aria-hidden
                  />
                  <span className="font-mono text-[11px] tracking-[0.16em] text-copper">
                    {formatLandCode(c.id)}
                  </span>
                </div>
                <span
                  className={[
                    "font-mono text-[9px] uppercase tracking-[0.14em]",
                    claimed ? "text-mist" : "text-claim",
                  ].join(" ")}
                >
                  {claimed ? "Held" : "Open"}
                </span>
              </div>

              <p className="mt-2 font-display text-lg leading-none text-foam">
                {c.name}
              </p>

              <div className="mt-3 flex items-end justify-between gap-2 border-t border-line/50 pt-2.5">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-mist">
                    Seize
                  </p>
                  <p className="mt-0.5 font-mono text-sm tabular-nums text-foam">
                    {isConfigured ? `${fmtEth(next)} ETH` : "—"}
                  </p>
                </div>
                <span className="border border-copper/50 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-copper transition group-hover:bg-copper/15 group-hover:text-foam">
                  Focus
                </span>
              </div>

              {claimed && (
                <p className="mt-2 truncate font-mono text-[10px] text-mist/80">
                  {short(owner)}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
