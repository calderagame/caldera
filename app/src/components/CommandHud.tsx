"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther, formatUnits, parseEther, parseUnits } from "viem";
import {
  CALDERA_GAME,
  CALDERA_MINER,
  CALDERA_STAKE,
  CALDERA_TOKEN,
  erc20Abi,
  gameAbi,
  isConfigured,
  minerAbi,
  stakeAbi,
} from "@/lib/contracts";
import { formatLandCode, formatLandId, landWeight } from "@/lib/lands";
import { ConnectButton } from "@/components/ConnectButton";

type Tab = "seize" | "lands" | "stake";

function short(addr?: string) {
  if (!addr || addr === "0x0000000000000000000000000000000000000000")
    return "Unclaimed";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/60 py-2.5">
      <span className="text-[10px] uppercase tracking-[0.16em] text-mist">
        {label}
      </span>
      <span className="font-mono text-[13px] text-foam">{value}</span>
    </div>
  );
}

function fmtEth(v?: bigint, digits = 4) {
  if (v === undefined) return "—";
  const n = Number(formatEther(v));
  if (n === 0) return "0";
  if (n >= 1) return n.toFixed(Math.min(digits, 4));
  return n.toFixed(digits);
}

function fmtCldr(v?: bigint) {
  if (v === undefined) return "0.00";
  return Number(formatUnits(v, 18)).toFixed(2);
}

