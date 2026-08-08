// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ICalderaMiner} from "./interfaces/ICalderaMiner.sol";

/// @notice Distributes CLDR (funded by buybacks from seize ETH) to land holders by weight.
///         No pre-mint inflation — vault fills only when buyback deposits CLDR.
contract CalderaMiner is ICalderaMiner, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant IDLE_AFTER = 7 days;
    uint256 public constant IDLE_BPS = 2_500; // 25% effective weight when idle
    uint256 public constant BPS = 10_000;

    IERC20 public immutable token;
    address public game;
    address public buyback;

    struct LandMine {
        address owner;
        uint256 weight;
        uint256 storedEffective;
        uint256 lastActive;
    }

    mapping(uint256 => LandMine) public mines;
    mapping(address => uint256[]) private _owned;
    mapping(uint256 => uint256) private _ownedIndex; // landId => index+1

    uint256 public totalWeight;
    uint256 public accRewardPerWeight;
    /// @dev CLDR deposited while totalWeight == 0; flushed on next weight change.
    uint256 public residualRewards;
    mapping(address => uint256) public weightOf;
    mapping(address => uint256) public rewardDebt;
    mapping(address => uint256) public earned;

    event GameSet(address game);
    event BuybackSet(address buyback);
    event RewardDeposited(uint256 amount);
    event MiningClaimed(address indexed user, uint256 amount);
    event LandUpdated(uint256 indexed landId, address indexed owner, uint256 effectiveWeight);

    error OnlyGame();
    error OnlyBuyback();
    error ZeroAmount();
    error NothingToClaim();

    modifier onlyGame() {
        if (msg.sender != game) revert OnlyGame();
        _;
    }

    modifier onlyBuyback() {
        if (msg.sender != buyback) revert OnlyBuyback();
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

    function setBuyback(address buyback_) external {
        require(buyback == address(0) && buyback_ != address(0), "buyback");
        buyback = buyback_;
        emit BuybackSet(buyback_);
    }

    function ownedLands(address user) external view returns (uint256[] memory) {
        return _owned[user];
    }

    function ownedCount(address user) external view returns (uint256) {
        return _owned[user].length;
    }

    function pendingMining(address account) public view returns (uint256) {
        uint256 w = weightOf[account];
        if (w == 0) return earned[account];
        uint256 accrued = (w * accRewardPerWeight) / 1e18;
        return earned[account] + (accrued - rewardDebt[account]);
    }

    /// @notice Buyback deposits purchased CLDR into the reward vault.
    function depositRewards(uint256 amount) external onlyBuyback {
        if (amount == 0) revert ZeroAmount();
        token.safeTransferFrom(msg.sender, address(this), amount);
        _creditRewards(amount);
        emit RewardDeposited(amount);
    }

    /// @dev Called by game on every seize. Resets activity (full weight).
    function onLandSeized(uint256 landId, address previousOwner, address newOwner, uint256 weight)
        external
        onlyGame
    {
        if (previousOwner != address(0)) {
            _refreshLand(landId);
            _removeLandOwner(landId, previousOwner);
        }

        LandMine storage m = mines[landId];
        m.owner = newOwner;
        m.weight = weight;
        m.lastActive = block.timestamp;
        m.storedEffective = 0;

        _addLandOwner(landId, newOwner);
        _refreshLand(landId);
        _flushResidual();
        emit LandUpdated(landId, newOwner, m.storedEffective);
    }

    function claimMining() external nonReentrant returns (uint256 amount) {
        _refreshUser(msg.sender);
        _sync(msg.sender);
        amount = earned[msg.sender];
        if (amount == 0) revert NothingToClaim();
        earned[msg.sender] = 0;

        // Touch activity on all owned lands (claim = engagement)
        uint256[] storage list = _owned[msg.sender];
        for (uint256 i; i < list.length; i++) {
            mines[list[i]].lastActive = block.timestamp;
            _refreshLand(list[i]);
        }

        token.safeTransfer(msg.sender, amount);
        emit MiningClaimed(msg.sender, amount);
    }

    function poke(uint256 landId) external {
        _refreshLand(landId);
    }

    function _creditRewards(uint256 amount) internal {
        uint256 total = amount + residualRewards;
        residualRewards = 0;
        if (total == 0) return;
        if (totalWeight == 0) {
            residualRewards = total;
            return;
        }
        accRewardPerWeight += (total * 1e18) / totalWeight;
    }

    function _flushResidual() internal {
        if (residualRewards == 0 || totalWeight == 0) return;
        uint256 amt = residualRewards;
        residualRewards = 0;
        accRewardPerWeight += (amt * 1e18) / totalWeight;
    }

    function _calcEffective(uint256 landId) internal view returns (uint256) {
        LandMine storage m = mines[landId];
        if (m.owner == address(0) || m.weight == 0) return 0;
        if (block.timestamp > m.lastActive + IDLE_AFTER) {
            return (m.weight * IDLE_BPS) / BPS;
        }
        return m.weight;
    }

    function _refreshLand(uint256 landId) internal {
        LandMine storage m = mines[landId];
        address owner = m.owner;
        if (owner == address(0)) return;

        uint256 want = _calcEffective(landId);
        uint256 have = m.storedEffective;
        if (want == have) return;

        _sync(owner);
        weightOf[owner] = weightOf[owner] - have + want;
        totalWeight = totalWeight - have + want;
        m.storedEffective = want;
        rewardDebt[owner] = (weightOf[owner] * accRewardPerWeight) / 1e18;
    }

    function _refreshUser(address user) internal {
        uint256[] storage list = _owned[user];
        for (uint256 i; i < list.length; i++) {
            _refreshLand(list[i]);
        }
    }

    function _removeLandOwner(uint256 landId, address previousOwner) internal {
        _refreshLand(landId);
        LandMine storage m = mines[landId];
        uint256 have = m.storedEffective;
        if (have > 0) {
            _sync(previousOwner);
            weightOf[previousOwner] -= have;
            totalWeight -= have;
            rewardDebt[previousOwner] = (weightOf[previousOwner] * accRewardPerWeight) / 1e18;
            m.storedEffective = 0;
        }
        _removeFromOwned(previousOwner, landId);
        m.owner = address(0);
        m.weight = 0;
        m.lastActive = 0;
    }

    function _addLandOwner(uint256 landId, address newOwner) internal {
        _owned[newOwner].push(landId);
        _ownedIndex[landId] = _owned[newOwner].length; // 1-based
    }

    function _removeFromOwned(address user, uint256 landId) internal {
        uint256 idx1 = _ownedIndex[landId];
        if (idx1 == 0) return;
        uint256 idx = idx1 - 1;
        uint256[] storage list = _owned[user];
        uint256 last = list.length - 1;
        if (idx != last) {
            uint256 moved = list[last];
            list[idx] = moved;
            _ownedIndex[moved] = idx + 1;
        }
        list.pop();
        _ownedIndex[landId] = 0;
    }

    function _sync(address account) internal {
        uint256 w = weightOf[account];
        if (w == 0) {
            rewardDebt[account] = 0;
            return;
        }
        uint256 accrued = (w * accRewardPerWeight) / 1e18;
        uint256 owed = accrued - rewardDebt[account];
        if (owed > 0) {
            earned[account] += owed;
            rewardDebt[account] = accrued;
        }
    }
}
