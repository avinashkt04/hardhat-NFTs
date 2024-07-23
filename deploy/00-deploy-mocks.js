const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const DECIMALS = "18"
const INITIAL_PRICE = ethers.parseEther("2000")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const BASE_FEE = ethers.parseEther("0.25") // 0.25 is the premium. It costs 0.25 Link per request.
    const GAS_PRICE_LINK = 1000000000
    const WEI_PER_UNIT_LINK = 200000000000

    const args = [BASE_FEE, GAS_PRICE_LINK, WEI_PER_UNIT_LINK]

    if (developmentChains.includes(network.name)) {
        console.log("Local network detected! Deploying mocks...")
        await deploy("VRFCoordinatorV2_5Mock", {
            from: deployer,
            args: args,
            log: true
        })
        await deploy("MockV3Aggregator", {
            from: deployer,
            args: [DECIMALS, INITIAL_PRICE],
            log: true
        })
        console.log("Mocks deployed!")
        log("--------------------------")
    }
}

module.exports.tags = ["all", "mocks", "main"]
