// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISwapRouter} from "./interfaces/ISwapRouter.sol";

interface IPonsSwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);

    function WETH9() external view returns (address);
}

/// @notice Adapts CalderaBuyback's simple ETH→token interface to Pons Uniswap V3 SwapRouter.
///         Deployed on Robinhood Chain; set as CalderaBuyback.router.
contract CalderaPonsRouter is ISwapRouter {
    using SafeERC20 for IERC20;

    IPonsSwapRouter public immutable ponsRouter;
    address public immutable weth;
    uint24 public immutable poolFee;

    error ZeroAmount();
    error BadToken();
    error Slippage();

    constructor(address ponsRouter_, uint24 poolFee_) {
        require(ponsRouter_ != address(0), "router");
        ponsRouter = IPonsSwapRouter(ponsRouter_);
        weth = IPonsSwapRouter(ponsRouter_).WETH9();
        poolFee = poolFee_;
    }

    /// @inheritdoc ISwapRouter
    function swapExactETHForTokens(uint256 minOut, address tokenOut, address to)
        external
        payable
        returns (uint256 amountOut)
    {
        if (msg.value == 0) revert ZeroAmount();
        if (tokenOut == address(0) || to == address(0)) revert BadToken();

        amountOut = ponsRouter.exactInputSingle{value: msg.value}(
            IPonsSwapRouter.ExactInputSingleParams({
                tokenIn: weth,
                tokenOut: tokenOut,
                fee: poolFee,
                recipient: address(this),
                amountIn: msg.value,
                amountOutMinimum: minOut,
                sqrtPriceLimitX96: 0
            })
        );

        if (amountOut < minOut) revert Slippage();

        // Belt-and-suspenders: send actual balance in case router returns differ
        uint256 bal = IERC20(tokenOut).balanceOf(address(this));
        if (bal < amountOut) amountOut = bal;
        IERC20(tokenOut).safeTransfer(to, amountOut);
    }

    receive() external payable {}
}
