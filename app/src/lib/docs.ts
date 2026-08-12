export type DocBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "callout"; title: string; text: string }
  | { type: "formula"; label: string; value: string };

export type DocSection = {
  id: string;
  title: string;
  lead?: string;
  blocks: DocBlock[];
};

export const DOC_SECTIONS: DocSection[] = [
  {
    id: "overview",
    title: "Overview",
    lead: "Caldera is territory conquest on Robinhood Chain. Seven vents. Lands are the product.",
    blocks: [
      {
        type: "p",
        text: "There are 7 lands — one per territory — on a single world board. You seize a territory with ETH, earn CLDR while you hold it, and exit when someone outbids you — taking 85% of the next seize price in ETH.",
      },
      {
        type: "p",
        text: "CLDR is fair-launched on Stonk Launcher. The protocol does not pre-fund a mining vault and does not mint a team allocation. Mining rewards come only from buybacks funded by seize ETH.",
      },
      {
        type: "ul",
        items: [
          "Seven territories — scarcity by design",
          "Owner-only — no renters, no operators, no leases",
          "ETH for conquest — CLDR for mining and staking",
          "Transparent split on every seize: 85% · 3% · 10% · 2%",
          "Fixed floor step: +10% after each successful seize",
        ],
      },
    ],
  },
  {
    id: "loop",
    title: "The loop",
    lead: "One cycle. No seasonal reset required to understand the game.",
    blocks: [
      {
        type: "ol",
        items: [
          "Open the globe and select a territory.",
          "Seize it by paying the current floor in ETH.",
          "Hold to accrue CLDR mining from the buyback-funded vault.",
          "Optionally stake CLDR to earn a share of the 3% ETH slice.",
          "When outbid, receive 85% of the new seize price in ETH instantly.",
          "Repeat on the same territory or expand across the board.",
        ],
      },
      {
        type: "callout",
        title: "Design intent",
        text: "Caldera is built for clear exits. You are never trapped in an illiquid position — every land has a public floor and an 85% refund path on the next flip.",
      },
    ],
  },
  {
    id: "lands",
    title: "Territories",
    lead: "Seven lands. One board. Every flip matters — you take territory from a holder, not from an empty grid of hundreds.",
    blocks: [
      {
        type: "p",
        text: "Each land is a named vent on the globe. Selecting it opens the command panel for seize, portfolio, and stake actions.",
      },
      {
        type: "table",
        headers: ["ID", "Code", "Territory"],
        rows: [
          ["1", "EMB", "Ember"],
          ["2", "ASH", "Ashfall"],
          ["3", "RDG", "Ridge"],
          ["4", "BSN", "Basin"],
          ["5", "CRN", "Crown"],
          ["6", "FRG", "Forge"],
          ["7", "SPR", "Spire"],
        ],
      },
      {
        type: "table",
        headers: ["Field", "Meaning"],
        rows: [
          ["Owner", "Current controller; zero address = unclaimed"],
          ["Floor / next price", "ETH required for the next seize"],
          ["Weight", "Mining share factor for that territory"],
          ["Seize count", "How many times the land has flipped"],
        ],
      },
      {
        type: "p",
        text: "Weight is deterministic from land ID and does not change the seize price. It only affects how mining rewards are split among holders.",
      },
      {
        type: "formula",
        label: "Weight",
        value: "weight = 80 + (landId % 41)   →   range 80–120",
      },
      {
        type: "callout",
        title: "Why seven",
        text: "Scarcity is the product. With seven territories, every outbid is visible, liquid, and socially legible — closer to classic conquest games than a dense tile map.",
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing",
    lead: "Every territory starts at the same genesis floor. Demand sets the rest.",
    blocks: [
      {
        type: "p",
        text: "There is no per-territory premium at genesis. Hot lands rise because they flip more often — not because the protocol assigned them a higher starting price.",
      },
      {
        type: "table",
        headers: ["Parameter", "Value"],
        rows: [
          ["Genesis floor", "STARTING_PRICE (0.01 ETH)"],
          ["Price step", "+10% after every successful seize"],
          ["Payment asset", "ETH (native)"],
          ["Overpay", "Excess ETH refunded in the same transaction"],
        ],
      },
      {
        type: "formula",
        label: "Next floor",
        value: "nextPrice = currentPrice × 1.10",
      },
      {
        type: "table",
        headers: ["Seize #", "Floor (from 0.01 ETH genesis)"],
        rows: [
          ["1 (genesis)", "0.0100 ETH"],
          ["2", "0.0110 ETH"],
          ["3", "0.0121 ETH"],
          ["10", "~0.0236 ETH"],
          ["20", "~0.0612 ETH"],
        ],
      },
      {
        type: "callout",
        title: "Fair entry",
        text: "Unclaimed territories always open at the global genesis floor. After the first seize, that land’s floor tracks only its own flip history.",
      },
    ],
  },
  {
    id: "seize",
    title: "Seize economics",
    lead: "Every ETH paid into a seize is fully allocated. Nothing is opaque.",
    blocks: [
      {
        type: "table",
        headers: ["Slice", "Share", "Destination"],
        rows: [
          ["Previous owner", "85%", "ETH paid instantly to the outbid holder"],
          ["Stakers", "3%", "ETH distributed to CLDR stakers"],
          ["Buyback → vault", "10%", "ETH swapped to CLDR, deposited into mining vault"],
          ["Protocol", "2%", "Ops sink (withdrawable by protocol address)"],
        ],
      },
      {
        type: "p",
        text: "Genesis exception: when a land has never been owned, there is no previous owner. The 85% slice is redirected into the buyback path so early conquest still seeds the mining vault instead of minting phantom refunds.",
      },
      {
        type: "ul",
        items: [
          "Genesis buyback path = 85% + 10% = 95% of seize ETH toward CLDR buyback",
          "Overbid buyback path = 10% of seize ETH toward CLDR buyback",
          "Rounding dust accrues to the protocol slice",
        ],
      },
    ],
  },
  {
    id: "mining",
    title: "Mining",
    lead: "Hold land → earn CLDR. Vault fills only when seizes buy back CLDR from the open market.",
    blocks: [
      {
        type: "p",
        text: "CalderaMiner tracks each land’s effective weight and accrues rewards pro-rata. Claiming mining also refreshes activity on your lands.",
      },
      {
        type: "ul",
        items: [
          "No pre-allocated mining fund",
          "Rewards arrive only after successful buybacks deposit CLDR",
          "If buyback ETH queues (no router / thin liquidity), flush when the pool is ready",
        ],
      },
      {
        type: "table",
        headers: ["Idle rule", "Effect"],
        rows: [
          ["Active (seize or claim within 7 days)", "Full land weight"],
          ["Idle > 7 days", "Effective weight drops to 25%"],
          ["Claim mining", "Counts as engagement — resets idle timer"],
        ],
      },
      {
        type: "callout",
        title: "Why idle decay",
        text: "Mining favors active controllers. Abandoned land still earns, but at a quarter weight, so the vault does not subsidize permanent AFK holdings.",
      },
    ],
  },
  {
    id: "staking",
    title: "Staking",
    lead: "Stake CLDR to earn the 3% ETH slice from every seize across the board.",
    blocks: [
      {
        type: "p",
        text: "CalderaStake is a separate module. Stakers do not need to own land. Land holders do not need to stake. The two yield paths are complementary.",
      },
      {
        type: "ul",
        items: [
          "Stake CLDR → earn ETH from the global seize stream",
          "Claim ETH anytime rewards are pending (independent of unstake)",
          "If ETH arrives before anyone is staked, it residual-queues and flushes when stake appears",
        ],
      },
      {
        type: "ul",
        items: [
          "Unstake is instant — no queue, no cooldown (COOLDOWN = 0)",
          "Withdraw any amount up to your staked balance in one transaction",
          "Pending ETH rewards remain claimable before or after unstake",
        ],
      },
      {
        type: "callout",
        title: "Liquidity first",
        text: "Caldera keeps unstake frictionless so stakers can enter and exit freely. The 3% ETH stream is the incentive to stay staked — not a lockup.",
      },
    ],
  },
  {
    id: "token",
    title: "CLDR & fair launch",
    lead: "CLDR is the mining and staking asset — not the seize currency. Live on Stonk Launcher.",
    blocks: [
      {
        type: "table",
        headers: ["Property", "Spec"],
        rows: [
          ["Ticker", "CLDR (Caldera)"],
          ["Role", "Mining rewards + stake collateral"],
          ["Seize currency", "ETH (not CLDR)"],
          ["Launch venue", "Stonk Launcher (Robinhood Chain)"],
          ["Team allocation", "None in protocol contracts"],
          ["Mining prefund", "None — vault is buyback-funded only"],
        ],
      },
      {
        type: "p",
        text: "CLDR is fair-launched on Stonk Launcher. The game stack points at that token only — no team mint inside Caldera contracts. Seize buybacks purchase CLDR from the open market to fund the mining vault.",
      },
    ],
  },
  {
    id: "addresses",
    title: "Live addresses",
    lead: "Robinhood Chain (4663). Fill after Stonk Launcher CLDR + forge deploy — placeholders until then.",
    blocks: [
      {
        type: "table",
        headers: ["Role", "Address"],
        rows: [
          ["CLDR token", "— (Stonk Launcher CA pending)"],
          ["Game", "—"],
          ["Miner", "—"],
          ["Stake", "—"],
          ["Buyback", "—"],
          ["Protocol %2", "—"],
        ],
      },
      {
        type: "callout",
        title: "Local first",
        text: "Until production deploy, run Anvil + DeployLocal and set NEXT_PUBLIC_CALDERA_* in app/.env.local.",
      },
    ],
  },
  {
    id: "architecture",
    title: "Architecture",
    lead: "Five contracts. Clear boundaries. Permissionless claims.",
    blocks: [
      {
        type: "table",
        headers: ["Contract", "Responsibility"],
        rows: [
          ["CLDR (Stonk Launcher)", "Fair-launch ERC-20 — game never mints supply"],
          ["CalderaGame", "Land state, ETH seize, split routing"],
          ["CalderaBuyback", "Queue ETH, swap to CLDR, fund miner"],
          ["CalderaMiner", "Weight accounting, CLDR claims, idle decay"],
          ["CalderaStake", "CLDR stake, ETH reward claims, instant unstake"],
        ],
      },
      {
        type: "ol",
        items: [
          "User calls Game.seize{value}(landId).",
          "Game updates ownership and notifies Miner.",
          "Game sends ETH to previous owner / Stake / Buyback / protocol accrual.",
          "Buyback swaps ETH→CLDR (or queues) and deposits into Miner.",
          "Holders claimMining(); stakers claimEth().",
        ],
      },
    ],
  },
  {
    id: "risks",
    title: "Risks & notes",
    lead: "Read this before size. Caldera is an onchain game, not a savings product.",
    blocks: [
      {
        type: "ul",
        items: [
          "Smart-contract risk — contracts may contain bugs; audits are not implied by this document",
          "Market risk — land floors can rise faster than you can exit if you are not outbid",
          "Liquidity risk — buybacks depend on a live CLDR/ETH market and router",
          "Opportunity cost — ETH locked in a land earns only via mining / future outbid, not via guaranteed yield",
          "Chain risk — Robinhood Chain availability, fees, and finality apply",
        ],
      },
      {
        type: "callout",
        title: "No promise of return",
        text: "Mining APY is emergent from seize volume and buyback execution. Nothing in Caldera guarantees a fixed return on ETH or CLDR.",
      },
    ],
  },
];

export const DOC_NAV = DOC_SECTIONS.map(({ id, title }) => ({ id, title }));
