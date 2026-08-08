// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ICalderaBuyback} from "./interfaces/ICalderaBuyback.sol";
import {ISwapRouter} from "./interfaces/ISwapRouter.sol";
import {CalderaMiner} from "./CalderaMiner.sol";

/// @notice Receives ETH from seizes, swaps to CLDR, deposits into CalderaMiner vault.
///         If swap fails / no router, ETH queues until executeBuyback succeeds.
contract CalderaBuyback is ICalderaBuyback, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    CalderaMiner public immutable miner;
    address public immutable deployer;
    address public game;
    ISwapRouter public router;

    uint256 public ethQueued;

    event GameSet(address game);
    event RouterSet(address router);
    event EthQueued(uint256 amount, uint256 totalQueued);
    event BuybackExecuted(uint256 ethIn, uint256 cldrOut);
    event BuybackFailed(uint256 ethAttempted);

    error OnlyGame();
    error OnlyDeployer();
    error NoRouter();
    error ZeroAmount();

    modifier onlyGame() {
        if (msg.sender != game) revert OnlyGame();
        _;
    }

    constructor(address token_, address miner_) {
        require(token_ != address(0) && miner_ != address(0), "addr");
        token = IERC20(token_);
        miner = CalderaMiner(miner_);
        deployer = msg.sender;
    }

    function setGame(address game_) external {
        require(game == address(0) && game_ != address(0), "game");
        game = game_;
        emit GameSet(game_);
    }

    function setRouter(address router_) external {
        if (msg.sender != deployer) revert OnlyDeployer();
        router = ISwapRouter(router_);
        emit RouterSet(router_);
    }

    function notify() external payable onlyGame {
        if (msg.value == 0) return;
        ethQueued += msg.value;
        emit EthQueued(msg.value, ethQueued);
        // Best-effort immediate buyback; queue remains if it fails.
        _tryBuyback(ethQueued, 0);
    }

    function executeBuyback(uint256 ethAmount, uint256 minCldrOut) external nonReentrant {
        if (ethAmount == 0 || ethAmount > ethQueued) revert ZeroAmount();
        uint256 before = ethQueued;
        _tryBuyback(ethAmount, minCldrOut);
        require(ethQueued < before, "failed");
    }

    /// @dev Permissionless flush of entire queue.
    function flush(uint256 minCldrOut) external nonReentrant {
        if (ethQueued == 0) revert ZeroAmount();
        uint256 before = ethQueued;
        _tryBuyback(ethQueued, minCldrOut);
        require(ethQueued < before, "failed");
    }

    function _tryBuyback(uint256 ethAmount, uint256 minCldrOut) internal {
        if (ethAmount == 0 || address(router) == address(0)) {
            emit BuybackFailed(ethAmount);
            return;
        }
        if (ethAmount > ethQueued) ethAmount = ethQueued;
        if (ethAmount > address(this).balance) ethAmount = address(this).balance;
        if (ethAmount == 0) return;

        uint256 beforeTok = token.balanceOf(address(this));
        try router.swapExactETHForTokens{value: ethAmount}(minCldrOut, address(token), address(this))
        returns (uint256 amountOut) {
            uint256 got = token.balanceOf(address(this)) - beforeTok;
            if (got < amountOut) amountOut = got;
            if (amountOut == 0) {
                emit BuybackFailed(ethAmount);
                return;
            }
            ethQueued -= ethAmount;
            token.forceApprove(address(miner), amountOut);
            miner.depositRewards(amountOut);
            emit BuybackExecuted(ethAmount, amountOut);
        } catch {
            emit BuybackFailed(ethAmount);
        }
    }

    receive() external payable {
        ethQueued += msg.value;
        emit EthQueued(msg.value, ethQueued);
    }
}
