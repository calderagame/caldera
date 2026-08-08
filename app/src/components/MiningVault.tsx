"use client";

import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import {
  CALDERA_BUYBACK,
  CALDERA_MINER,
  CALDERA_TOKEN,
  buybackAbi,
  erc20Abi,
  isConfigured,
} from "@/lib/contracts";

function fmtVault(v?: bigint) {
  if (v === undefined) return "—";
  const n = Number(formatUnits(v, 18));
  if (n === 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

function fmtEthQueue(v?: bigint) {
  if (v === undefined) return null;
  const n = Number(formatUnits(v, 18));
  if (n <= 0) return null;
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(6);
}

/** Live mining vault — CLDR held for land-holder claims (buyback funded). */
export function MiningVault() {
  const { data: vaultCldr } = useReadContract({
    address: CALDERA_TOKEN,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [CALDERA_MINER],
    query: {
      enabled: isConfigured,
      refetchInterval: 12_000,
    },
  });

  const { data: ethQueued } = useReadContract({
    address: CALDERA_BUYBACK,
    abi: buybackAbi,
    functionName: "ethQueued",
    query: {
      enabled: isConfigured,
      refetchInterval: 12_000,
    },
  });

  const queueLabel = fmtEthQueue(ethQueued);

  return (
    <div className="mt-7 max-w-xs border border-copper/35 bg-panel/80 px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.22em] text-copper">
          Mining Vault
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
          Live
        </p>
      </div>
      <p className="mt-2 font-display text-3xl tracking-tight text-foam tabular-nums">
        {isConfigured ? fmtVault(vaultCldr) : "—"}
        <span className="ml-2 font-mono text-sm text-mist">CLDR</span>
      </p>
      <p className="mt-2 text-[11px] leading-snug text-mist">
        Buyback rewards waiting for land holders to claim.
      </p>
      {queueLabel && (
        <p className="mt-2 border-t border-line/60 pt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-mist">
          Buyback queue · {queueLabel} ETH
        </p>
      )}
    </div>
  );
}
