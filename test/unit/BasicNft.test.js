const { network, ethers, deployments, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { assert } = require("chai");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNft", () => {
        let basicNft, deployer

        beforeEach(async () => {
            const accounts = await ethers.getSigners()
            deployer = accounts[0]

            await deployments.fixture(["all"])
            basicNft = await ethers.getContractAt(
                "BasicNft",
                (await deployments.get("BasicNft")).address
            )
        })

        describe("constructor", () => {
            it("Initializes the NFT correctly", async () => {
                const name = (await basicNft.name()).toString()
                const symbol = (await basicNft.symbol()).toString()
                const tokenCounter = (await basicNft.getTokenCounter()).toString()
                assert.equal(name, "Doggy")
                assert.equal(symbol, "Dog")
                assert.equal(tokenCounter, "0")
            })
        })

        describe("mintNft", () => {
            beforeEach(async () => {
                const txResponse = await basicNft.mintNft()
                await txResponse.wait(1)
            })
            it("Allows user to mint an NFT, and update appropriately", async () => {
                const tokenURI = await basicNft.tokenURI(0)
                const tokenCounter = await basicNft.getTokenCounter()

                assert.equal(tokenURI, await basicNft.TOKEN_URI())
                assert.equal(tokenCounter.toString(), "1")
            })
            it("Show the correct balance and owner of NFT", async () => {
                const owner = await basicNft.ownerOf("0")
                const balance = await basicNft.balanceOf(deployer.address)
                assert.equal(owner, deployer.address)
                assert.equal(balance, "1")
            })
        })
    })