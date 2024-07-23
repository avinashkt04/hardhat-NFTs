const { network, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("RandomIpfsNft", () => {
          let randomIpfsNft, entranceMintFee, vrfCoordinatorV2_5Mock, deployer
          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["all"])
              randomIpfsNft = await ethers.getContractAt(
                  "RandomIpfsNft",
                  (
                      await deployments.get("RandomIpfsNft")
                  ).address
              )
              vrfCoordinatorV2_5Mock = await ethers.getContractAt(
                  "VRFCoordinatorV2_5Mock",
                  (
                      await deployments.get("VRFCoordinatorV2_5Mock")
                  ).address
              )
              entranceMintFee = await randomIpfsNft.getMintFee()
          })

          describe("constructor", () => {
              it("Initialize the NFT correctly!", async () => {
                  const name = await randomIpfsNft.name()
                  const symbol = await randomIpfsNft.symbol()
                  const tokenCounter = await randomIpfsNft.getTokenCounter()
                  const callbackGasLimit = await randomIpfsNft.getCallbackGasLimit()
                  const requestConfirmation = await randomIpfsNft.getRequestConfirmations()
                  const numWords = await randomIpfsNft.getNumWords()
                  const gasLane = await randomIpfsNft.getGasLane()
                  assert.equal(name, "Random Ipfs Nft")
                  assert.equal(symbol, "RIN")
                  assert.equal(tokenCounter.toString(), "0")
                  assert.equal(callbackGasLimit.toString(), "500000")
                  assert.equal(requestConfirmation, 3)
                  assert.equal(numWords, 2)
                  assert.equal(gasLane, "0x8077df514608a09f83e4e8d300645594e5d7234665448ba83f51a50f842bd3d9")
              })
          })

          describe("requestNft", () => {
              it("Failed if mint fee is not sent with the request!", async () => {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWithCustomError(
                      randomIpfsNft,
                      "RandomIpfsNft__NeedMoreETHSent"
                  )
              })
              it("Revert when sufficient mint fee is not sent", async () => {
                  await expect(
                      randomIpfsNft.requestNft({ value: ethers.parseEther("0.001") })
                  ).to.be.revertedWithCustomError(randomIpfsNft, "RandomIpfsNft__NeedMoreETHSent")
              })
              it("Emit event on successfull NFT requested", async () => {
                  await expect(randomIpfsNft.requestNft({ value: entranceMintFee })).to.emit(
                      randomIpfsNft,
                      "NftRequested"
                  )
              })
          })

          describe("fulfillRandomWords", () => {
              let requestNftResponse
              beforeEach(async () => {
                  requestNftResponse = await randomIpfsNft.requestNft({ value: entranceMintFee })
              })
              it("Mint NFT after random word is returned", async () => {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async (tokenId, breed, minter) => {
                          try {
                              const tokenUri = await randomIpfsNft.tokenURI(tokenId.toString())
                              const tokenCounter = await randomIpfsNft.getTokenCounter()
                              const dogUri = await randomIpfsNft.getDogTokenUris(breed.toString())
                              console.log(tokenCounter)
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              assert.equal(dogUri.toString(), tokenUri.toString())
                              assert.equal(tokenCounter.toString(), +tokenId.toString() + 1)
                              assert.equal(minter, deployer.address)
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2_5Mock.fulfillRandomWords(
                              requestNftReceipt.logs[1].args.requestId,
                              randomIpfsNft.target
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })

          describe("getBreedModdedRng", () => {
              it("should return pug if moddedRng < 10", async () => {
                  const expectedValues = await randomIpfsNft.getBreedModdedRng(7)
                  assert.equal(expectedValues, 0)
              })
              it("should return shiba-inu if moddedRng between 10-39", async () => {
                  const expectedValues = await randomIpfsNft.getBreedModdedRng(39)
                  assert.equal(expectedValues, 1)
              })
              it("should return st. bernard if moddedRng between 40-99", async () => {
                  const expectedValues = await randomIpfsNft.getBreedModdedRng(40)
                  assert.equal(expectedValues, 2)
              })
              it("should revert if moddedRng > 99", async () => {
                  await expect(randomIpfsNft.getBreedModdedRng(100)).to.be.revertedWithCustomError(
                      randomIpfsNft,
                      "RandomIpfsNft__RangeOutOfBounds"
                  )
              })
          })
      })
