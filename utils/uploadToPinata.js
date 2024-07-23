const pinataSDK = require("@pinata/sdk")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

const pinataApiKey = process.env.PINATA_API_KEY
const pinataApiSecret = process.env.PINATA_API_SECRET
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret)

async function storeImages(imageFilePath) {
    const fullImagesPath = path.resolve(imageFilePath)
    const files = fs.readdirSync(fullImagesPath)
    let responses = []
    console.log("Uploading files to Pinata...")
    console.log(`Files - ${files}`)
    for (fileIndex in files) {
        console.log(`Working on ${files[fileIndex]   }`)
        const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`)
        try {
            const response = await pinata.pinFileToIPFS(readableStreamForFile, {
                pinataMetadata: { name: files[fileIndex] },
            })
            responses.push(response)
        } catch (error) {
            console.error(error)
        }
    }
    return { responses, files }
}

async function storeTokenUriMetadata(metadata) {
    try{
        const response = await pinata.pinJSONToIPFS(metadata)
        return response
    } catch (error) {
        console.error(error)
    }
    return null
}

module.exports = { storeImages, storeTokenUriMetadata }
