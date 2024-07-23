const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts }) => {
    const {deployer} = await getNamedAccounts()

    // Basic NFT
    const basicNft = await ethers.getContractAt("BasicNft", (await deployments.get("BasicNft")).address)
    const basicMintTx = await basicNft.mintNft()
    await basicMintTx.wait(1)
    console.log(`Basic NFT  index 0 has tokenURI: ${await basicNft.tokenURI(0)}`)

    // Random IPFS NFT
    const randomIpfsNft = await ethers.getContractAt("RandomIpfsNft", (await deployments.get("RandomIpfsNft")).address)
    const mintFee = await randomIpfsNft.getMintFee()

    await new Promise(async (resolve, reject) => {
        setTimeout(resolve, 800000)
        randomIpfsNft.once("NftMinted", async function () {
            resolve()
        })
        const randomIpfsMintTx = await randomIpfsNft.requestNft({value: mintFee})
        const randomIpfsMintTxReceipt = await randomIpfsMintTx.wait(1)
        if(developmentChains.includes(network.name)) {
            const requestId = randomIpfsMintTxReceipt.logs[1].args.requestId.toString()
            const vrfCoordinatorV2_5Mock = await ethers.getContractAt("VRFCoordinatorV2_5Mock", (await deployments.get("VRFCoordinatorV2_5Mock")).address)
            await vrfCoordinatorV2_5Mock.fulfillRandomWords(requestId, randomIpfsNft.target)
        }
    })
    console.log(`Random IPFS NFT index 0 has tokenURI: ${await randomIpfsNft.tokenURI(0)}`)

    // Dynamic SVG NFT
    const highValue = ethers.parseEther("4000")
    const dynamicSvgNft = await ethers.getContractAt("DynamicSvgNft", (await deployments.get("DynamicSvgNft")).address)
    const dynamicNftMintTx = await dynamicSvgNft.mintNft(highValue.toString())
    await dynamicNftMintTx.wait(1)
    console.log(`Dynamic SVG NFT index 0 has tokenURI: ${await dynamicSvgNft.tokenURI(0)}`) 
}

module.exports.tags = ["all", "mint", "main"]