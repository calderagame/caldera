"use client";

import { useEffect, useState } from "react";
import { formatLandId } from "@/lib/lands";

type EventKind = "seize" | "mining" | "claim" | "outbid";

type FeedItem = {
  id: string;
  kind: EventKind;
  landId: number;
  detail: string;
  t: number;
};

const KIND_LABEL: Record<EventKind, string> = {
  seize: "Seize",
  mining: "Mining",
  claim: "Claim",
  outbid: "Outbid",
};

/** Terminal-style recent activity — seeded locally until indexed events exist. */
export function ActivityFeed({ landHint }: { landHint: number | null }) {
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const seed: FeedItem[] = [
      {
        id: "1",
        kind: "seize",
        landId: 1,
        detail: "Genesis vent acquired",
        t: Date.now() - 120_000,
      },
      {
        id: "2",
        kind: "mining",
        landId: 3,
        detail: "Vault accrual tick",
        t: Date.now() - 90_000,
      },
      {
        id: "3",
        kind: "claim",
        landId: 3,
        detail: "CLDR claimed from vault",
        t: Date.now() - 55_000,
      },
      {
        id: "4",
        kind: "outbid",
        landId: 5,
        detail: "85% ETH routed to previous owner",
        t: Date.now() - 30_000,
      },
      {
        id: "5",
        kind: "seize",
        landId: 7,
        detail: "Floor stepped +10%",
        t: Date.now() - 12_000,
      },
    ];
    setItems(seed);
  }, []);

  useEffect(() => {
    if (landHint == null) return;
    setItems((prev) =>
      [
        {
          id: `${Date.now()}`,
          kind: "seize" as const,
          landId: landHint,
          detail: `Focus lock · ${formatLandId(landHint)}`,
          t: Date.now(),
        },
        ...prev,
      ].slice(0, 12),
    );
  }, [landHint]);

  return (
    <section className="cal-panel flex h-full min-h-[360px] flex-col">
      <div className="border-b border-[rgba(255,120,40,0.12)] px-4 py-3">
        <p className="cal-label">Terminal</p>
        <h2 className="mt-0.5 font-display text-base uppercase tracking-[0.14em] text-foam">
          Recent Activity
        </h2>
      </div>
      <ul className="flex-1 overflow-auto font-mono text-[11px]">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex gap-3 border-b border-[rgba(255,120,40,0.08)] px-4 py-2.5 text-mist transition hover:bg-ink hover:text-foam"
          >
            <span className="shrink-0 text-copper">
              {KIND_LABEL[item.kind].padEnd(7, " ")}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {formatLandId(item.landId)} — {item.detail}
            </span>
            <span className="shrink-0 text-[10px] text-mist/70">
              {formatAge(item.t)}
            </span>
          </li>
        ))}
      </ul>
      <div className="border-t border-[rgba(255,120,40,0.12)] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-mist">
        Latest seizes · Mining · Claims · Outbids
      </div>
    </section>
  );
}

function formatAge(t: number) {
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}
