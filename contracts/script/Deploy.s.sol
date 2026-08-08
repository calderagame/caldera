// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {CalderaGame} from "../src/CalderaGame.sol";
import {CalderaMiner} from "../src/CalderaMiner.sol";
import {CalderaStake} from "../src/CalderaStake.sol";
import {CalderaBuyback} from "../src/CalderaBuyback.sol";

/// @dev Fair launch (Stonks) compatible:
///      1) Launch CLDR on Stonks — supply to open market / LP (no team cut preferred).
///      2) Deploy game stack pointing at that CLDR address (set CALDERA_TOKEN).
///      3) Set SWAP_ROUTER to the chain DEX wrapper once the CLDR/ETH pool exists.
///      Mining vault is funded only by seize buybacks — never a prefund.
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address protocol = vm.envAddress("PROTOCOL_RECEIVER");
        uint256 startingPrice = vm.envOr("STARTING_PRICE", uint256(0.01 ether));
        address tokenAddr = vm.envAddress("CALDERA_TOKEN");
        address router = vm.envOr("SWAP_ROUTER", address(0));

        require(tokenAddr != address(0), "CALDERA_TOKEN required (Stonks token address)");
        require(protocol != address(0), "PROTOCOL_RECEIVER required");

        vm.startBroadcast(pk);

        CalderaMiner miner = new CalderaMiner(tokenAddr);
        CalderaStake stake = new CalderaStake(tokenAddr);
        CalderaBuyback buyback = new CalderaBuyback(tokenAddr, address(miner));
        CalderaGame game = new CalderaGame(protocol, startingPrice);

        miner.setGame(address(game));
        miner.setBuyback(address(buyback));
        stake.setGame(address(game));
        buyback.setGame(address(game));
        if (router != address(0)) {
            buyback.setRouter(router);
        }
        game.setModules(address(miner), address(stake), address(buyback));

        vm.stopBroadcast();

        console2.log("CalderaToken", tokenAddr);
        console2.log("CalderaGame", address(game));
        console2.log("CalderaMiner", address(miner));
        console2.log("CalderaStake", address(stake));
        console2.log("CalderaBuyback", address(buyback));
        console2.log("protocol", protocol);
        console2.log("startingPrice", startingPrice);
        console2.log("router", router);
    }
}
