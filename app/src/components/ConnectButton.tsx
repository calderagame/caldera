"use client";

import { useEffect, useRef, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { targetChain } from "@/lib/chains";
import { ensureTargetChain, hasInjectedProvider } from "@/lib/wallet";

type Props = {
  /** Larger CTA used in the hero column */
  size?: "nav" | "hero";
};

export function ConnectButton({ size = "nav" }: Props) {
  const { address, isConnected, chainId } = useAccount();
  const { connectAsync, connectors, isPending, error, reset } = useConnect();
  const { disconnect, isPending: disconnecting } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasProvider, setHasProvider] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasProvider(hasInjectedProvider());
  }, []);

  useEffect(() => {
    if (!menuOpen && !pickerOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
        setPickerOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, pickerOpen]);

  useEffect(() => {
    if (!isConnected) setMenuOpen(false);
  }, [isConnected]);

  const btnBase =
    size === "hero"
      ? "w-full max-w-xs border border-copper bg-copper px-5 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-void transition hover:bg-gold hover:border-gold disabled:opacity-50"
      : "border border-copper bg-copper px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-void transition hover:bg-gold hover:border-gold disabled:opacity-50";

  async function handleConnect() {
    setLocalError(null);
    reset();
    setHasProvider(hasInjectedProvider());

    if (!hasInjectedProvider()) {
      setPickerOpen(true);
      setLocalError(
        "No browser wallet detected. Install MetaMask, then refresh this page.",
      );
      return;
    }

    const connector = connectors[0];
    if (!connector) {
      setLocalError("Wallet connector unavailable. Refresh and try again.");
      return;
    }

    setBusy(true);
    try {
      // Add/switch Robinhood first so the connect prompt lands on the right chain
      try {
        await ensureTargetChain();
      } catch {
        // User may reject add/switch; still attempt connect
      }

      await connectAsync({
        connector,
        chainId: targetChain.id,
      });

      try {
        await switchChainAsync({ chainId: targetChain.id });
      } catch {
        try {
          await ensureTargetChain();
        } catch {
          /* wrong-chain menu handles retry */
        }
      }

      setPickerOpen(false);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Connection failed. Unlock your wallet and try again.";
      // User rejected — keep it short
      if (/rejected|denied|4001/i.test(msg)) {
        setLocalError("Connection rejected in wallet.");
      } else {
        setLocalError(msg.slice(0, 160));
      }
      setPickerOpen(true);
    } finally {
      setBusy(false);
    }
  }

  if (!isConnected) {
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          disabled={isPending || busy}
          onClick={() => {
            void handleConnect();
          }}
          className={btnBase}
        >
          {isPending || busy ? "Connecting…" : "Connect Wallet"}
        </button>

        {(pickerOpen || localError || error) && (
          <div
            role="dialog"
            aria-label="Connect wallet"
            className={[
              "z-50 border border-line bg-panel shadow-xl",
              size === "hero"
                ? "relative mt-2 w-full max-w-xs"
                : "absolute right-0 top-full mt-1 w-72",
            ].join(" ")}
          >
            <div className="border-b border-line/70 px-3 py-2.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-copper">
                Connect
              </p>
              <p className="mt-1 text-xs text-mist">
                Use a browser extension wallet on{" "}
                <span className="text-foam">{targetChain.name}</span> (chain{" "}
                {targetChain.id}).
              </p>
            </div>

            <div className="p-2">
              <button
                type="button"
                disabled={busy || isPending || !hasProvider}
                onClick={() => void handleConnect()}
                className="flex w-full items-center justify-between border border-line px-3 py-2.5 text-left hover:border-copper disabled:opacity-40"
              >
                <span>
                  <span className="block text-[12px] font-semibold text-foam">
                    Browser Wallet
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] text-mist">
                    MetaMask / Rabby / injected
                  </span>
                </span>
                <span className="font-mono text-[10px] text-copper">
                  {hasProvider ? "Ready" : "Missing"}
                </span>
              </button>

              {!hasProvider && (
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block border border-copper/40 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-copper hover:bg-copper/10"
                >
                  Install MetaMask
                </a>
              )}
            </div>

            {(localError || error) && (
              <p className="border-t border-line/60 px-3 py-2 text-[11px] leading-snug text-red-300">
                {localError ||
                  (error instanceof Error
                    ? error.message.slice(0, 160)
                    : "Connection error")}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setPickerOpen(false);
                setLocalError(null);
                reset();
              }}
              className="w-full border-t border-line/60 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-mist hover:text-foam"
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  }

  const short = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "Connected";
  const wrongChain = chainId !== targetChain.id;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onClick={() => setMenuOpen((v) => !v)}
        className={[
          size === "hero"
            ? "w-full max-w-xs border px-5 py-3.5 font-mono text-sm tracking-wide"
            : "border px-4 py-2 font-mono text-[11px] tracking-wide",
          wrongChain
            ? "border-gold/60 bg-gold/10 text-gold"
            : "border-line bg-panel text-foam hover:border-copper",
        ].join(" ")}
      >
        {wrongChain ? "Wrong network · " : ""}
        {short}
        <span className="ml-2 text-mist">{menuOpen ? "▴" : "▾"}</span>
      </button>

      {menuOpen && (
        <div
          role="menu"
          className={[
            "z-50 border border-line bg-panel shadow-lg",
            size === "hero"
              ? "relative mt-2 w-full max-w-xs"
              : "absolute right-0 top-full mt-1 min-w-[12rem]",
          ].join(" ")}
        >
          <div className="border-b border-line/70 px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mist">
              Wallet
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-foam">{short}</p>
            <p className="mt-0.5 font-mono text-[10px] text-mist">
              {wrongChain
                ? `On chain ${chainId ?? "?"} · need ${targetChain.id}`
                : targetChain.name}
            </p>
          </div>

          {wrongChain && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                void (async () => {
                  try {
                    await switchChainAsync({ chainId: targetChain.id });
                  } catch {
                    await ensureTargetChain();
                  }
                  setMenuOpen(false);
                })();
              }}
              className="block w-full border-b border-line/50 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-gold hover:bg-gold/10"
            >
              Switch to {targetChain.name}
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            disabled={disconnecting}
            onClick={() => {
              disconnect();
              setMenuOpen(false);
            }}
            className="block w-full px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-foam hover:bg-copper/15 hover:text-copper disabled:opacity-50"
          >
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </button>
        </div>
      )}
    </div>
  );
}
