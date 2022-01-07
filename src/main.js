const { NFC } = require("nfc-pcsc")
const bootstrap = require("@artcom/bootstrap-client")

const config = require("../config.json")

bootstrap(config.bootstrapUrl, "nfcEventPublisher").then(async ({ logger, mqttClient, data }) => {
  const eventTopic = `${data.deviceTopic}/nfc/onEvent`
  
  const nfc = new NFC()
  nfc.on("reader", reader => handleReader(reader, logger, mqttClient, eventTopic))
  nfc.on("error", error => logger.error(error))
})

async function handleReader(reader, logger, mqttClient, eventTopic) {
  logger.info("Reader connected", { reader: reader.name })
  reader.aid = "F222222222"
  reader.autoProcessing = false

  reader.on("card", async card => {
    logger.info(`${reader.reader.name}, card detected`, { card })
    try {

			// reader.read(blockNumber, length, blockSize = 4, packetSize = 16)
      const buffer = await reader.read(0, 112, 4, 4)
      console.log("buffer", buffer)
      
      const startIndex = buffer.indexOf(config.tagScheme)
      if (startIndex !== -1) {
        const bufferStartScheme = buffer.slice(startIndex)
        logger.info(bufferStartScheme.toString())
        //"t-gallery://mango\u0000\u0000�\u0000 .."

        const bufferEnd0xFE = sliceIfPossible(bufferStartScheme, 0, 0xFE)
        logger.info(bufferEnd0xFE.toString())
        //"t-gallery://mango\u0000\u0000"
        
        const bufferEnd0x00 = sliceIfPossible(bufferEnd0xFE, 0, 0x00)
        logger.info(bufferEnd0x00.toString())
        //"t-gallery://mango"
        
        const payload = bufferEnd0x00.toString()

        mqttClient.publish(eventTopic, { event: "connect", payload })
        logger.info("Tag connected", { payload, card })
      } else {
        mqttClient.publish(eventTopic, { event: "connectUnknown" })
        logger.error({ text }, `Scheme "${config.tagScheme}" not found`)
      }

    } catch (err) {
      mqttClient.publish(eventTopic, { event: "connectUnknown" })
      logger.error("Error when reading data: ", err)
    }
  })

  reader.on("card.off", card => {
    mqttClient.publish(eventTopic, { event: "disconnect" })
    logger.info("Tag disconnected", { card })
  })

  reader.on("Error", error => logger.error({ error }))
  reader.on("End", () => logger.error("Reader disconnected", { reader: reader.name }))
}

function sliceIfPossible(buffer, start, item) {
  const index = buffer.indexOf(item)
  if (index !== -1) {
    return buffer.slice(start, index)
  } else {
    return buffer
  }
}
