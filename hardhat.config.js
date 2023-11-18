module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
        }
    },
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            },
            evmVersion: "london"
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
        scripts: "./migrations"
    },
    mocha: {
        timeout: 40000
    }
}