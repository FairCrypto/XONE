// SPDX-License-Identifier: MIT

const assert = require('assert')
//const ethers = require('ethers')
const truffleAssert = require('truffle-assertions')
const timeMachine = require('ganache-time-traveler');

const XONE = artifacts.require("XONEFullyMinted")
const Burner = artifacts.require("Burner")
const BadBurner = artifacts.require("BadBurner")
const RevertingBurner = artifacts.require("RevertingBurner")

const { toBigInt } = require('../src/utils.js')

contract("XONE Token (Burning)", async accounts => {

    let token
    let burner
    let badBurner
    let revertingBurner
    const term = 2
    let balance

    before(async () => {
        try {
            token = await XONE.deployed()
            // test 'good actor' contract
            burner = await Burner.new(token.address);
            // test 'bac actor' contracts
            badBurner = await BadBurner.new(token.address);
            revertingBurner = await RevertingBurner.new(token.address);
            balance = await token.balanceOf(accounts[0], {from: accounts[0]}).then(toBigInt)
        } catch (e) {
            console.error(e)
        }
    })

    it('Should not allow calling Burn function for 0 amount', async () => {
        await truffleAssert.fails(
            token.burn(accounts[0], 0, {from: accounts[0]}),
            'XONE: Below min limit'
        )
    })

    it('Should not allow calling Burn function for valid amount directly', async () => {
        await truffleAssert.fails(
            token.burn(accounts[0], balance / 2n, {from: accounts[0]}),
        )
    })

    it('Should not allow calling Burn function from supported contract without approval', async () => {
        await truffleAssert.fails(
            burner.exchangeTokens(balance / 2n, {from: accounts[0]}),
            'ERC20: insufficient allowance.'
        )
    })

    it('Should allow calling Burn function from supported contract after prior approval', async () => {
        await assert.doesNotReject(() => token.approve(burner.address, balance / 2n, {from: accounts[2]}));
        await truffleAssert.fails(
            burner.exchangeTokens(balance / 2n, {from: accounts[0]})
        )
    })

    it('Should allow calling Burn function from supported contract after prior approval', async () => {
        await assert.doesNotReject(() => token.approve(burner.address, balance / 2n, {from: accounts[0]}));
        await assert.doesNotReject(() => {
            return burner.exchangeTokens(balance / 2n, {from: accounts[0]})
        })
    })

    it('Post burn, balances for XEN and other contract should show correct numbers', async () => {
        const xenBalance = await token.balanceOf(accounts[0], {from: accounts[0]}).then(toBigInt)
        const otherBalance = await burner.balanceOf(accounts[0], {from: accounts[0]}).then(toBigInt)
        assert.ok(xenBalance === otherBalance);
        assert.ok(xenBalance === balance / 2n);
    })

    it('Should not allow reentrancy calls; should maintain original state', async () => {
        await assert.doesNotReject(() => token.approve(badBurner.address, balance / 2n, {from: accounts[0]}));
        await truffleAssert.fails(
            badBurner.exchangeTokens(balance / 100n, {from: accounts[0]})
        )
        const xenBalance = await token.balanceOf(accounts[0], {from: accounts[0]}).then(toBigInt)
        const otherBalance = await burner.balanceOf(accounts[0], {from: accounts[0]}).then(toBigInt)
        const badBalance = await badBurner.balanceOf(accounts[0], {from: accounts[0]}).then(toBigInt)
        // console.log('bad', badBalance)
        assert.ok(xenBalance === otherBalance);
        assert.ok(xenBalance === balance / 2n);
        assert.ok(badBalance === 0n);
    })

    it('In case of reverting callbacks (bad or good); should maintain original state', async () => {
        await assert.doesNotReject(() => token.approve(badBurner.address, balance / 2n, {from: accounts[0]}));
        await truffleAssert.fails(
            revertingBurner.exchangeTokens(balance / 100n, {from: accounts[0]})
        )
        const xenBalance = await token.balanceOf(accounts[0], {from: accounts[0]}).then(toBigInt)
        const otherBalance = await burner.balanceOf(accounts[0], {from: accounts[0]}).then(toBigInt)
        const badBalance = await revertingBurner.balanceOf(accounts[0], {from: accounts[0]}).then(toBigInt)
        // console.log('bad', badBalance)
        assert.ok(xenBalance === otherBalance);
        assert.ok(xenBalance === balance / 2n);
        assert.ok(badBalance === 0n);
    })

})
