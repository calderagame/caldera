// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISwapRouter} from "../interfaces/ISwapRouter.sol";

/// @dev Test router: 1 ETH → `rate` CLDR from pre-funded balance.
contract MockSwapRouter is ISwapRouter {
    uint256 public immutable rate; // CLDR wei per 1 ETH wei

    constructor(uint256 rate_) {
        rate = rate_;
    }

    function swapExactETHForTokens(uint256 minOut, address tokenOut, address to)
        external
        payable
        returns (uint256 amountOut)
    {
        amountOut = msg.value * rate;
        require(amountOut >= minOut, "min");
        require(IERC20(tokenOut).transfer(to, amountOut), "xfer");
    }

    receive() external payable {}
}
