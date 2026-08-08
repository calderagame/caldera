// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ICalderaStake} from "./interfaces/ICalderaStake.sol";

/// @notice Stake CLDR to earn a share of ETH from land seizes (3% slice).
///         Unstake is instant (COOLDOWN = 0). queueUnstake kept for ABI compatibility.
contract CalderaStake is ICalderaStake, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev 0 = instant unstake (no queue required).
    uint256 public constant COOLDOWN = 0;

    IERC20 public immutable token;
    address public game;

    uint256 public totalStaked;
    uint256 public accEthPerShare; // 1e18 scaler
    /// @dev ETH notified while totalStaked == 0; flushed on next stake/notify.
    uint256 public residualEth;
    mapping(address => uint256) public stakeOf;
    mapping(address => uint256) public rewardDebt;
    mapping(address => uint256) public earnedEth;
    mapping(address => uint256) public unstakeAvailableAt;

    event Staked(address indexed user, uint256 amount);
    event UnstakeQueued(address indexed user, uint256 availableAt);
    event Unstaked(address indexed user, uint256 amount);
    event EthRewardNotified(uint256 amount);
    event EthClaimed(address indexed user, uint256 amount);
    event GameSet(address game);

    error OnlyGame();
    error ZeroAmount();
    error CooldownActive();
    error InsufficientStake();
    error NoCooldown();

    modifier onlyGame() {
        if (msg.sender != game) revert OnlyGame();
        _;
    }

    constructor(address token_) {
        require(token_ != address(0), "token");
        token = IERC20(token_);
    }

    function setGame(address game_) external {
        require(game == address(0) && game_ != address(0), "game");
        game = game_;
        emit GameSet(game_);
    }

    function notifyReward() external payable onlyGame {
        if (msg.value == 0 && residualEth == 0) return;
        _creditEth(msg.value);
        emit EthRewardNotified(msg.value);
    }

    function pendingEth(address user) public view returns (uint256) {
        uint256 accrued = (stakeOf[user] * accEthPerShare) / 1e18;
        uint256 owed = accrued - rewardDebt[user];
        return earnedEth[user] + owed;
    }

    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        _sync(msg.sender);
        token.safeTransferFrom(msg.sender, address(this), amount);
        stakeOf[msg.sender] += amount;
        totalStaked += amount;
        _flushResidual();
        rewardDebt[msg.sender] = (stakeOf[msg.sender] * accEthPerShare) / 1e18;
        unstakeAvailableAt[msg.sender] = 0;
        emit Staked(msg.sender, amount);
    }

    /// @dev No-op path when COOLDOWN == 0; kept so older UIs don't break.
    function queueUnstake() external {
        if (COOLDOWN == 0) revert NoCooldown();
        if (stakeOf[msg.sender] == 0) revert InsufficientStake();
        unstakeAvailableAt[msg.sender] = block.timestamp + COOLDOWN;
        emit UnstakeQueued(msg.sender, unstakeAvailableAt[msg.sender]);
    }

    function unstake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (amount > stakeOf[msg.sender]) revert InsufficientStake();
        if (COOLDOWN > 0) {
            if (
                unstakeAvailableAt[msg.sender] == 0
                    || block.timestamp < unstakeAvailableAt[msg.sender]
            ) {
                revert CooldownActive();
            }
        }
        _sync(msg.sender);
        stakeOf[msg.sender] -= amount;
        totalStaked -= amount;
        rewardDebt[msg.sender] = (stakeOf[msg.sender] * accEthPerShare) / 1e18;
        token.safeTransfer(msg.sender, amount);
        if (stakeOf[msg.sender] == 0) unstakeAvailableAt[msg.sender] = 0;
        emit Unstaked(msg.sender, amount);
    }

    function claimEth() external nonReentrant returns (uint256 amount) {
        _sync(msg.sender);
        amount = earnedEth[msg.sender];
        if (amount == 0) revert ZeroAmount();
        earnedEth[msg.sender] = 0;
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "eth");
        emit EthClaimed(msg.sender, amount);
    }

    function _creditEth(uint256 amount) internal {
        uint256 total = amount + residualEth;
        residualEth = 0;
        if (total == 0) return;
        if (totalStaked == 0) {
            residualEth = total;
            return;
        }
        accEthPerShare += (total * 1e18) / totalStaked;
    }

    function _flushResidual() internal {
        if (residualEth == 0 || totalStaked == 0) return;
        uint256 amt = residualEth;
        residualEth = 0;
        accEthPerShare += (amt * 1e18) / totalStaked;
    }

    function _sync(address user) internal {
        uint256 accrued = (stakeOf[user] * accEthPerShare) / 1e18;
        uint256 owed = accrued - rewardDebt[user];
        if (owed > 0) {
            earnedEth[user] += owed;
            rewardDebt[user] = accrued;
        }
    }

    receive() external payable {
        residualEth += msg.value;
    }
}
