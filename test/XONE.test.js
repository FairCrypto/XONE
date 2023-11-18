// SPDX-License-Identifier: MIT

const assert = require('assert')
require('dotenv').config()
// const truffleAssert = require('truffle-assertions')
const timeMachine = require('ganache-time-traveler');
const {toBigInt, etherToWei} = require("../src/utils");

const XENCrypto = artifacts.require("XENCrypto")
const XENTorrent = artifacts.require("XENTorrent")
const XENStake = artifacts.require("XENStake")
const XONE = artifacts.require("XONE")
const VMPX = artifacts.require("VMPX")

const extraPrint = process.env.EXTRA_PRINT

contract("XONE Token", async accounts => {

    const term = 100;
    const count = 10;
    const tokenIdRegular = 10_001n;
    const virtualMinters = [];
    const NAME = "XONE"
    const SYMBOL = "XONE Token"
    const BATCH = 1_000n;
    const BATCH_XEN_OR_VMPX = 10_000n;
    const BATCH_COLLECTOR_XENFT = 12_000n;
    const CAP = 1_000_000_000n

    // const XEN_THRESHOLD = 1_000_000n;
    const VMPX_THRESHOLD = 100n;

    let xen, torrent, stake, vmpx, xone;
    let genesisTs;
    let tokenId;

    before(async () => {
        try {
            xen = await XENCrypto.deployed()
            torrent = await XENTorrent.deployed()
            stake = await XENStake.deployed()
            vmpx = await VMPX.deployed()
            xone = await XONE.deployed()
            genesisTs = await xen.genesisTs().then(_ => _.toNumber())
        } catch (e) {
            console.error(e)
        }
    })

    it("Should read basic XEN ERC-20 params", async () => {
        assert.ok(await xen.name() === 'XEN Crypto')
        assert.ok(await xen.symbol(), 'XEN')
    })

    it("Should read basic XENFT ERC-721 params", async () => {
        assert.ok(await torrent.name() === 'XEN Torrent')
        assert.ok(await torrent.symbol(), 'XENT')
    })

    it("Should read basic OKXEN ERC-20 params", async () => {
        assert.ok(await xone.name() === NAME)
        assert.ok(await xone.symbol(), SYMBOL)
    })

    it("Should perform claimRank operation (100d)", async () => {
        await xen.claimRank(term, { from: accounts[1] });
    })

    it("Should perform bulkClaimRank operation (100d)", async () => {
        const res = await torrent.bulkClaimRank(count, term, { from: accounts[2] });
        assert.ok(res.receipt.rawLogs.length === count + 2);
        res.receipt.rawLogs.slice(0, count).forEach(log => {
            virtualMinters.push(log.topics[1].replace('000000000000000000000000', ''))
        })
        tokenId = BigInt(res.receipt.rawLogs[count]?.topics[3]);
        assert.ok(tokenId === tokenIdRegular);
        assert.ok(virtualMinters.length === count);
        // run another mint
        await torrent.bulkClaimRank(count, term, { from: accounts[3] });
        await torrent.bulkClaimRank(count, term, { from: accounts[7] });
        await torrent.bulkClaimRank(count, term, { from: accounts[8] });
    })

    it("Should perform claimMintReward operation (in 100d)", async () => {
        await timeMachine.advanceTime(term * 24 * 3600 + 3600);
        await timeMachine.advanceBlock();
        await xen.claimMintReward({ from: accounts[1] });
        const xen2 = await xen.balanceOf(accounts[1]).then(toBigInt) / etherToWei;
        assert.ok(xen2 > 0n);
    })

    it("Should allow minting XONE.sol operation (no XEN, no XENFTs)", async () => {
        await xone.mint(0, false, { from: accounts[4] });
        const ok4 = await xone.balanceOf(accounts[4]).then(toBigInt) / etherToWei;
        assert.ok(ok4 === BATCH);
    })

    it("Should perform bulkClaimMintReward operation (in 100d)", async () => {
        await torrent.bulkClaimMintReward(tokenId, accounts[2],  { from: accounts[2] });
        await torrent.bulkClaimMintReward(tokenId + 1n, accounts[3],  { from: accounts[3] });
        await torrent.bulkClaimMintReward(tokenId + 2n, accounts[9],  { from: accounts[7] });
        await torrent.bulkClaimMintReward(tokenId + 3n, accounts[9],  { from: accounts[8] });
        const xen2 = await xen.balanceOf(accounts[2]).then(toBigInt) / etherToWei;
        assert.ok(xen2 > 10_000_000n);
        const xen3 = await xen.balanceOf(accounts[3]).then(toBigInt) / etherToWei;
        assert.ok(xen3 > 1_000_000n);
    })

    it("Should allow minting XONE.sol operation (XEN, no XENFTs)", async () => {
        await xen.transfer(accounts[5], 10_000_000n * etherToWei, { from: accounts[2] });
        await xone.mint(0, false, { from: accounts[5] });
        const ok2 = await xone.balanceOf(accounts[5]).then(toBigInt) / etherToWei;
        assert.ok(ok2 === BATCH_XEN_OR_VMPX);
    })

    it("Should allow minting XONE.sol operation (XENFTs: Collector)", async () => {
        await xone.mint(tokenId, false, { from: accounts[2] });
        const ok3 = await xone.balanceOf(accounts[2]).then(toBigInt) / etherToWei;
        assert.ok(ok3 === BATCH_COLLECTOR_XENFT);
    })

    it("Should allow minting VMPX token", async () => {
        // await xen.transfer(accounts[5], 10_000_000n * etherToWei, { from: accounts[2] });
        const power = 10n;
        const batch = await vmpx.BATCH().then(toBigInt) / etherToWei;
        await assert.doesNotReject(() => vmpx.mint(power, { from: accounts[6] }));
        const vmpx5 = await vmpx.balanceOf(accounts[6], { from: accounts[6] }).then(toBigInt) / etherToWei;
        assert.ok(vmpx5 === batch * power);
        assert.ok(vmpx5 >= VMPX_THRESHOLD);
    })

    it("Should allow minting XONE.sol operation (VMPX, no XENFTs)", async () => {
        await assert.doesNotReject(() => xone.mint(0, false, { from: accounts[6] }));
        const ok5 = await xone.balanceOf(accounts[6]).then(toBigInt) / etherToWei;
        assert.ok(ok5 === BATCH_XEN_OR_VMPX);
    })

    it("Should allow minting XONE.sol operation (XEN vanilla stake)", async () => {
        await assert.doesNotReject(() => xen.approve(stake.address, 1_000_000_000n * etherToWei, { from: accounts[9] }),);
        await assert.doesNotReject(() => stake.createStake(10_000_000n * etherToWei, 100, { from: accounts[9] }),);
        await assert.doesNotReject(() => xone.mint(0, false, { from: accounts[9] }));
        const ok9 = await xone.balanceOf(accounts[9]).then(toBigInt) / etherToWei;
        assert.ok(ok9 === BATCH_XEN_OR_VMPX);
    })

    it("Should NOT allow minting XONE.sol operation (bad XENFT)", async () => {
        await assert.rejects(() => xone.mint(9939, false, { from: accounts[3] }), 'ERC721: invalid token ID.');
    })

    it("Should NOT allow free transfer of XONE.sol tokens by a regular user until the mint is over", async () => {
        // const ok3b = await xone.balanceOf(accounts[3], { from: accounts[3] }).then(toBigInt) / etherToWei;
        const ok6b = await xone.balanceOf(accounts[6], { from: accounts[6] }).then(toBigInt) / etherToWei;
        // assert.ok(ok6b === 0n);
        await assert.rejects(
            () => xone.transfer(accounts[6], 1000n * etherToWei, { from: accounts[3] }),
        );
        // const ok3a = await xone.balanceOf(accounts[3], { from: accounts[3] }).then(toBigInt) / etherToWei;
        // const ok6a = await xone.balanceOf(accounts[6], { from: accounts[6] }).then(toBigInt) / etherToWei;
        // assert.ok(ok6a === 1000n);
        // assert.ok(ok3a === ok3b - ok6a);
    })

    it("Should NOT allow free transfer of XONE.sol tokens by the deployer until the mint is over", async () => {
        await assert.rejects(
            () => xone.transfer(accounts[3], 1000n * etherToWei, { from: accounts[0] }),
            ' OKXEN: minting not finished'
        );
    })

    it("XONE should have right total supply", async () => {
        const totalSupply = await xone.totalSupply().then(toBigInt) / etherToWei;
        assert.ok(totalSupply - CAP/2n === BATCH + 3n * BATCH_XEN_OR_VMPX + BATCH_COLLECTOR_XENFT);
    })

})

