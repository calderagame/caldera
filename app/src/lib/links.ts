/** Official X / Twitter */
export const X_URL = "https://x.com/calderagamexyz";

/** Stonks Brokers — CLDR fair-launch + ETH spot market */
export const STONKS_MARKETPLACE =
  process.env.NEXT_PUBLIC_STONKS_URL ?? "https://stonkbrokers.io/marketplace";

/** Optional deep-link once CLDR is listed (token page / pool). Falls back to marketplace. */
export const STONKS_CLDR =
  process.env.NEXT_PUBLIC_STONKS_CLDR_URL ?? STONKS_MARKETPLACE;
