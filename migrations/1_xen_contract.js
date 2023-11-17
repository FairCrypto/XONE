const XENCrypto = artifacts.require("XENCrypto");
const Math = artifacts.require("XenMath");

require("dotenv").config();

module.exports = async function (deployer, network) {

  const xenContractAddress = process.env[`${network.toUpperCase()}_CONTRACT_ADDRESS`];

  if (network === 'test') {
    console.log('Deploying new XEN Crypto contract')
    await deployer.deploy(Math);
    await deployer.link(Math, XENCrypto);
    await deployer.deploy(XENCrypto);
  } else {
    console.log('Using existing XEN Crypto contract at', xenContractAddress)
  }
};
