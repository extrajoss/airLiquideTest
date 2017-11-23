const { Logger, transports } = require('winston')
const config = require('./config')

const tsFormat = () => (new Date()).toLocaleTimeString()
const logger = new (Logger)({
  transports: [
    new (transports.Console)({
      timestamp: tsFormat,
      colorize: true
    })
  ]
})
logger.level = config.log.level

module.exports = logger
