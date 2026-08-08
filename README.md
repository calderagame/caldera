# Caldera

Territory conquest on Robinhood Chain.

**7 territories.** Seize with ETH. Mine **CLDR** from buybacks. Exit when outbid.

- Site: [calderagame.xyz](https://calderagame.xyz)
- X: [@calderagamexyz](https://x.com/calderagamexyz)
- Token launch: [Stonks](https://stonkbrokers.io/marketplace) (ETH-denominated)

## Repository

```
.
├── app/          # Next.js — globe HUD + command surface
├── contracts/    # Foundry — Game, Miner, Stake, Buyback (LAND_COUNT = 7)
├── docs/         # Protocol reference
└── LAUNCH.md     # Stonks fair-launch → deploy → app env
```

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

## Local development

### Contracts

```bash
cd contracts
forge test

anvil --chain-id 31337 --port 8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  forge script script/DeployLocal.s.sol:DeployLocal \
  --rpc-url http://127.0.0.1:8545 --broadcast
```

### App

```bash
cd app
cp .env.example .env.local   # fill addresses from deploy logs
npm install
npm run dev                  # http://localhost:3003
```

## Economy (summary)

| Seize slice | Share |
|-------------|-------|
| Previous owner | 85% ETH |
| Stakers | 3% ETH |
| Buyback → miner vault | 10% |
| Protocol | 2% |

Genesis floor: **0.01 ETH**. Floor steps **+10%** per seize. See [docs/PROTOCOL.md](docs/PROTOCOL.md) and in-app `/docs`.

## Brand

- Palette: lava `#FF6A00` / `#D84A05`, void `#070707`, foam `#F3F1EC`
- Fonts: Syne · Manrope · IBM Plex Mono
- Ticker: **CLDR**

## License

MIT — see [LICENSE](LICENSE).
