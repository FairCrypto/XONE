const XENCrypto = artifacts.require("XENCrypto");
const XENTorrent = artifacts.require("XENTorrent");
const XENStake = artifacts.require("XENStake");
const VMPX = artifacts.require("VMPX");
const MintInfo = artifacts.require("MintInfo");
const StakeInfo = artifacts.require("StakeInfo");
const XONE = artifacts.require("XONE.sol");

require("dotenv").config();

module.exports = async function (deployer, network) {

  const startBlock = process.env[`${network.toUpperCase()}_XONE_START_BLOCK`] || 0;

  if (network === 'test') {
    const xenContractAddress = XENCrypto.address;
    const xenTorrentAddress = XENTorrent.address;
    const xenStakeAddress = XENStake.address;
    const vmpxAddress = VMPX.address;
    console.log('Deploying new XONE contract')
    console.log('    using', xenContractAddress, xenTorrentAddress, xenStakeAddress, vmpxAddress);
    console.log('    start block', startBlock);

    await deployer.link(MintInfo, XONE);
    await deployer.link(StakeInfo, XONE);
    await deployer.deploy(XONE, xenContractAddress, xenTorrentAddress, xenStakeAddress, vmpxAddress, startBlock);

  } else {
    const xenContractAddress = process.env[`${network.toUpperCase()}_CONTRACT_ADDRESS`];
    const xenTorrentAddress = process.env[`${network.toUpperCase()}_TORRENT_ADDRESS`];
    const vmpxAddress = process.env[`${network.toUpperCase()}_VMPX_ADDRESS`];
    console.log('Deploying new XONE contract')
    console.log('    using', xenContractAddress, xenTorrentAddress);
    console.log('    start block', startBlock);

    await deployer.link(MintInfo, XONE);
    await deployer.link(StakeInfo, XONE);
    await deployer.deploy(XONE, xenContractAddress, xenTorrentAddress, vmpxAddress, startBlock);
  }
};