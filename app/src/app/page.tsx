"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { formatEther, formatUnits } from "viem";
import { Nav } from "@/components/Nav";
import { CommandHud } from "@/components/CommandHud";
import { BottomStrip } from "@/components/BottomStrip";
import { ConnectButton } from "@/components/ConnectButton";
import { MiningVault } from "@/components/MiningVault";
import {
  CALDERA_GAME,
  CALDERA_MINER,
  CALDERA_TOKEN,
  erc20Abi,
  gameAbi,
  isConfigured,
  minerAbi,
} from "@/lib/contracts";
import { LAND_COUNT, formatLandId } from "@/lib/lands";

const Globe = dynamic(
  () => import("@/components/Globe").then((m) => m.Globe),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[48vh] items-center justify-center bg-void">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist">
          Acquiring orbital lock…
        </p>
      </div>
    ),
  },
);

export default function Home() {
  const [selected, setSelected] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState<{
    id: number;
    nonce: number;
  } | null>(null);
  const { address } = useAccount();

  const { data: stats } = useReadContracts({
    contracts: isConfigured
      ? [
          {
            address: CALDERA_GAME,
            abi: gameAbi,
            functionName: "totalSeizes",
          },
          {
            address: CALDERA_GAME,
            abi: gameAbi,
            functionName: "activeLands",
          },
          {
            address: CALDERA_GAME,
            abi: gameAbi,
            functionName: "startingPrice",
          },
        ]
      : [],
    query: { enabled: isConfigured, refetchInterval: 12_000 },
  });

  const { data: pending } = useReadContract({
    address: CALDERA_MINER,
    abi: minerAbi,
    functionName: "pendingMining",
    args: address ? [address] : undefined,
    query: { enabled: isConfigured && !!address, refetchInterval: 12_000 },
  });

  const { data: vaultBal } = useReadContract({
    address: CALDERA_TOKEN,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [CALDERA_MINER],
    query: { enabled: isConfigured, refetchInterval: 12_000 },
  });

  const seizes =
    stats?.[0]?.result !== undefined ? String(stats[0].result as bigint) : "—";
  const active =
    stats?.[1]?.result !== undefined
      ? String(stats[1].result as bigint)
      : "0";
  const floor =
    stats?.[2]?.result !== undefined
      ? Number(formatEther(stats[2].result as bigint)).toFixed(4)
      : "—";
  const pendingLabel =
    pending !== undefined
      ? Number(formatUnits(pending, 18)).toFixed(2)
      : "0.00";
  const vaultLabel = (() => {
    if (vaultBal === undefined) return "—";
    const n = Number(formatUnits(vaultBal, 18));
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
    return n.toFixed(2);
  })();

  const landLabel = useMemo(
    () => (selected == null ? "—" : formatLandId(selected)),
    [selected],
  );

  const onSelect = (id: number) => {
    setSelected(id);
    setSheetOpen(true);
  };

  const onFocusLand = (id: number) => {
    setSelected(id);
    setFocusRequest((prev) => ({ id, nonce: (prev?.nonce ?? 0) + 1 }));
    setSheetOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-void">
      <Nav active="home" />

      <main className="relative flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[0.85fr_1.5fr_0.95fr] lg:items-stretch">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 55% at 50% 48%, rgba(216,74,5,0.10), transparent 62%), radial-gradient(ellipse 35% 30% at 85% 18%, rgba(255,106,0,0.08), transparent 50%)",
          }}
        />

        <section className="relative z-10 flex flex-col justify-center px-5 py-6 sm:px-8 lg:py-0 lg:pl-10 lg:pr-3 animate-fadeUp">
          <p className="text-[10px] uppercase tracking-[0.28em] text-copper">
            Robinhood Chain
          </p>
          <h1 className="mt-3 font-display text-[2.6rem] leading-[0.95] tracking-tight text-foam sm:text-5xl lg:text-[4rem]">
            Conquer.
            <br />
            Earn.
            <br />
            Get Outbid.
          </h1>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist">
            {LAND_COUNT} territories. One board. Seize with ETH. Mine CLDR from
            buybacks.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ConnectButton size="hero" />
            <a
              href="/how-it-works"
              className="border border-line px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-mist transition hover:border-copper hover:text-foam"
            >
              How it works
            </a>
          </div>

          <div className="mt-7 grid max-w-xs grid-cols-2 gap-x-6 gap-y-3">
            <Mini label="Genesis Floor" value={`${floor} ETH`} />
            <Mini label="Active Territories" value={active} />
            <Mini label="Total Seizes" value={seizes} />
            <Mini label="Your Pending" value={`${pendingLabel} CLDR`} />
          </div>

          <MiningVault />
        </section>

        <section className="relative z-10 min-h-[52vh] lg:min-h-0">
          <Globe
            selected={selected}
            onSelect={onSelect}
            states={{}}
            focusRequest={focusRequest}
          />
        </section>

        <section className="relative z-10 hidden px-4 py-8 lg:flex lg:items-center lg:pl-3 lg:pr-8 animate-fadeUp">
          <div className="ml-auto w-full max-w-md">
            <CommandHud landId={selected} onFocusLand={onFocusLand} />
          </div>
        </section>
      </main>

      {sheetOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-x-0 -top-[100vh] h-[100vh] bg-void/50"
            aria-label="Dismiss"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative max-h-[70vh] overflow-auto">
            <CommandHud
              landId={selected}
              mobileSheet
              onClose={() => setSheetOpen(false)}
              onFocusLand={onFocusLand}
            />
          </div>
        </div>
      )}

      <BottomStrip
        floor={floor}
        pending={pendingLabel}
        vault={vaultLabel}
        seizes={seizes}
        active={active}
        landLabel={landLabel}
      />
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em] text-mist">{label}</p>
      <p className="mt-1 font-mono text-sm text-foam">{value}</p>
    </div>
  );
}
