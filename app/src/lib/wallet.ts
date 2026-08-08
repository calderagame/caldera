import { targetChain } from "@/lib/chains";

const RH_HEX = `0x${targetChain.id.toString(16)}`;

/** EIP-3085 params so wallets can add Robinhood in one prompt. */
export const targetChainAddParams = {
  chainId: RH_HEX,
  chainName: targetChain.name,
  nativeCurrency: {
    name: targetChain.nativeCurrency.name,
    symbol: targetChain.nativeCurrency.symbol,
    decimals: targetChain.nativeCurrency.decimals,
  },
  rpcUrls: [...targetChain.rpcUrls.default.http],
  blockExplorerUrls: targetChain.blockExplorers?.default?.url
    ? [targetChain.blockExplorers.default.url]
    : [],
} as const;

type EthProvider = {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
  isMetaMask?: boolean;
};

function getEthereum(): EthProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: EthProvider }).ethereum;
}

export function hasInjectedProvider(): boolean {
  return !!getEthereum()?.request;
}

export async function ensureTargetChain(): Promise<void> {
  const eth = getEthereum();
  if (!eth?.request) return;

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: RH_HEX }],
    });
  } catch (err) {
    const code = (err as { code?: number })?.code;
    // 4902 = unrecognized chain → add it
    if (code === 4902 || code === -32603) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [targetChainAddParams],
      });
      return;
    }
    throw err;
  }
}
