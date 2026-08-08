// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {CalderaToken} from "../src/mocks/CalderaToken.sol";
import {CalderaGame} from "../src/CalderaGame.sol";
import {CalderaMiner} from "../src/CalderaMiner.sol";
import {CalderaStake} from "../src/CalderaStake.sol";
import {CalderaBuyback} from "../src/CalderaBuyback.sol";
import {MockSwapRouter} from "../src/mocks/MockSwapRouter.sol";

/// @dev Local / Anvil smoke deploy with cheap land floor + mock buyback router.
contract DeployLocal is Script {
    /// @dev 0.01 ETH — matches production genesis floor
    uint256 internal constant TEST_START = 0.01 ether;
    /// @dev 1 ETH → 1000 CLDR
    uint256 internal constant RATE = 1000;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address protocol = vm.envOr("PROTOCOL_RECEIVER", deployer);
        uint256 startingPrice = vm.envOr("STARTING_PRICE", TEST_START);

        vm.startBroadcast(pk);

        CalderaToken token = new CalderaToken(deployer);
        CalderaMiner miner = new CalderaMiner(address(token));
        CalderaStake stake = new CalderaStake(address(token));
        CalderaBuyback buyback = new CalderaBuyback(address(token), address(miner));
        CalderaGame game = new CalderaGame(protocol, startingPrice);
        MockSwapRouter router = new MockSwapRouter(RATE);

        // Seed router so seize buybacks can swap ETH→CLDR
        token.transfer(address(router), 40_000_000 ether);

        miner.setGame(address(game));
        miner.setBuyback(address(buyback));
        stake.setGame(address(game));
        buyback.setGame(address(game));
        buyback.setRouter(address(router));
        game.setModules(address(miner), address(stake), address(buyback));

        vm.stopBroadcast();

        console2.log("CalderaToken", address(token));
        console2.log("CalderaGame", address(game));
        console2.log("CalderaMiner", address(miner));
        console2.log("CalderaStake", address(stake));
        console2.log("CalderaBuyback", address(buyback));
        console2.log("MockSwapRouter", address(router));
        console2.log("protocol", protocol);
        console2.log("startingPrice", startingPrice);
        console2.log("deployer", deployer);
    }
}