export function CommandHud({
  landId,
  mobileSheet,
  onClose,
  onFocusLand,
}: {
  landId: number | null;
  mobileSheet?: boolean;
  onClose?: () => void;
  onFocusLand?: (id: number) => void;
}) {
  const [tab, setTab] = useState<Tab>("seize");
  const [stakeAmt, setStakeAmt] = useState("100");
  const { address, isConnected } = useAccount();
  const id = landId ?? 1;
  const hasSelection = landId != null;

  const { data: ethBal } = useBalance({
    address,
    query: { enabled: !!address },
  });

  const { data: nextPrice, refetch: refetchPrice } = useReadContract({
    address: CALDERA_GAME,
    abi: gameAbi,
    functionName: "nextPrice",
    args: [BigInt(id)],
    query: { enabled: isConfigured && hasSelection },
  });

  const { data: land, refetch: refetchLand } = useReadContract({
    address: CALDERA_GAME,
    abi: gameAbi,
    functionName: "getLand",
    args: [BigInt(id)],
    query: { enabled: isConfigured && hasSelection },
  });

  const { data: startPrice } = useReadContract({
    address: CALDERA_GAME,
    abi: gameAbi,
    functionName: "startingPrice",
    query: { enabled: isConfigured },
  });

  const { data: pendingMine, refetch: refetchMine } = useReadContract({
    address: CALDERA_MINER,
    abi: minerAbi,
    functionName: "pendingMining",
    args: address ? [address] : undefined,
    query: { enabled: isConfigured && !!address },
  });

  const { data: owned, refetch: refetchOwned } = useReadContract({
    address: CALDERA_MINER,
    abi: minerAbi,
    functionName: "ownedLands",
    args: address ? [address] : undefined,
    query: { enabled: isConfigured && !!address },
  });

  const { data: pendingStakeEth, refetch: refetchStakeEth } = useReadContract({
    address: CALDERA_STAKE,
    abi: stakeAbi,
    functionName: "pendingEth",
    args: address ? [address] : undefined,
    query: { enabled: isConfigured && !!address },
  });

  const { data: staked, refetch: refetchStaked } = useReadContract({
    address: CALDERA_STAKE,
    abi: stakeAbi,
    functionName: "stakeOf",
    args: address ? [address] : undefined,
    query: { enabled: isConfigured && !!address },
  });

  const { data: stakeCooldown } = useReadContract({
    address: CALDERA_STAKE,
    abi: stakeAbi,
    functionName: "COOLDOWN",
    query: { enabled: isConfigured },
  });

  const { data: unstakeAt, refetch: refetchUnstakeAt } = useReadContract({
    address: CALDERA_STAKE,
    abi: stakeAbi,
    functionName: "unstakeAvailableAt",
    args: address ? [address] : undefined,
    query: {
      enabled: isConfigured && !!address,
      refetchInterval: 5_000,
    },
  });

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const instantUnstake = stakeCooldown === undefined || stakeCooldown === 0n;

  const { data: cldrBal, refetch: refetchCldr } = useReadContract({
    address: CALDERA_TOKEN,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConfigured && !!address },
  });

  const { data: stakeAllowance, refetch: refetchAllowance } = useReadContract({
    address: CALDERA_TOKEN,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, CALDERA_STAKE] : undefined,
    query: { enabled: isConfigured && !!address },
  });

  const { writeContract, data: txHash, isPending, error, reset } =
    useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const previewPrice = startPrice ?? parseEther("0.01");
  const price = hasSelection
    ? (nextPrice ?? (isConfigured ? 0n : previewPrice))
    : 0n;

  const priceLabel = useMemo(() => {
    if (!hasSelection || price === 0n) return "—";
    return fmtEth(price, 5);
  }, [price, hasSelection]);

  useEffect(() => {
    if (!isSuccess) return;
    void refetchPrice();
    void refetchLand();
    void refetchMine();
    void refetchOwned();
    void refetchStakeEth();
    void refetchStaked();
    void refetchCldr();
    void refetchAllowance();
    void refetchUnstakeAt();
    reset();
  }, [
    isSuccess,
    refetchPrice,
    refetchLand,
    refetchMine,
    refetchOwned,
    refetchStakeEth,
    refetchStaked,
    refetchCldr,
    refetchAllowance,
    refetchUnstakeAt,
    reset,
  ]);

  const owner = land?.[0];
  const weight = land?.[2] ?? BigInt(landWeight(id));
  const flips = land?.[3] ?? 0n;
  const currentPrice = land?.[1];
  const mineLabel = fmtCldr(pendingMine);
  const stakeEthLabel = fmtEth(pendingStakeEth, 6);
  const ownedIds = (owned ?? []).map((x) => Number(x));

  let stakeParsed = 0n;
  try {
    stakeParsed = stakeAmt ? parseUnits(stakeAmt, 18) : 0n;
  } catch {
    stakeParsed = 0n;
  }
  const needsStakeApprove = (stakeAllowance ?? 0n) < stakeParsed;

  const unstakeQueued = !!unstakeAt && unstakeAt > 0n;
  const unstakeReadyAtMs = unstakeQueued ? Number(unstakeAt) * 1000 : 0;
  const unstakeReady = unstakeQueued && unstakeReadyAtMs <= nowMs;
  const unstakeCooldownSec = unstakeQueued && !unstakeReady
    ? Math.max(0, Math.ceil((unstakeReadyAtMs - nowMs) / 1000))
    : 0;
  const cooldownLabel = (() => {
    if (!unstakeQueued) return null;
    if (unstakeReady) return "Ready now";
    const h = Math.floor(unstakeCooldownSec / 3600);
    const m = Math.floor((unstakeCooldownSec % 3600) / 60);
    const s = unstakeCooldownSec % 60;
    return `${h}h ${m}m ${s}s`;
  })();

  const shell = [
    "flex flex-col border border-copper/40 bg-panel",
    mobileSheet ? "rounded-t-sm border-b-0" : "h-full max-h-[min(88vh,720px)]",
  ].join(" ");

  const busy = isPending || confirming;

  return (
    <aside className={shell}>
      <div className="flex items-start justify-between border-b border-line/70 px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-copper">
            Command
          </p>
          <h2 className="mt-1 font-display text-3xl tracking-tight text-foam">
            {tab === "seize"
              ? hasSelection
                ? formatLandId(id)
                : "—"
              : tab === "lands"
                ? "My Territories"
                : "Stake"}
          </h2>
        </div>
        {mobileSheet && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="border border-line px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-mist"
          >
            Close
          </button>
        )}
      </div>

      <div className="flex border-b border-line/60">
        {(
          [
            ["seize", "Seize"],
            ["lands", "My Territories"],
            ["stake", "Stake"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={[
              "flex-1 py-2.5 text-[10px] uppercase tracking-[0.14em]",
              tab === key
                ? "border-b border-copper text-foam"
                : "text-mist hover:text-foam",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "seize" && (
          <>
            {!hasSelection ? (
              <p className="px-4 py-8 text-sm text-mist">
                Select a territory on the globe to seize with ETH.
              </p>
            ) : (
              <div className="px-4 py-1">
                <Row label="Continent" value={formatLandId(id)} />
                <Row label="Code" value={formatLandCode(id)} />
                <Row label="Owner" value={short(owner)} />
                <Row label="Seize Price" value={`${priceLabel} ETH`} />
                <Row
                  label="Next Floor"
                  value={
                    owner &&
                    owner !== "0x0000000000000000000000000000000000000000"
                      ? "+10%"
                      : "Genesis"
                  }
                />
                <Row label="Mining Pending" value={`${mineLabel} CLDR`} />
                <Row label="Weight" value={weight.toString()} />
                <Row label="Seizes" value={flips.toString()} />
                {currentPrice !== undefined && currentPrice > 0n && (
                  <Row
                    label="Last Price"
                    value={`${fmtEth(currentPrice)} ETH`}
                  />
                )}
              </div>
            )}
            <p className="px-4 pb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-mist">
              85% · 3% Stake · 10% Buyback · 2% Protocol
            </p>
          </>
        )}

        {tab === "lands" && (
          <div className="px-4 py-3">
            <Row label="Owned" value={String(ownedIds.length)} />
            <Row label="Mining Claim" value={`${mineLabel} CLDR`} />
            {!isConnected ? (
              <p className="mt-4 text-sm text-mist">Connect to view portfolio.</p>
            ) : ownedIds.length === 0 ? (
              <p className="mt-4 text-sm text-mist">
                No territories yet. Seize on the globe to start mining.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {ownedIds.map((lid) => (
                  <li
                    key={lid}
                    className="flex items-center justify-between border-b border-line/50 py-2"
                  >
                    <div>
                      <p className="font-display text-lg text-foam">
                        {formatLandId(lid)}
                      </p>
                      <p className="font-mono text-[10px] text-mist">
                        {formatLandCode(lid)} · #{lid}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onFocusLand?.(lid)}
                      className="border border-copper/50 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-copper hover:bg-copper/10"
                    >
                      Focus
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "stake" && (
          <div className="px-4 py-3">
            <Row label="Your Stake" value={`${fmtCldr(staked)} CLDR`} />
            <Row label="Pending ETH" value={`${stakeEthLabel} ETH`} />
            <Row label="Wallet CLDR" value={fmtCldr(cldrBal)} />
            <Row
              label="Unstake Status"
              value={
                !staked || staked === 0n
                  ? "No stake"
                  : instantUnstake
                    ? "Instant — no cooldown"
                    : !unstakeQueued
                      ? "Not queued"
                      : unstakeReady
                        ? "Ready — withdraw now"
                        : `Cooldown · ${cooldownLabel}`
              }
            />
            <label className="mt-4 block">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-[0.16em] text-mist">
                  Stake Amount
                </span>
                <button
                  type="button"
                  disabled={!cldrBal || cldrBal === 0n}
                  onClick={() => {
                    if (!cldrBal || cldrBal === 0n) return;
                    setStakeAmt(formatUnits(cldrBal, 18));
                  }}
                  className="border border-copper/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-copper hover:bg-copper/10 disabled:opacity-35"
                >
                  Max
                </button>
              </div>
              <input
                value={stakeAmt}
                onChange={(e) => setStakeAmt(e.target.value)}
                className="mt-1 w-full border border-line bg-void/60 px-3 py-2 font-mono text-sm text-foam outline-none focus:border-copper"
                inputMode="decimal"
                placeholder="0"
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(
                [
                  ["25%", 25n],
                  ["50%", 50n],
                  ["75%", 75n],
                  ["Max", 100n],
                ] as const
              ).map(([label, pct]) => (
                <button
                  key={label}
                  type="button"
                  disabled={!cldrBal || cldrBal === 0n}
                  onClick={() => {
                    if (!cldrBal || cldrBal === 0n) return;
                    const amt = (cldrBal * pct) / 100n;
                    setStakeAmt(formatUnits(amt, 18));
                  }}
                  className="min-w-[3.25rem] flex-1 border border-line px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-mist hover:border-copper hover:text-copper disabled:opacity-35"
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-mist">
              Stake CLDR to earn the 3% ETH slice from every seize.
              {instantUnstake
                ? " Unstake anytime — no cooldown."
                : " Unstake requires a cooldown after queue."}
            </p>
          </div>
        )}
      </div>

      {!isConfigured && (
        <p className="px-4 pb-2 text-xs text-copper">
          Preview mode — contracts not configured.
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2 border-t border-line/70 p-4">
        {!isConnected ? (
          <ConnectButton size="hero" />
        ) : tab === "seize" ? (
          <button
            type="button"
            disabled={
              !isConfigured ||
              !hasSelection ||
              busy ||
              price === 0n ||
              (ethBal !== undefined && ethBal.value < price)
            }
            onClick={() =>
              writeContract({
                address: CALDERA_GAME,
                abi: gameAbi,
                functionName: "seize",
                args: [BigInt(id)],
                value: price,
              })
            }
            className="bg-copper px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-void hover:bg-gold disabled:opacity-40"
          >
            {busy ? "Seizing…" : `SEIZE · ${priceLabel} ETH`}
          </button>
        ) : tab === "lands" ? (
          <button
            type="button"
            disabled={
              !isConfigured || busy || !pendingMine || pendingMine === 0n
            }
            onClick={() =>
              writeContract({
                address: CALDERA_MINER,
                abi: minerAbi,
                functionName: "claimMining",
              })
            }
            className="border border-claim/50 bg-claim/15 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-foam disabled:opacity-35"
          >
            CLAIM {mineLabel} CLDR
          </button>
        ) : (
          <>
            {needsStakeApprove ? (
              <button
                type="button"
                disabled={!isConfigured || busy || stakeParsed === 0n}
                onClick={() =>
                  writeContract({
                    address: CALDERA_TOKEN,
                    abi: erc20Abi,
                    functionName: "approve",
                    args: [CALDERA_STAKE, stakeParsed * 10n],
                  })
                }
                className="bg-copper px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-void disabled:opacity-40"
              >
                {busy ? "Confirm…" : "Approve CLDR"}
              </button>
            ) : (
              <button
                type="button"
                disabled={!isConfigured || busy || stakeParsed === 0n}
                onClick={() =>
                  writeContract({
                    address: CALDERA_STAKE,
                    abi: stakeAbi,
                    functionName: "stake",
                    args: [stakeParsed],
                  })
                }
                className="bg-copper px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-void disabled:opacity-40"
              >
                {busy ? "Staking…" : "Stake CLDR"}
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={
                  !isConfigured ||
                  busy ||
                  !pendingStakeEth ||
                  pendingStakeEth === 0n
                }
                onClick={() =>
                  writeContract({
                    address: CALDERA_STAKE,
                    abi: stakeAbi,
                    functionName: "claimEth",
                  })
                }
                className="border border-claim/50 bg-claim/15 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-foam disabled:opacity-35"
              >
                Claim ETH
              </button>

              {instantUnstake || unstakeReady ? (
                <button
                  type="button"
                  disabled={!isConfigured || busy || !staked || staked === 0n}
                  onClick={() => {
                    const amt =
                      stakeParsed > 0n && stakeParsed <= (staked ?? 0n)
                        ? stakeParsed
                        : (staked ?? 0n);
                    if (amt === 0n) return;
                    writeContract({
                      address: CALDERA_STAKE,
                      abi: stakeAbi,
                      functionName: "unstake",
                      args: [amt],
                    });
                  }}
                  className="border border-copper/60 bg-copper/15 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-copper disabled:opacity-35"
                >
                  Unstake
                </button>
              ) : !unstakeQueued ? (
                <button
                  type="button"
                  disabled={!isConfigured || busy || !staked || staked === 0n}
                  onClick={() =>
                    writeContract({
                      address: CALDERA_STAKE,
                      abi: stakeAbi,
                      functionName: "queueUnstake",
                    })
                  }
                  className="border border-line px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-mist hover:border-copper hover:text-copper disabled:opacity-35"
                >
                  Queue Unstake
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="border border-line px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-gold/90 disabled:opacity-100"
                  title="Cooldown active — do not re-queue or the timer resets"
                >
                  Wait {cooldownLabel}
                </button>
              )}
            </div>
            {!instantUnstake && unstakeQueued && !unstakeReady && (
              <p className="text-[10px] leading-relaxed text-mist">
                Unstake queued. After the cooldown the button becomes{" "}
                <span className="text-copper">Unstake</span>. Re-queuing would
                reset the timer — wait it out.
              </p>
            )}
          </>
        )}

        {tab === "seize" && isConnected && (
          <button
            type="button"
            disabled={
              !isConfigured || busy || !pendingMine || pendingMine === 0n
            }
            onClick={() =>
              writeContract({
                address: CALDERA_MINER,
                abi: minerAbi,
                functionName: "claimMining",
              })
            }
            className="border border-claim/50 bg-claim/15 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-foam disabled:opacity-35"
          >
            CLAIM {mineLabel} CLDR
          </button>
        )}
      </div>

      {error && (
        <p className="px-4 pb-3 text-[11px] text-red-300">
          {(error as Error).message.slice(0, 140)}
        </p>
      )}
    </aside>
  );
}
