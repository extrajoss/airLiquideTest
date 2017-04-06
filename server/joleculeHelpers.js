
module.exports = {
  "set": function(pdbId,energyCutoffSet){return joleculeHelpers(pdbId,energyCutoffSet);}
}

var joleculeHelpers = function(pdbId,energyCutoffSet){

    var config = require('../config');
    var childProcess = require("child_process");
    var path = require('path');
    var fs = require('fs');
    var mkdirp = require('mkdirp');
    var request = require('request');
    var exports = {}; 
    var pdbName = pdbId;

    exports.pdb = pdbName;


    const SPACIAL_CUTOFF = config.jolecule.SPACIAL_CUTOFF;
    const MAP_FILE_PATH = config.jolecule.MAP_FILE_PATH;
    const PDB_FILE_PATH = config.jolecule.PDB_FILE_PATH;
    const PREPROCESSING_SCRIPT = config.jolecule.PREPROCESSING_SCRIPT;
    const JOL_STATIC_SCRIPT =config.jolecule.JOL_STATIC_SCRIPT;
    const NOBLE_GAS_SYMBOLS = config.jolecule.NOBLE_GAS_SYMBOLS;
    const ENERGY_CUTOFF_SETS = config.jolecule.ENERGY_CUTOFF_SETS;
    const DATA_SERVER_FILE_NUMBERS = [0,1,2,3,4,5];

    var mapFileRemotePath =function(nobleGas){ return `${MAP_FILE_PATH}/${pdbName}/${pdbName}.${nobleGas}.map`;}
    var mapLocalPath =function(nobleGas){ return  `${config.web.baseStatic}/data/${pdbName}/maps/${nobleGas}`;}
    var mapFileLocalPath =function(nobleGas){ return  `${config.web.baseStatic}/data/${pdbName}/maps/${nobleGas}/${pdbName}.${nobleGas}.map`;}

    var pdbFileRemotePath =function(){ return `${PDB_FILE_PATH}/${pdbName}.pdb`;}
    var pdbFileLocalPath =function(){ return  `${config.web.baseStatic}/data/${pdbName}/pdbs/${pdbName}.pdb`;}

    var processedPdbLocalPath  =function(){ return  `${config.web.baseStatic}/data/${pdbName}/pdbs/${energyCutoffSet}`;}
    var processedPdbFileLocalPath  =function(nobleGas){ return  `${config.web.baseStatic}/data/${pdbName}/pdbs/${energyCutoffSet}/${pdbName}.${nobleGas}.pdb`;}

    var dataServerLocalPathClient =function(){ return  `/data/${pdbName}/dataServers/${energyCutoffSet}`;}
    var dataServerLocalPath =function(){ return  `${config.web.baseStatic}/data/${pdbName}/dataServers/${energyCutoffSet}`;}
    var dataServerFileLocalPath =function(i){ return  `${config.web.baseStatic}/data/${pdbName}/dataServers/${energyCutoffSet}/data-server${i}.js`;}

    exports.paths = {
        "mapFileRemotePaths":NOBLE_GAS_SYMBOLS.map(mapFileRemotePath),
        "mapLocalPaths":NOBLE_GAS_SYMBOLS.map(mapLocalPath),
        "mapFileLocalPath":NOBLE_GAS_SYMBOLS.map(mapFileLocalPath),
        "pdbFileRemotePath":mapFileLocalPath(),
        "pdbFileLocalPath":pdbFileLocalPath(),
        "processedPdbLocalPath":processedPdbLocalPath(),
        "processedPdbFileLocalPath":processedPdbFileLocalPath(),
        "dataServerLocalPathClient":dataServerLocalPathClient(),
        "dataServerLocalPath":dataServerLocalPath(),
        "dataServerFileLocalPaths":DATA_SERVER_FILE_NUMBERS.map(dataServerFileLocalPath),
    };


    var energyCutoffs = ENERGY_CUTOFF_SETS[energyCutoffSet];

    exports.ensureJoleculeIndex = function(){
            return ensureLocalFiles()
            .then(ensurePreProcessingFiles)
            .then(ensureJoleculeStatic);
    };

    var ensureLocalFiles = function(){
        console.log("Checking for Map files");
        var localFiles = getMapFiles();
        localFiles.push(getPdbFile());
        return Promise
            .all(localFiles)
            .catch(function(err){throw("Failed to find PDB or Map Files due to the following error: " + err)});
    }

    var getMapFiles = function(){
        return NOBLE_GAS_SYMBOLS.map(getMapFile);
    };

    var getMapFile = function(nobleGas) {
        var remoteFilePath = mapFileRemotePath(nobleGas);
        var localFilePath = mapFileLocalPath(nobleGas);   
        return ensureFileWithRemoteFile(localFilePath,remoteFilePath)
    };

    var getPdbFile = function (){
        var remoteFilePath = pdbFileRemotePath();
        var localFilePath = pdbFileLocalPath();
        return ensureFileWithRemoteFile(localFilePath,remoteFilePath);
    };

    var getRemoteFile = function(localFilePath,remoteFilePath){
        return new Promise(function(resolve,reject){
            var remoteFileStream = request(remoteFilePath);
            remoteFileStream.pause();
            remoteFileStream.on('end',resolve);
            remoteFileStream.on('error',reject);
            remoteFileStream.on('response', function (resp) {
                console.log("Generating missing file:" +localFilePath+" from "+remoteFilePath);
                if(resp.statusCode === 200){        
                    remoteFileStream.pipe(fs.createWriteStream(localFilePath));           
                    remoteFileStream.resume();
                }else{ 
                    reject("Could not retrieve file from "+ remoteFilePath +". Received StatusCode: "+resp.statusCode);
                }
            })
        });
    }

    var ensureFileWithRemoteFile = function (localFilePath,remoteFilePath){
        if (fs.existsSync(localFilePath)){
            console.log(localFilePath+" already exists locally");
            return Promise.resolve(localFilePath);
        }else{
            var localFileDir = path.dirname(localFilePath);
            ensureDirectorySync(localFileDir);   
            return getRemoteFile(localFilePath,remoteFilePath) 
                .then(function(){
                    if (fs.existsSync(localFilePath)){
                        console.log(localFilePath+" created from "+remoteFilePath);
                        return localFilePath;
                    }else{
                        throw("failed to create "+ localFilePath + " from "+ remoteFilePath);
                    }
                });
        }   
    };

    var ensureDirectorySync = function (directory) {  
        try {
            fs.statSync(directory);
        } catch(e) {
            mkdirp(
                directory,
                function (err) {
                    if (err) console.error(err)
                    else console.log(directory+' created')
                }
            );
        }
    };

    var checkDirectorySync = function (directory) {  
        try {
            fs.statSync(directory);
            return true;
        } catch(e) {
            return false;
        }
    };

    var getProcessedPDBFiles = function(){
        console.log("Checking for PreProcessed files");
        return NOBLE_GAS_SYMBOLS.map(getProcessedPDBFile);
    };

    var getProcessedPDBFile = function(nobleGas,nobleGasIndex) {
        var localFilePath = processedPdbFileLocalPath(nobleGas);
        var energyCutoff = energyCutoffs[nobleGasIndex];   
        var args = [nobleGas,energyCutoff];
        return ensureFileWithPreProcessingScript(localFilePath,args)
    };

    var ensureFileWithPreProcessingScript = function (localFilePath,args){        
        if (fs.existsSync(localFilePath)){
            console.log(localFilePath+" already exists locally");
            return Promise.resolve(localFilePath);
        }else{
            var localFileDir = path.dirname(localFilePath);
            ensureDirectorySync(localFileDir);   
            return runJoleculePreProcessing(args[0],args[1]) 
                .then(function(){
                    if (fs.existsSync(localFilePath)){
                        console.log(localFilePath+" created with cutoff of " + args[1] );
                        return localFilePath;
                    }else{
                        throw("failed to create "+ localFilePath + " with cutoff of " + args[1]);
                    }
                });
        }   
    };

    var ensurePreProcessingFiles = function(){
        var processedPDBFiles = getProcessedPDBFiles();
        return Promise
            .all(processedPDBFiles)
            .catch(function(err){throw("Failed to PreProcess map files due to the following error: " + err)});
    }

    var runJoleculePreProcessing = function(nobleGas,energyCutoff){
        return runScriptAsync(PREPROCESSING_SCRIPT,[ "-u", energyCutoff,"-s", SPACIAL_CUTOFF,"-o",processedPdbLocalPath()+"/", pdbName],{cwd:mapLocalPath(nobleGas)+'/'});
    };

    var ensureJoleculeStatic = function(){
        console.log("Checking for Static files");
        if(checkJoleculeStaticFiles()){
            console.log("Static files found");
            return Promise.resolve();
        }else{
            console.log("Static files not found");
            return runJoleculeStatic()
                .then(function(){
                    if(checkJoleculeStaticFiles()){
                        return Promise.resolve();
                    }else{
                        throw("Static script succeeded but Static Files not generated");
                    }
                })
                .catch(function(err){throw("Failed to Build Jolecule Data_Server due to the following error: " + err)});
        }
    };

    var checkJoleculeStaticFiles = function(){
        result = true;       
        for(i=0;i<=5;i++){
            var localFilePath = dataServerFileLocalPath(i); 
            if(!fs.existsSync(localFilePath)){ 
                console.log(localFilePath+" not found");               
                result = false;
            }else{
                console.log(localFilePath+" already exists locally");
            }
        } 
        return result;
    };

    var runJoleculeStatic = function (){
        console.log("Run jol-static");
        ensureDirectorySync(dataServerLocalPath()); 
        var scriptArguments = [];
        scriptArguments.push("-o");
        scriptArguments.push(dataServerLocalPath());
        scriptArguments.push(pdbFileLocalPath());
        scriptArguments = scriptArguments.concat(NOBLE_GAS_SYMBOLS.map(function(nobleGas){return processedPdbFileLocalPath(nobleGas)}));
        return  runScriptAsync(JOL_STATIC_SCRIPT,scriptArguments,{cwd:"./"});
    };

    var runScriptAsync = function (scriptPath,args,options){
        return new Promise(function(resolve,reject){
            runScript(scriptPath,args,options, resolve,reject);
        });
    };

    var runScript = function (scriptPath,args,options, success, fail) {
        var invoked = false;
        var process = childProcess.fork(scriptPath,args,options);
        process.on('error', function (err) {
            if (invoked) return;
            invoked = true;            
            fail(err);
        });
        process.on('exit', function (code) {
            if (invoked) return;
            invoked = true;
            var err = code === 0 ? null : new Error('exit code ' + code);
            if(err){                
                fail(err);
            }else{
                success();
            }
        });

    };
    
    return exports;
    
}