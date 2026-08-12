# Caldera — Fair Launch Runbook (Stonk Launcher)

Ticker: **CLDR**. Board: **7 territories** (Ember, Ashfall, Ridge, Basin, Crown, Forge, Spire).

Token launch pad: **[Stonk Launcher](https://www.stonkbrokers.cash/launcher)** (Robinhood Chain). Prefer an **ETH** bonding-curve launch so seize buybacks can swap ETH→CLDR after graduation.

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

Fund the deployer with RH ETH for gas before step 2. Launcher create fee is **0.00042069 ETH** (plus gas).

## Order of operations

### 1. Launch CLDR on Stonk Launcher

1. Open [Stonk Launcher](https://www.stonkbrokers.cash/launcher) (Robinhood Chain `4663`).
2. **+ Launch a Token** → name **Caldera**, ticker **CLDR**.
3. Pair **ETH**, sale model **bonding curve**. Prefer **no team allocation**.
4. Pay the launch fee; record `CALDERA_TOKEN` (token CA) and the launcher token URL.
5. Wait until the launch **graduates** (~4 ETH of curve volume by default) into Uniswap V3 with an ETH pool. Buyback needs that ETH→CLDR route.

### 2. Deploy game stack (Robinhood `4663`)

Can run once you have `CALDERA_TOKEN`. Mining stays empty until the buyback router is wired after graduation.

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

After CLDR has graduated to an ETH Uniswap V3 market, set a router that implements `ISwapRouter` (see `SetBuybackRouter.s.sol` / `SetPonsRouter.s.sol`). Confirm the live pool’s router ABI before wiring — wrong adapter leaves ETH queued.

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
NEXT_PUBLIC_STONKS_URL=https://www.stonkbrokers.cash/launcher
NEXT_PUBLIC_STONKS_CLDR_URL=https://www.stonkbrokers.cash/launcher/…  # token page
```

### Local Anvil

```bash
anvil --chain-id 31337 --port 8545
cd contracts
cp .env.example .env
# Set PRIVATE_KEY to a local Anvil account from the anvil startup output.
STARTING_PRICE=10000000000000000 \
  forge script script/DeployLocal.s.sol:DeployLocal \
  --rpc-url http://127.0.0.1:8545 --broadcast
```

## Checklist

- [ ] CLDR live on Stonk Launcher (ETH bonding curve)
- [ ] Token CA recorded; launcher URL saved
- [ ] Launch graduated; ETH Uniswap V3 pool exists
- [ ] Stack deployed; env addresses match broadcast
- [ ] Buyback router set + flush (if queued)
- [ ] App build with `USE_ANVIL=false`
- [ ] Vercel production env + calderagame.xyz
- [ ] Docs live-address table updated
