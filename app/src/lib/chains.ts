import { defineChain } from "viem";

const rpcOverride = process.env.NEXT_PUBLIC_RPC_URL;

export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [rpcOverride || "https://rpc.mainnet.chain.robinhood.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://robinhoodchain.blockscout.com",
    },
  },
});

/** Foundry Anvil — local smoke tests (chain id 31337) */
export const anvil = defineChain({
  id: 31337,
  name: "Caldera Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [rpcOverride || "http://127.0.0.1:8545"] },
  },
});

export const useAnvil =
  process.env.NEXT_PUBLIC_USE_ANVIL === "1" ||
  process.env.NEXT_PUBLIC_USE_ANVIL === "true";

export const targetChain = useAnvil ? anvil : robinhood;
