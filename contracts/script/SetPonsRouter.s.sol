// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {CalderaPonsRouter} from "../src/CalderaPonsRouter.sol";
import {CalderaBuyback} from "../src/CalderaBuyback.sol";

/// @dev Deploy Pons V3 adapter, wire buyback, flush queued ETH→CLDR.
contract SetPonsRouter is Script {
    address constant PONS_SWAP_ROUTER = 0xCaf681a66D020601342297493863E78C959E5cb2;
    uint24 constant POOL_FEE = 10_000; // 1% — Pons default

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address buybackAddr = vm.envAddress("CALDERA_BUYBACK");

        vm.startBroadcast(pk);

        CalderaPonsRouter adapter = new CalderaPonsRouter(PONS_SWAP_ROUTER, POOL_FEE);
        CalderaBuyback buyback = CalderaBuyback(payable(buybackAddr));
        buyback.setRouter(address(adapter));

        uint256 queued = buyback.ethQueued();
        if (queued > 0) {
            buyback.flush(0);
        }

        vm.stopBroadcast();

        console2.log("CalderaPonsRouter", address(adapter));
        console2.log("buyback", buybackAddr);
        console2.log("flushedQueued", queued);
        console2.log("ethQueuedAfter", buyback.ethQueued());
    }
}
