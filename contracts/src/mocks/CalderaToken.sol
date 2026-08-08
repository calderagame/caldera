// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Local / forge-test only. Production CLDR comes from Stonks fair launch.
contract CalderaToken is ERC20 {
    uint256 public constant TOTAL_SUPPLY = 100_000_000 ether;

    constructor(address genesisReceiver) ERC20("Caldera", "CLDR") {
        require(genesisReceiver != address(0), "receiver");
        _mint(genesisReceiver, TOTAL_SUPPLY);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
