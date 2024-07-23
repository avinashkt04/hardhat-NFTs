const {
  TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_END,
} = require("hardhat/builtin-tasks/task-names")

require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()
require("hardhat-deploy")
require("hardhat-gas-reporter")

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
      hardhat: {
          chainId: 31337,
          allowUnlimitedContractSize: true
      },
      localhost: {
          chainId: 31337,
          allowUnlimitedContractSize: true
      },
      sepolia: {
          chainId: 11155111,
          blockConfirmations: 5,
          url: SEPOLIA_RPC_URL,
          accounts: [PRIVATE_KEY],
      },
  },
  etherscan: {
      apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
      enabled: TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_END,
      currency: "USD",
      outputFile: "gas-report.txt",
      noColors: true,
    //   coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  solidity: {
    compilers: [
        {version: "0.8.8"},
        {version: "0.8.10"},
        {version: "0.6.12"},
        {version: "0.8.20"},
        {version: "0.8.19"},
    ],
    settings: {
        optimizer: {
            enabled: true,
            runs: 200
        }
    
    }
  },
  namedAccounts: {
      deployer: {
          default: 0,
      },
      player: {
          default: 1,
      },
  },
  mocha: { timeout: 200000},
}