// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {CalderaToken} from "../src/mocks/CalderaToken.sol";
import {CalderaGame} from "../src/CalderaGame.sol";
import {CalderaMiner} from "../src/CalderaMiner.sol";
import {CalderaStake} from "../src/CalderaStake.sol";
import {CalderaBuyback} from "../src/CalderaBuyback.sol";
import {MockSwapRouter} from "../src/mocks/MockSwapRouter.sol";

contract CalderaGameTest is Test {
    CalderaToken internal token;
    CalderaGame internal game;
    CalderaMiner internal miner;
    CalderaStake internal stake;
    CalderaBuyback internal buyback;
    MockSwapRouter internal router;

    address internal protocol = makeAddr("protocol");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    uint256 internal constant START = 1 ether;
    /// @dev 1 ETH → 1000 CLDR
    uint256 internal constant RATE = 1000;

    function setUp() public {
        token = new CalderaToken(address(this));
        miner = new CalderaMiner(address(token));
        stake = new CalderaStake(address(token));
        buyback = new CalderaBuyback(address(token), address(miner));
        game = new CalderaGame(protocol, START);
        router = new MockSwapRouter(RATE);

        // Fund router with CLDR for buybacks
        token.transfer(address(router), 50_000_000 ether);
        // Users get CLDR for staking
        token.transfer(alice, 100_000 ether);
        token.transfer(bob, 100_000 ether);
        token.transfer(carol, 100_000 ether);

        miner.setGame(address(game));
        miner.setBuyback(address(buyback));
        stake.setGame(address(game));
        buyback.setGame(address(game));
        buyback.setRouter(address(router));
        game.setModules(address(miner), address(stake), address(buyback));

        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(carol, 100 ether);
    }

    function test_genesisSeize_splitsAndVault() public {
        uint256 aliceEthBefore = alice.balance;

        vm.prank(alice);
        game.seize{value: START}(3); // Ridge

        assertEq(game.landOwner(3), alice);
        // Genesis: 85% + 10% → buyback, 3% stake residual, 2% protocol
        assertEq(game.protocolAccrued(), (START * 200) / 10_000);
        assertEq(game.activeLands(), 1);

        // Alice paid START (no refund)
        assertEq(alice.balance, aliceEthBefore - START);

        // Buyback deposits CLDR into miner (95% of START × RATE); 1-wei floor ok
        uint256 buybackEth = (START * 9_500) / 10_000; // 85% + 10%
        uint256 expectedCldr = buybackEth * RATE;
        assertApproxEqAbs(miner.pendingMining(alice), expectedCldr, 1e15);

        vm.prank(alice);
        uint256 claimed = miner.claimMining();
        assertApproxEqAbs(claimed, expectedCldr, 1e15);
        assertEq(token.balanceOf(alice), 100_000 ether + claimed);
    }

    function test_overbid_paysPrevious85() public {
        vm.prank(alice);
        game.seize{value: START}(5); // Crown

        uint256 next = game.nextPrice(5);
        assertEq(next, (START * 11_000) / 10_000);

        uint256 aliceBefore = alice.balance;
        vm.prank(bob);
        game.seize{value: next}(5);

        assertEq(game.landOwner(5), bob);
        uint256 expectedPrev = (next * 8_500) / 10_000;
        assertEq(alice.balance - aliceBefore, expectedPrev);
    }

    function test_stakeReceivesEthSlice() public {
        vm.startPrank(carol);
        token.approve(address(stake), type(uint256).max);
        stake.stake(10_000 ether);
        vm.stopPrank();

        vm.prank(alice);
        game.seize{value: START}(2); // Antarctica

        uint256 stakeSlice = (START * 300) / 10_000;
        assertEq(stake.pendingEth(carol), stakeSlice);

        uint256 before = carol.balance;
        vm.prank(carol);
        uint256 got = stake.claimEth();
        assertEq(got, stakeSlice);
        assertEq(carol.balance, before + stakeSlice);
    }

    function test_fullLoop_buybackToMiningClaim() public {
        // Carol stakes so 3% has a recipient
        vm.startPrank(carol);
        token.approve(address(stake), type(uint256).max);
        stake.stake(1_000 ether);
        vm.stopPrank();

        vm.prank(alice);
        game.seize{value: START}(4); // Basin

        assertGt(miner.pendingMining(alice), 0);

        uint256 next = game.nextPrice(4);
        vm.prank(bob);
        game.seize{value: next}(4);

        // Alice still has mining from genesis + residual share before outbid
        assertGt(miner.pendingMining(alice), 0);
        // Bob should accrue from the overbid buyback slice
        assertGt(miner.pendingMining(bob), 0);

        vm.prank(alice);
        miner.claimMining();
        vm.prank(bob);
        miner.claimMining();
    }

    function test_bidTooLow_reverts() public {
        vm.prank(alice);
        game.seize{value: START}(1); // Ember

        vm.prank(bob);
        vm.expectRevert(CalderaGame.BidTooLow.selector);
        game.seize{value: START}(1);
    }

    function test_invalidLand_reverts() public {
        vm.prank(alice);
        vm.expectRevert(CalderaGame.InvalidLand.selector);
        game.seize{value: START}(0);

        vm.prank(alice);
        vm.expectRevert(CalderaGame.InvalidLand.selector);
        game.seize{value: START}(8);
    }

    function test_excessEth_refunded() public {
        uint256 before = alice.balance;
        vm.prank(alice);
        game.seize{value: START + 0.5 ether}(7); // Spire
        assertEq(alice.balance, before - START);
    }

    function test_idlePenalty_reducesWeight() public {
        vm.prank(alice);
        game.seize{value: START}(4); // Basin

        uint256 wFull = miner.weightOf(alice);
        assertGt(wFull, 0);

        // Deposit more rewards after idle
        vm.warp(block.timestamp + 8 days);
        miner.poke(4);

        uint256 wIdle = miner.weightOf(alice);
        assertEq(wIdle, (wFull * 2_500) / 10_000);
    }
}
