// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ICalderaMiner} from "./interfaces/ICalderaMiner.sol";
import {ICalderaStake} from "./interfaces/ICalderaStake.sol";
import {ICalderaBuyback} from "./interfaces/ICalderaBuyback.sol";

/// @notice ETH land conquest. 85% previous / 3% stake / 10% buyback→miner vault / 2% protocol.
///         CLDR rewards come from buyback-funded vault (Stonks fair-launch compatible).
contract CalderaGame is ReentrancyGuard {
    /// @dev One conquerable land per territory. IDs are 1..LAND_COUNT (never 0).
    uint256 public constant LAND_COUNT = 7;
    uint256 public constant LAND_ID_MIN = 1;
    uint256 public constant BPS = 10_000;
    uint256 public constant PREV_BPS = 8_500;
    uint256 public constant STAKE_BPS = 300;
    uint256 public constant BUYBACK_BPS = 1_000;
    uint256 public constant PROTOCOL_BPS = 200;
    uint256 public constant PRICE_STEP_BPS = 11_000;

    address public immutable protocol;
    uint256 public immutable startingPrice;

    ICalderaMiner public miner;
    ICalderaStake public stake;
    ICalderaBuyback public buyback;

    struct Land {
        address owner;
        uint256 price;
        uint256 weight;
        uint256 seizeCount;
        uint256 lastSeizeAt;
    }

    mapping(uint256 => Land) public lands;

    uint256 public totalSeizes;
    uint256 public activeLands;
    uint256 public protocolAccrued;

    event ModulesSet(address miner, address stake, address buyback);
    event Seized(
        uint256 indexed landId,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 price,
        uint256 paidToPrevious,
        uint256 toStake,
        uint256 toBuyback,
        uint256 toProtocol
    );
    event ProtocolWithdrawn(address indexed to, uint256 amount);

    error InvalidLand();
    error BidTooLow();
    error ZeroAddress();
    error ModulesNotSet();
    error Unauthorized();
    error TransferFailed();

    constructor(address protocol_, uint256 startingPrice_) {
        if (protocol_ == address(0)) revert ZeroAddress();
        if (startingPrice_ == 0) revert BidTooLow();
        protocol = protocol_;
        startingPrice = startingPrice_;
    }

    function setModules(address miner_, address stake_, address buyback_) external {
        require(
            address(miner) == address(0) && miner_ != address(0) && stake_ != address(0)
                && buyback_ != address(0),
            "modules"
        );
        miner = ICalderaMiner(miner_);
        stake = ICalderaStake(stake_);
        buyback = ICalderaBuyback(buyback_);
        emit ModulesSet(miner_, stake_, buyback_);
    }

    function getLand(uint256 landId)
        external
        view
        returns (
            address owner,
            uint256 price,
            uint256 weight,
            uint256 seizeCount,
            uint256 lastSeizeAt
        )
    {
        if (!_validLand(landId)) revert InvalidLand();
        Land storage l = lands[landId];
        owner = l.owner;
        price = l.owner == address(0) && l.price == 0 ? startingPrice : l.price;
        weight = l.weight == 0 ? _defaultWeight(landId) : l.weight;
        seizeCount = l.seizeCount;
        lastSeizeAt = l.lastSeizeAt;
    }

    function nextPrice(uint256 landId) public view returns (uint256) {
        if (!_validLand(landId)) revert InvalidLand();
        Land storage l = lands[landId];
        if (l.owner == address(0)) {
            return l.price == 0 ? startingPrice : l.price;
        }
        return (l.price * PRICE_STEP_BPS) / BPS;
    }

    function landOwner(uint256 landId) external view returns (address) {
        if (!_validLand(landId)) revert InvalidLand();
        return lands[landId].owner;
    }

    function seize(uint256 landId) external payable nonReentrant {
        if (address(miner) == address(0)) revert ModulesNotSet();
        if (!_validLand(landId)) revert InvalidLand();

        Land storage l = lands[landId];
        uint256 price = nextPrice(landId);
        if (msg.value < price) revert BidTooLow();

        uint256 w = l.weight == 0 ? _defaultWeight(landId) : l.weight;
        if (l.weight == 0) l.weight = w;

        address prev = l.owner;
        uint256 toPrev;
        uint256 toStake = (price * STAKE_BPS) / BPS;
        uint256 toBuyback = (price * BUYBACK_BPS) / BPS;
        uint256 toProtocol = (price * PROTOCOL_BPS) / BPS;

        if (prev == address(0)) {
            // Genesis: previous slice boosts the buyback→vault flywheel
            toBuyback += (price * PREV_BPS) / BPS;
            activeLands += 1;
        } else {
            toPrev = (price * PREV_BPS) / BPS;
        }

        // Dust from rounding → protocol
        uint256 distributed = toPrev + toStake + toBuyback + toProtocol;
        if (price > distributed) toProtocol += price - distributed;

        // Register ownership before buyback so miner vault has weight to distribute into.
        l.owner = msg.sender;
        l.price = price;
        l.seizeCount += 1;
        l.lastSeizeAt = block.timestamp;
        totalSeizes += 1;
        miner.onLandSeized(landId, prev, msg.sender, w);

        if (toPrev > 0) _sendEth(prev, toPrev);
        if (toStake > 0) stake.notifyReward{value: toStake}();
        if (toBuyback > 0) buyback.notify{value: toBuyback}();
        if (toProtocol > 0) protocolAccrued += toProtocol;

        // Refund excess ETH
        if (msg.value > price) _sendEth(msg.sender, msg.value - price);

        emit Seized(landId, prev, msg.sender, price, toPrev, toStake, toBuyback, toProtocol);
    }

    function withdrawProtocol(address to, uint256 amount) external nonReentrant {
        if (msg.sender != protocol) revert Unauthorized();
        if (to == address(0)) revert ZeroAddress();
        if (amount > protocolAccrued) amount = protocolAccrued;
        protocolAccrued -= amount;
        _sendEth(to, amount);
        emit ProtocolWithdrawn(to, amount);
    }

    function _validLand(uint256 landId) internal pure returns (bool) {
        return landId >= LAND_ID_MIN && landId <= LAND_COUNT;
    }

    function _defaultWeight(uint256 landId) internal pure returns (uint256) {
        return 80 + (landId % 41);
    }

    function _sendEth(address to, uint256 amount) internal {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    receive() external payable {}
}
