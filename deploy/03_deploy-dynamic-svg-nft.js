const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const fs = require("fs")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId
    let ethUsdPriceFeedAddress

    if(developmentChains.includes(network.name)) {
        const EthUsdAggregator = await ethers.getContractAt(
            "MockV3Aggregator",
            (await deployments.get("MockV3Aggregator")).address
        )
        ethUsdPriceFeedAddress = EthUsdAggregator.target
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
    }

    log("--------------------------")

    const lowSVG = fs.readFileSync("./images/dynamicNft/frown.svg", { encoding: "utf8" })
    const highSVG = fs.readFileSync("./images/dynamicNft/happy.svg", { encoding: "utf8" })

    args = [ethUsdPriceFeedAddress, lowSVG, highSVG]
    const dynamicSvgNft = await deploy(
        "DynamicSvgNft",
        {
            from: deployer,
            args: args,
            log: true,
            waitConfirmations: network.config.blockConfirmations || 1
        }
    )

    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying...")
        await verify(dynamicSvgNft.address, args)
    }
}

module.exports.tags = ["all", "dynamicsvg", "main"]