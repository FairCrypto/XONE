const XENCrypto = artifacts.require("XENCrypto");
const XENTorrent = artifacts.require("XENTorrent");
const VMPX = artifacts.require("VMPX");
const MintInfo = artifacts.require("MintInfo");
const XONE = artifacts.require("XONESmallCAP.sol");

require("dotenv").config();

module.exports = async function (deployer, network) {

  const startBlock = process.env[`${network.toUpperCase()}_XONE_START_BLOCK`] || 0;

  if (network === 'test') {
    const xenContractAddress = XENCrypto.address;
    const xenTorrentAddress = XENTorrent.address;
    const vmpxAddress = VMPX.address;
    console.log('Deploying new XONE small CAP contract')
    console.log('    using', xenContractAddress, xenTorrentAddress, vmpxAddress);
    console.log('    start block', startBlock);

    await deployer.link(MintInfo, XONE);
    await deployer.deploy(XONE, xenContractAddress, xenTorrentAddress, vmpxAddress, startBlock);

  } else {
    const xenContractAddress = process.env[`${network.toUpperCase()}_CONTRACT_ADDRESS`];
    const xenTorrentAddress = process.env[`${network.toUpperCase()}_TORRENT_ADDRESS`];
    const vmpxAddress = process.env[`${network.toUpperCase()}_VMPX_ADDRESS`];
    console.log('Deploying new XONE small CAP contract')
    console.log('    using', xenContractAddress, xenTorrentAddress);
    console.log('    start block', startBlock);

    await deployer.link(MintInfo, XONE);
    await deployer.deploy(XONE, xenContractAddress, xenTorrentAddress, vmpxAddress, startBlock);
  }
};
