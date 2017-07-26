    const config = require('../config');
    const ensureFile = require('./ensureFile.js');
const csv_parse = require('fast-csv');
var joleculeHelpers = require('./joleculeHelpers.js');

    var ensureFileWithRemoteFile = ensureFile.ensureFileWithRemoteFile;

    const UNIPROT_FILE_PATH = config.aquaria.UNIPROT_FILE_PATH;
    
    var uniprotFileLocalPath =function(uniprot){ return  `${config.web.baseStatic}/data/uniprot/${uniprot}.csv`;}
    var uniprotFileRemotePath =function(uniprot){ return  `${UNIPROT_FILE_PATH}/${uniprot}.csv`;}
    
    var getUniProtFile = function(uniprot) {
        var remoteFilePath = uniprotFileRemotePath(uniprot);
        var localFilePath = uniprotFileLocalPath(uniprot);  
        return ensureFileWithRemoteFile(localFilePath,remoteFilePath)
            .catch(function(err){throw("There are no available uniprot files for the code '"+uniprotpdb+"'<br/>")});
    };

    var parseCSV = function(fileName){
        var results = {};
        var clusters = [];
        var mapFileChecks = [];
        return new Promise(function(resolve,reject){
            csv_parse
                .fromPath(fileName,{headers : true})
                .on('data', function(data){   
                    jol = joleculeHelpers.set(data["top pdb"],'-0.5'); 
                    mapFileChecks.push(jol.checkMapFile());              
                    clusters.push(data);
                })
                .on('end', function(){
                    results.clusters = clusters;
                    results.mapFileChecks = mapFileChecks;
                    resolve(results);
                });             
        });
    };
        exports.parseCSV = parseCSV;
    exports.getUniProtFile = getUniProtFile;