/** Official X / Twitter */
export const X_URL = "https://x.com/calderagamexyz";

/** Stonk Launcher — CLDR fair-launch + ETH spot market */
export const STONKS_MARKETPLACE =
  process.env.NEXT_PUBLIC_STONKS_URL ?? "https://www.stonkbrokers.cash/launcher";

/** Optional deep-link once CLDR is listed (token page / pool). Falls back to launcher. */
export const STONKS_CLDR =
  process.env.NEXT_PUBLIC_STONKS_CLDR_URL ?? STONKS_MARKETPLACE;
