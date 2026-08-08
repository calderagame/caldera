# Caldera — Fair Launch Runbook (Stonks)

New token, new contracts, separate Vercel project and domain.

Ticker: **CLDR**. Board: **7 territories** (Ember, Ashfall, Ridge, Basin, Crown, Forge, Spire).

Token launch pad: **[Stonks](https://stonkbrokers.io/marketplace)** (Robinhood Chain). Spot trading is ETH-denominated; buyback stack expects an ETH→CLDR DEX route after listing.

## Economy

| Seize slice | % | Destination |
|-------------|---|-------------|
| Previous owner | 85% | ETH instant (genesis: boosts buyback) |
| Stakers | 3% | ETH to CLDR stakers |
| Buyback → miner vault | 10% | ETH→CLDR→land holders |
| Protocol | 2% | Ops sink (`PROTOCOL_RECEIVER`) |

Floor steps **+10%** per seize. Genesis floor **0.01 ETH**. Idle lands (7d) mine at **25%** weight. Unstake is **instant**.

## Territories

| ID | Code | Name |
|----|------|------|
| 1 | EMB | Ember |
| 2 | ASH | Ashfall |
| 3 | RDG | Ridge |
| 4 | BSN | Basin |
| 5 | CRN | Crown |
| 6 | FRG | Forge |
| 7 | SPR | Spire |

## Launch operator

Use a dedicated deployer wallet and a fresh `PROTOCOL_RECEIVER`.

| Role | Env |
|------|-----|
| Deployer PK | `contracts/.env` → `PRIVATE_KEY` |
| Protocol %2 | `PROTOCOL_RECEIVER` |

Fund the deployer with RH ETH for gas before step 2.

## Order of operations

### 1. Launch CLDR on Stonks

1. Open [Stonks marketplace](https://stonkbrokers.io/marketplace) (Robinhood Chain).
2. Create / fair-launch **CLDR**. Prefer **no team allocation**.
3. Wait until the token is tradeable vs ETH.
4. Record `CALDERA_TOKEN` and optional Stonks deep-link for the app.

### 2. Deploy game stack (Robinhood `4663`)

```bash
# contracts/.env
PRIVATE_KEY=0x…
PROTOCOL_RECEIVER=0x…
STARTING_PRICE=10000000000000000   # 0.01 ETH
CALDERA_TOKEN=0x…                  # from step 1
RPC_URL=https://rpc.mainnet.chain.robinhood.com
```

```bash
cd contracts
set -a && source .env && set +a

forge script script/Deploy.s.sol:Deploy \
  --rpc-url $RPC_URL \
  --broadcast --legacy \
  --with-gas-price 1gwei
```

Copy logged addresses: `CalderaGame`, `CalderaMiner`, `CalderaStake`, `CalderaBuyback`.

You may deploy **without** `SWAP_ROUTER` first — buyback ETH will **queue** until a router is set and flushed.

### 3. Wire ETH→CLDR buyback

After CLDR has an ETH market:

```bash
export CALDERA_BUYBACK=0x…
export SWAP_ROUTER=0x…
forge script script/SetBuybackRouter.s.sol:SetBuybackRouter \
  --rpc-url $RPC_URL --broadcast --legacy --with-gas-price 1gwei
```

### 4. Wire the app (Vercel · calderagame.xyz)

Domain: **https://calderagame.xyz** (www too). Project: `calderagame`.

```bash
NEXT_PUBLIC_USE_ANVIL=false
NEXT_PUBLIC_RPC_URL=https://rpc.mainnet.chain.robinhood.com
NEXT_PUBLIC_SITE_URL=https://calderagame.xyz
NEXT_PUBLIC_CALDERA_TOKEN=0x…
NEXT_PUBLIC_CALDERA_GAME=0x…
NEXT_PUBLIC_CALDERA_MINER=0x…
NEXT_PUBLIC_CALDERA_STAKE=0x…
NEXT_PUBLIC_CALDERA_BUYBACK=0x…
NEXT_PUBLIC_STONKS_URL=https://stonkbrokers.io/marketplace
NEXT_PUBLIC_STONKS_CLDR_URL=https://stonkbrokers.io/…
```

### Local Anvil

```bash
anvil --chain-id 31337 --port 8545
cd contracts
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
STARTING_PRICE=10000000000000000 \
  forge script script/DeployLocal.s.sol:DeployLocal \
  --rpc-url http://127.0.0.1:8545 --broadcast
```

## Checklist

- [ ] CLDR live on Stonks vs ETH
- [ ] Stack deployed; env addresses match broadcast
- [ ] Buyback router set + flush (if queued)
- [ ] App build with `USE_ANVIL=false`
- [ ] Vercel production env + custom domain (optional)
- [ ] Docs live-address table updated
