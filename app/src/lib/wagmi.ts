"use client";

import { http, createConfig } from "wagmi";
import { injected } from "@wagmi/connectors";
import { anvil, robinhood, targetChain, useAnvil } from "./chains";

const chains = useAnvil
  ? ([anvil, robinhood] as const)
  : ([robinhood, anvil] as const);

const rpc = process.env.NEXT_PUBLIC_RPC_URL;

export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected({
      shimDisconnect: true,
      // Prefer whatever is injected in the browser (MetaMask / Rabby / etc.)
      // Do NOT auto-open a download page.
    }),
  ],
  transports: {
    [anvil.id]: http(rpc || "http://127.0.0.1:8545"),
    [robinhood.id]: http(
      rpc || "https://rpc.mainnet.chain.robinhood.com",
    ),
  },
  ssr: true,
});

export { targetChain };
