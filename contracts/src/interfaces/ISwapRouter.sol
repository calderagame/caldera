// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @notice Minimal ETH→token swap surface for buybacks (Uniswap-style wrapper).
interface ISwapRouter {
    function swapExactETHForTokens(uint256 minOut, address tokenOut, address to)
        external
        payable
        returns (uint256 amountOut);
}
