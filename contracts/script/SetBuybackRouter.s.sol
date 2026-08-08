// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {CalderaBuyback} from "../src/CalderaBuyback.sol";

/// @dev Wire any ISwapRouter adapter (Stonks / DEX path) and flush queued ETH.
///      Deploy the adapter separately once CLDR/ETH pool params are known, then:
///        CALDERA_BUYBACK=0x… SWAP_ROUTER=0x… forge script … --broadcast
contract SetBuybackRouter is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address buybackAddr = vm.envAddress("CALDERA_BUYBACK");
        address router = vm.envAddress("SWAP_ROUTER");
        require(router != address(0), "SWAP_ROUTER");

        vm.startBroadcast(pk);
        CalderaBuyback buyback = CalderaBuyback(payable(buybackAddr));
        buyback.setRouter(router);
        uint256 queued = buyback.ethQueued();
        if (queued > 0) {
            buyback.flush(0);
        }
        vm.stopBroadcast();

        console2.log("buyback", buybackAddr);
        console2.log("router", router);
        console2.log("ethQueuedAfter", buyback.ethQueued());
    }
}
