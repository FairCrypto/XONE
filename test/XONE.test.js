// SPDX-License-Identifier: MIT

const assert = require('assert')
require('dotenv').config()
// const truffleAssert = require('truffle-assertions')
const timeMachine = require('ganache-time-traveler');
const {toBigInt, etherToWei} = require("../src/utils");

const XENCrypto = artifacts.require("XENCrypto")
const XENTorrent = artifacts.require("XENTorrent")
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
    const BATCH_LIMITED_XENFT = 15_000n;
    const BATCH_APEX_RARE_XENFT = 20_000n;
    const BATCH_APEX_EPIC_XENFT = 30_000n;
    const BATCH_APEX_LEGENDARY_XENFT = 50_000n;
    const BATCH_APEX_EXOTIC_XENFT = 100_000n;
    const BATCH_APEX_XUNICORN_XENFT = 1_000_000n;
    const CAP = 1_000_000_000n

    // const XEN_THRESHOLD = 1_000_000n;
    const VMPX_THRESHOLD = 100n;

    let xen, torrent, vmpx, xone;
    let genesisTs;
    let tokenId;

    before(async () => {
        try {
            xen = await XENCrypto.deployed()
            torrent = await XENTorrent.deployed()
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
        await xen.claimRank(term, { from: accounts[2] });
    })

    it("Should perform bulkClaimRank operation (100d)", async () => {
        const res = await torrent.bulkClaimRank(count, term, { from: accounts[3] });
        assert.ok(res.receipt.rawLogs.length === count + 2);
        extraPrint && console.log('      gas used', res.receipt.gasUsed.toLocaleString());
        res.receipt.rawLogs.slice(0, count).forEach(log => {
            virtualMinters.push(log.topics[1].replace('000000000000000000000000', ''))
        })
        tokenId = BigInt(res.receipt.rawLogs[count]?.topics[3]);
        assert.ok(tokenId === tokenIdRegular);
        assert.ok(virtualMinters.length === count);
        // run another mint
        await torrent.bulkClaimRank(count, term, { from: accounts[3] });
    })

    it("Should perform claimMintReward operation (in 100d)", async () => {
        await timeMachine.advanceTime(term * 24 * 3600 + 3600);
        await timeMachine.advanceBlock();
        await xen.claimMintReward({ from: accounts[2] });
        const xen2 = await xen.balanceOf(accounts[2]).then(toBigInt) / etherToWei;
        assert.ok(xen2 > 0n);
    })

    it("Should have genesis deployer allocation @50% of cap", async () => {
        const ok0 = await xone.balanceOf(accounts[0]).then(toBigInt) / etherToWei;
        const cap = await xone.cap().then(toBigInt) / etherToWei;
        const totalSupply = await xone.totalSupply().then(toBigInt) / etherToWei;
        assert.ok(cap === CAP);
        assert.ok(totalSupply === CAP / 2n);
        assert.ok(ok0 === totalSupply);
    })

    it("Should allow minting XONE.sol operation (no XEN, no XENFTs)", async () => {
        await xone.mint(0, { from: accounts[4] });
        const ok4 = await xone.balanceOf(accounts[4]).then(toBigInt) / etherToWei;
        assert.ok(ok4 === BATCH);
    })

     it("Should allow minting XONE.sol operation (XEN, no XENFTs)", async () => {
        await xone.mint(0, { from: accounts[2] });
        const ok2 = await xone.balanceOf(accounts[2]).then(toBigInt) / etherToWei;
         assert.ok(ok2 === BATCH_XEN_OR_VMPX);
    })

     it("Should allow minting XONE.sol operation (XENFTs: Collector)", async () => {
        await xone.mint(tokenId, { from: accounts[3] });
        const ok3 = await xone.balanceOf(accounts[3]).then(toBigInt) / etherToWei;
         assert.ok(ok3 === BATCH_COLLECTOR_XENFT);
    })

    it("Should perform bulkClaimMintReward operation (in 100d)", async () => {
        await torrent.bulkClaimMintReward(tokenId, accounts[3],  { from: accounts[3] });
        await torrent.bulkClaimMintReward(tokenId + 1n, accounts[3],  { from: accounts[3] });
        const xen3 = await xen.balanceOf(accounts[3]).then(toBigInt) / etherToWei;
        assert.ok(xen3 > 20_000_000n);
    })

    it("Should allow to approve XEN burning in Torrent", async () => {
        await xen.approve(torrent.address, 1_000_000_000_000n * etherToWei,  { from: accounts[3] });
    })

    it("Should allow to mint Limited XENFT", async () => {
        const countLimited = 100;
        const res = await torrent.bulkClaimRankLimited(countLimited, term, 1_000n * etherToWei, { from: accounts[3] });
        extraPrint && console.log('      gas used', res.receipt.gasUsed.toLocaleString());
        tokenId = BigInt(res.receipt.rawLogs[countLimited + 2]?.topics[3]);
        assert.ok(tokenId === tokenIdRegular + 2n);
    })

    it("Account #3 XENFT balance should increase by 1", async () => {
        assert.ok(await torrent.balanceOf(accounts[3], { from: accounts[3] }).then(toBigInt) === 3n);
    })

    it("Should allow minting XONE.sol operation (XENFTs: Limited)", async () => {
        await xone.mint(tokenId, { from: accounts[3] });
        const ok3 = await xone.balanceOf(accounts[3]).then(toBigInt) / etherToWei;
        assert.ok(ok3 === BATCH_COLLECTOR_XENFT + BATCH_LIMITED_XENFT);
    })

    it("Should allow to mint Apex Rare XENFT", async () => {
        const countLimited = 100;
        const res = await torrent.bulkClaimRankLimited(countLimited, term, 50_000n * etherToWei, { from: accounts[3] });
        extraPrint && console.log('      gas used', res.receipt.gasUsed.toLocaleString());
        tokenId = BigInt(res.receipt.rawLogs[countLimited + 2]?.topics[3]);
    })

    it("Account #3 XENFT balance should increase by 1", async () => {
        assert.ok(await torrent.balanceOf(accounts[3], { from: accounts[3] }).then(toBigInt) === 4n);
    })

    it("Should allow minting XONE.sol operation (XENFTs: Rare)", async () => {
        const res = await xone.mint(tokenId, { from: accounts[3] });
        extraPrint && console.log('      gas used', res.receipt.gasUsed.toLocaleString());
        const ok3 = await xone.balanceOf(accounts[3]).then(toBigInt) / etherToWei;
        assert.ok(ok3 === BATCH_COLLECTOR_XENFT + BATCH_LIMITED_XENFT + BATCH_APEX_RARE_XENFT);
    })

    it("Should allow to mint Apex Epic XENFT", async () => {
        const countLimited = 100;
        const res = await torrent.bulkClaimRankLimited(countLimited, term, 100_000n * etherToWei, { from: accounts[3] });
        extraPrint && console.log('      gas used', res.receipt.gasUsed.toLocaleString());
        tokenId = BigInt(res.receipt.rawLogs[countLimited + 2]?.topics[3]);
    })

    it("Account #3 XENFT balance should increase by 1", async () => {
        assert.ok(await torrent.balanceOf(accounts[3], { from: accounts[3] }).then(toBigInt) === 5n);
    })

    it("Should allow minting XONE.sol operation (XENFTs: Epic)", async () => {
        const res = await xone.mint(tokenId, { from: accounts[3] });
        extraPrint && console.log('      gas used', res.receipt.gasUsed.toLocaleString());
        const ok3 = await xone.balanceOf(accounts[3]).then(toBigInt) / etherToWei;
        assert.ok(ok3 ===
            BATCH_COLLECTOR_XENFT +
            BATCH_LIMITED_XENFT +
            BATCH_APEX_RARE_XENFT +
            BATCH_APEX_EPIC_XENFT
        );
    })

    it("Should allow to mint Apex Legendary XENFT", async () => {
        const countLimited = 100;
        const res = await torrent.bulkClaimRankLimited(countLimited, term, 200_000n * etherToWei, { from: accounts[3] });
        extraPrint && console.log('      gas used', res.receipt.gasUsed.toLocaleString());
        tokenId = BigInt(res.receipt.rawLogs[countLimited + 2]?.topics[3]);
    })

    it("Account #3 XENFT balance should increase by 1", async () => {
        assert.ok(await torrent.balanceOf(accounts[3], { from: accounts[3] }).then(toBigInt) === 6n);
    })

    it("Should allow minting XONE.sol operation (XENFTs: Legendary)", async () => {
        const res = await xone.mint(tokenId, { from: accounts[3] });
        extraPrint && console.log('      gas used', res.receipt.gasUsed.toLocaleString());
        const ok3 = await xone.balanceOf(accounts[3]).then(toBigInt) / etherToWei;
        assert.ok(ok3 ===
            BATCH_COLLECTOR_XENFT +
            BATCH_LIMITED_XENFT +
            BATCH_APEX_RARE_XENFT +
            BATCH_APEX_EPIC_XENFT +
            BATCH_APEX_LEGENDARY_XENFT);
    })

    it("Should allow to mint Apex Exotic XENFT", async () => {
        const countLimited = 100;
        const res = await torrent.bulkClaimRankLimited(countLimited, term, 500_000n * etherToWei, { from: accounts[3] });
        extraPrint && console.log('      gas used', res.receipt.gasUsed.toLocaleString());
        tokenId = BigInt(res.receipt.rawLogs[countLimited + 2]?.topics[3]);
    })

    it("Account #3 XENFT balance should increase by 1", async () => {
        assert.ok(await torrent.balanceOf(accounts[3], { from: accounts[3] }).then(toBigInt) === 7n);
    })

    it("Should allow minting XONE.sol operation (XENFTs: Exotic)", async () => {
        const res = await xone.mint(tokenId, { from: accounts[3] });
        extraPrint && console.log('      gas used', res.receipt.gasUsed.toLocaleString());
        const ok3 = await xone.balanceOf(accounts[3]).then(toBigInt) / etherToWei;
        assert.ok(ok3 ===
            BATCH_COLLECTOR_XENFT +
            BATCH_LIMITED_XENFT +
            BATCH_APEX_RARE_XENFT +
            BATCH_APEX_EPIC_XENFT +
            BATCH_APEX_LEGENDARY_XENFT +
            BATCH_APEX_EXOTIC_XENFT
        );
    })

    it("Should allow to mint Apex Xunicorn XENFT", async () => {
        const countLimited = 100;
        const res = await torrent.bulkClaimRankLimited(countLimited, term, 1_000_000n * etherToWei, { from: accounts[3] });
        extraPrint && console.log('      gas used', res.receipt.gasUsed.toLocaleString());
        tokenId = BigInt(res.receipt.rawLogs[countLimited + 2]?.topics[3]);
    })

    it("Account #3 XENFT balance should increase by 1", async () => {
        assert.ok(await torrent.balanceOf(accounts[3], { from: accounts[3] }).then(toBigInt) === 8n);
    })

    it("Should allow minting XONE.sol operation (XENFTs: Xunicorn)", async () => {
        const res = await xone.mint(tokenId, { from: accounts[3] });
        extraPrint && console.log('      gas used', res.receipt.gasUsed.toLocaleString());
        const ok3 = await xone.balanceOf(accounts[3]).then(toBigInt) / etherToWei;
        assert.ok(ok3 ===
            BATCH_COLLECTOR_XENFT +
            BATCH_LIMITED_XENFT +
            BATCH_APEX_RARE_XENFT +
            BATCH_APEX_EPIC_XENFT +
            BATCH_APEX_LEGENDARY_XENFT +
            BATCH_APEX_EXOTIC_XENFT +
            BATCH_APEX_XUNICORN_XENFT
        );
    })

    it("Should allow minting VMPX token", async () => {
        const power = 10n;
        const batch = await vmpx.BATCH().then(toBigInt) / etherToWei;
        await assert.doesNotReject(() => vmpx.mint(power, { from: accounts[5] }));
        const vmpx5 = await vmpx.balanceOf(accounts[5], { from: accounts[5] }).then(toBigInt) / etherToWei;
        assert.ok(vmpx5 === batch * power);
        assert.ok(vmpx5 >= VMPX_THRESHOLD);
    })

    it("Should allow minting XONE.sol operation (VMPX, no XENFTs)", async () => {
        await assert.doesNotReject(() => xone.mint(0, { from: accounts[5] }));
        const ok5 = await xone.balanceOf(accounts[5]).then(toBigInt) / etherToWei;
        assert.ok(ok5 === BATCH_XEN_OR_VMPX);
    })

    it("Should NOT allow minting XONE.sol operation (bad XENFT)", async () => {
        await assert.rejects(() => xone.mint(9939, { from: accounts[3] }), 'ERC721: invalid token ID.');
    })

    it("Should NOT allow free transfer of XONE.sol tokens by a regular user until the mint is over", async () => {
        // const ok3b = await xone.balanceOf(accounts[3], { from: accounts[3] }).then(toBigInt) / etherToWei;
        const ok6b = await xone.balanceOf(accounts[6], { from: accounts[6] }).then(toBigInt) / etherToWei;
        assert.ok(ok6b === 0n);
        await assert.rejects(
            () => xone.transfer(accounts[6], 1000n * etherToWei, { from: accounts[3] }),
            ' OKXEN: minting not finished'
        );
        // const ok3a = await xone.balanceOf(accounts[3], { from: accounts[3] }).then(toBigInt) / etherToWei;
        // const ok6a = await xone.balanceOf(accounts[6], { from: accounts[6] }).then(toBigInt) / etherToWei;
        // assert.ok(ok6a === 1000n);
        // assert.ok(ok3a === ok3b - ok6a);
    })

    it("Should NOT allow free transfer of XONE.sol tokens by the deployer until the mint is over", async () => {
        await assert.rejects(
            () => xone.transfer(accounts[7], 1000n * etherToWei, { from: accounts[0] }),
            ' OKXEN: minting not finished'
        );
    })

    it("XONE should have right total supply", async () => {
        const totalSupply = await xone.totalSupply().then(toBigInt) / etherToWei;
        assert.ok(totalSupply === 501_248_000n);
    })

})

