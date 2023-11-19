const XENTorrent = artifacts.require("XENTorrent");
const XENCrypto = artifacts.require("XENCrypto");

require("dotenv").config();

module.exports = async function (deployer, network) {

    const xenTorrentAddress = process.env[`${network.toUpperCase()}_TORRENT_ADDRESS`];

    if (network === 'test') {
        const xenContractAddress = XENCrypto.address

        const {
            burnRates,
            rareLimits,
            forwarder,
            startBlock: sb,
            royaltyReceiver: rr
        } = require('../config/genesisParams.test.js')

        const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
        const startBlock = process.env[`${network.toUpperCase()}_START_BLOCK`] || sb || 0;
        const royaltyReceiver = process.env[`${network.toUpperCase()}_ROYALTY_RECEIVER`] || rr || ZERO_ADDRESS;

        console.log('Deploying new XENTorrent contract');
        console.log('    start block:', startBlock);
        console.log('    royalty receiver:', royaltyReceiver);

        const ether = 10n ** 18n;
        const burnRatesParam = burnRates.map(r => r * ether);

        if (xenContractAddress) {
            await deployer.deploy(
                XENTorrent,
                xenContractAddress,
                burnRatesParam,
                rareLimits,
                startBlock,
                forwarder,
                royaltyReceiver
            );
        } else {
            const xenContract = await XENCrypto.at(xenContractAddress);
            await deployer.deploy(
                XENTorrent,
                xenContract.address,
                burnRatesParam,
                rareLimits,
                startBlock,
                forwarder,
                royaltyReceiver
            );
        }

    } else {
        console.log('Using existing XENTorrent contract at', xenTorrentAddress)
    }
};
