const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")
const {verify} = require("../utils/verify")

const imagesLocation = "./images/randomNft"

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100,
        }
    ],
}

let tokenUris = [
    "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
    "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
    "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm"
]

const FUND_AMOUNT = ethers.parseEther("20000000") // 10 LINK

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // get the IPFS hashes of our images
    if(process.env.UPLOAD_TO_PINATA == "true"){
        tokenUris = await handleTokenUris()
    }


    // 1. With our own IPFS node.
    // 2. Pinata https://www.pinata.cloud/
    // 3. NFT.Storage https://nft.storage/

    let vrfCoordinatorV2_5Address, subscriptionId, vrfCoordinatorV2_5Mock

    if (developmentChains.includes(network.name)) {
        vrfCoordinatorV2_5Mock = await ethers.getContractAt(
            "VRFCoordinatorV2_5Mock",
            (
                await deployments.get("VRFCoordinatorV2_5Mock")
            ).address
        )
        vrfCoordinatorV2_5Address = vrfCoordinatorV2_5Mock.target
        const tx = await vrfCoordinatorV2_5Mock.createSubscription()
        const txReceipt = await tx.wait(1)
        subscriptionId = txReceipt.logs[0].args.subId
        await vrfCoordinatorV2_5Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2_5Address = networkConfig[chainId]["vrfCoordinatorV2_5"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    log("--------------------------")
    log("Deploying RandomIpfsNft...")

    const arguments = [
        vrfCoordinatorV2_5Address,
        subscriptionId,
        networkConfig[chainId]["gasLane"],
        networkConfig[chainId]["callbackGasLimit"],
        tokenUris,
        networkConfig[chainId]["mintFee"],
    ]

    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmation: network.config.blockConfirmations || 1,
    })

    if(developmentChains.includes(network.name)) {
        await vrfCoordinatorV2_5Mock.addConsumer(subscriptionId, randomIpfsNft.address)
        console.log("Consumer Added")
    }

    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying...")
        await verify(randomIpfsNft.address, arguments)
    }
    log("--------------------------")

}

async function handleTokenUris(){
    tokenUris = []
    // store the image in IPFS
    // store the metadata in IPFS
    const {responses: imageUploadResponses, files} = await storeImages(imagesLocation)
    for (let imageUploadResponsesIndex in imageUploadResponses){
        // create metadata
        // upload the metadata
        let tokenUriMetadata = { ...metadataTemplate }
        tokenUriMetadata.name = files[imageUploadResponsesIndex].replace(".png", "")
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponsesIndex].IpfsHash}`
        console.log(`Uploading metadata for ${tokenUriMetadata.name}...`)
        // store the JSON to pinata / IPFS
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    console.log(`Token URIs uploaded!. They are ${tokenUris}`)
    return tokenUris
}

module.exports.tags = ["all", "randomipfs", "main"]
