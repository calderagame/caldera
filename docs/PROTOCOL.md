# Caldera Protocol Reference

Canonical product documentation lives in the app at **`/docs`**.

## Core loop

Board → Territory → Seize (ETH) → Mine CLDR → Get Outbid → Repeat

## Board

**7 lands — one per territory (IDs `1`–`7`, never `0`)**

| ID | Code | Territory |
|----|------|-----------|
| 1 | EMB | Ember |
| 2 | ASH | Ashfall |
| 3 | RDG | Ridge |
| 4 | BSN | Basin |
| 5 | CRN | Crown |
| 6 | FRG | Forge |
| 7 | SPR | Spire |

## Seize split

| Slice | Share | Destination |
|-------|-------|-------------|
| Previous owner | 85% | ETH instant (genesis → buyback) |
| Stakers | 3% | ETH to CLDR stakers |
| Buyback → miner vault | 10% | ETH→CLDR→land holders |
| Protocol | 2% | Ops |

## Pricing

- All 7 territories share one genesis floor (`STARTING_PRICE` = `0.01 ETH`)
- After each seize: `nextPrice = price × 1.10`
- Weight (`80 + landId % 41`) affects mining only — not seize price

## Mining

- Vault funded solely by buybacks (no prefund)
- Idle > 7 days → 25% effective weight
- Claim mining refreshes activity

## Staking

- Stake CLDR → earn 3% ETH slice from all seizes
- Claim ETH anytime (independent of unstake)
- **Instant** unstake — `COOLDOWN = 0`

## Fair launch

CLDR launches on [Stonk Launcher](https://www.stonkbrokers.cash/launcher). See [LAUNCH.md](../LAUNCH.md).

### Production addresses (Robinhood `4663`)

Pending Stonk Launcher CLDR + forge deploy.

| Role | Address |
|------|---------|
| CLDR | — |
| Game | — |
| Miner | — |
| Stake | — |
| Buyback | — |
| Protocol %2 | — |

## Contracts

| Contract | Role |
|----------|------|
| CalderaGame | ETH seize + routing (`LAND_COUNT = 7`) |
| CalderaBuyback | ETH→CLDR → vault |
| CalderaMiner | Land mining claims |
| CalderaStake | CLDR stake / ETH claims |
| CLDR (Stonk Launcher) | Fair-launch ERC-20 — not minted by the game |
