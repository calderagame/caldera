export const CALDERA_TOKEN =
  (process.env.NEXT_PUBLIC_CALDERA_TOKEN as `0x${string}` | undefined) ??
  "0x0000000000000000000000000000000000000000";

export const CALDERA_GAME =
  (process.env.NEXT_PUBLIC_CALDERA_GAME as `0x${string}` | undefined) ??
  "0x0000000000000000000000000000000000000000";

export const CALDERA_MINER =
  (process.env.NEXT_PUBLIC_CALDERA_MINER as `0x${string}` | undefined) ??
  "0x0000000000000000000000000000000000000000";

export const CALDERA_STAKE =
  (process.env.NEXT_PUBLIC_CALDERA_STAKE as `0x${string}` | undefined) ??
  "0x0000000000000000000000000000000000000000";

export const CALDERA_BUYBACK =
  (process.env.NEXT_PUBLIC_CALDERA_BUYBACK as `0x${string}` | undefined) ??
  "0x0000000000000000000000000000000000000000";

export const isConfigured =
  CALDERA_TOKEN !== "0x0000000000000000000000000000000000000000" &&
  CALDERA_GAME !== "0x0000000000000000000000000000000000000000" &&
  CALDERA_MINER !== "0x0000000000000000000000000000000000000000" &&
  CALDERA_STAKE !== "0x0000000000000000000000000000000000000000";

export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export const gameAbi = [
  {
    type: "function",
    name: "LAND_COUNT",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "startingPrice",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getLand",
    stateMutability: "view",
    inputs: [{ name: "landId", type: "uint256" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "price", type: "uint256" },
      { name: "weight", type: "uint256" },
      { name: "seizeCount", type: "uint256" },
      { name: "lastSeizeAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextPrice",
    stateMutability: "view",
    inputs: [{ name: "landId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalSeizes",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "activeLands",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "seize",
    stateMutability: "payable",
    inputs: [{ name: "landId", type: "uint256" }],
    outputs: [],
  },
] as const;

export const minerAbi = [
  {
    type: "function",
    name: "pendingMining",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "ownedLands",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "claimMining",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

export const buybackAbi = [
  {
    type: "function",
    name: "ethQueued",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

export const stakeAbi = [
  {
    type: "function",
    name: "COOLDOWN",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "stakeOf",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "pendingEth",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "unstakeAvailableAt",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "stake",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "queueUnstake",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "unstake",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "claimEth",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;
