const XENCrypto = artifacts.require("XENCrypto");
const XENTorrent = artifacts.require("XENTorrent");
const XENStake = artifacts.require("XENStake");
const VMPX = artifacts.require("VMPX");
const MintInfo = artifacts.require("MintInfo_.sol");
const StakeInfo = artifacts.require("StakeInfo_.sol");
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

    // await deployer.link(MintInfo, XONE);
    // await deployer.link(StakeInfo, XONE);
    await deployer.deploy(XONE, xenContractAddress, xenTorrentAddress, xenStakeAddress, vmpxAddress, startBlock);
  } else {

    const xenContractAddress = process.env[`${network.toUpperCase()}_CONTRACT_ADDRESS`];
    const xenTorrentAddress = process.env[`${network.toUpperCase()}_TORRENT_ADDRESS`];
    const xenStakeAddress = process.env[`${network.toUpperCase()}_STAKER_ADDRESS`];
    const vmpxAddress = process.env[`${network.toUpperCase()}_VMPX_ADDRESS`];
    console.log('Deploying new XONE contract')
    console.log('    using', xenContractAddress, xenTorrentAddress, xenStakeAddress, vmpxAddress);
    console.log('    start block', startBlock);

    // const mintInfo = await MintInfo.at('0x4a930c184dcc6658209c9b50f7f02c4dc71bae4c');
    // const stakeInfo = await StakeInfo.at('0xc694bd7e5cd44a1616f145a48be9dcc99b65b242');
    await deployer.deploy(MintInfo);
    await deployer.deploy(StakeInfo);

    await deployer.link(MintInfo, XONE);
    await deployer.link(StakeInfo, XONE);
    await deployer.deploy(XONE, xenContractAddress, xenTorrentAddress, xenStakeAddress, vmpxAddress, startBlock);
  }
};
