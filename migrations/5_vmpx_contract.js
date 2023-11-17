const VMPX = artifacts.require("VMPX");

require("dotenv").config();

module.exports = async function (deployer, network) {

  const vmpxContractAddress = process.env[`${network.toUpperCase()}_VMPX_ADDRESS`];

  if (network === 'test') {
    const vmpxCycles = process.env[`${network.toUpperCase()}_VMPX_CYCLES`];
    const vmpxStartBlock = process.env[`${network.toUpperCase()}_VMPX_START_BLOCK`];

    console.log('Deploying new VMPX contract')
    await deployer.deploy(VMPX, vmpxCycles, vmpxStartBlock);
  } else {
    console.log('Using existing VMPX contract at', vmpxContractAddress)
  }
};
