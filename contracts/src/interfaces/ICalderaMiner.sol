// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface ICalderaMiner {
    function onLandSeized(uint256 landId, address previousOwner, address newOwner, uint256 weight)
        external;

    function pendingMining(address account) external view returns (uint256);
}
