const config = require('../config')
const ensureFile = require('./ensureFile.js')
const csvParse = require('fast-csv')
const joleculeHelpers = require('./joleculeHelpers.js')

const ensureFileWithRemoteFile = ensureFile.ensureFileWithRemoteFile

const UNIPROT_FILE_PATH = config.aquaria.UNIPROT_FILE_PATH

const uniprotFileLocalPath = function (uniprot) { return `${config.web.baseStatic}/data/uniprot/${uniprot}.csv` }
const uniprotFileRemotePath = function (uniprot) { return `${UNIPROT_FILE_PATH}/${uniprot}.csv` }

const getUniProtFile = function (uniprot) {
  const remoteFilePath = uniprotFileRemotePath(uniprot)
  const localFilePath = uniprotFileLocalPath(uniprot)
  return ensureFileWithRemoteFile(localFilePath, remoteFilePath)
        .catch(function (err) { if (err) throw new Error("There are no available uniprot files for the code '" + uniprot + "'<br/>") })
}

const parseCSV = function (fileName) {
  const results = {}
  const clusters = []
  const mapFileChecks = []
  return new Promise(function (resolve, reject) {
    csvParse
        .fromPath(fileName, {headers: true})
        .on('data', function (data) {
          const jol = joleculeHelpers.set(data['top pdb'], '-0.5')
          mapFileChecks.push(jol.checkMapFile())
          clusters.push(data)
        })
        .on('end', function () {
          results.clusters = clusters
          results.mapFileChecks = mapFileChecks
          resolve(results)
        })
  })
}
exports.parseCSV = parseCSV
exports.getUniProtFile = getUniProtFile
