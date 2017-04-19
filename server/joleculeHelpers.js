
module.exports = {
  "set": function(pdb,energyCutoffSet){return joleculeHelpers(pdb,energyCutoffSet);}
}

var joleculeHelpers = function(pdb,energyCutoffSet){

    var config = require('../config');
    var childProcess = require("child_process");
    var path = require('path');
    var fs = require('fs');
    var mkdirp = require('mkdirp');
    var request = require('request');
    const zlib = require('zlib');
    var exports = {}; 

    const SPACIAL_CUTOFF = config.jolecule.SPACIAL_CUTOFF;
    const MAP_FILE_PATH = config.jolecule.MAP_FILE_PATH;
    const PDB_FILE_PATH = config.jolecule.PDB_FILE_PATH;
    const PREPROCESSING_SCRIPT = config.jolecule.PREPROCESSING_SCRIPT;
    const JOL_STATIC_SCRIPT =config.jolecule.JOL_STATIC_SCRIPT;
    const NOBLE_GAS_SYMBOLS = config.jolecule.NOBLE_GAS_SYMBOLS;
    const ENERGY_CUTOFF_SETS = config.jolecule.ENERGY_CUTOFF_SETS;
    const DATA_SERVER_FILE_NUMBERS = [0,1,2,3,4,5];

    pdb = pdb.toLowerCase();
    exports.pdb = pdb;
    exports.energyCutoffSet = energyCutoffSet;
    exports.ENERGY_CUTOFF_SETS = ENERGY_CUTOFF_SETS;

    var energyCutoffs = ENERGY_CUTOFF_SETS[energyCutoffSet];

    var mapFileRemotePath =function(nobleGas){ return `${MAP_FILE_PATH}/${pdb}/${pdb}.${nobleGas}.map`;}
    var mapLocalPath =function(nobleGas){ return  `${config.web.baseStatic}/data/${pdb}/maps/${nobleGas}`;}
    var mapFileLocalPath =function(nobleGas){ return  `${config.web.baseStatic}/data/${pdb}/maps/${nobleGas}/${pdb}.${nobleGas}.map`;}

    var pdbFileRemotePath =function(){
        var pdbGroup = pdb.substring(1,3);
         return `${PDB_FILE_PATH}/${pdbGroup}/pdb${pdb}.ent.gz`;
        }
    var pdbStructureFileLocalPath =function(){ return  `${config.web.baseStatic}/data/${pdb}/pdbs/pdb${pdb}.ent.gz`;}    
    var pdbFileLocalPath =function(){ return  `${config.web.baseStatic}/data/${pdb}/pdbs/${pdb}.pdb`;}

    var processedPdbLocalPath  =function(){ return  `${config.web.baseStatic}/data/${pdb}/pdbs/${energyCutoffSet}`;}
    var processedPdbFileLocalPath  =function(nobleGas){ return  `${config.web.baseStatic}/data/${pdb}/pdbs/${energyCutoffSet}/${pdb}.${nobleGas}.pdb`;}

    var dataServerLocalPathClient =function(){ return  `/data/${pdb}/dataServers/${energyCutoffSet}`;}
    var dataServerLocalPath =function(){ return  `${config.web.baseStatic}/data/${pdb}/dataServers/${energyCutoffSet}`;}
    var dataServerFileLocalPath =function(i){ return  `${config.web.baseStatic}/data/${pdb}/dataServers/${energyCutoffSet}/data-server${i}.js`;}
    var dataServerRoute =function(){ return  `/data/${pdb}/${energyCutoffSet}`;}
    

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
        "dataServerRoute":dataServerRoute(),
    };

    exports.ensureJoleculeDataServers = function(){
            return ensureLocalFiles()
            .then(ensurePreProcessingFiles)
            .then(ensureJoleculeStatic);
    };

    var ensureLocalFiles = function(){
        var localFiles = [];
        localFiles.push(getMapFiles());
        localFiles.push(getPdbFile());
        return Promise
            .all(localFiles);  
    }

    var getMapFiles = function(){
        console.log("Checking for Map files");
        return Promise
            .all(NOBLE_GAS_SYMBOLS.map(getMapFile));
    };

    var getMapFile = function(nobleGas) {
        var remoteFilePath = mapFileRemotePath(nobleGas);
        var localFilePath = mapFileLocalPath(nobleGas);   
        return ensureFileWithRemoteFile(localFilePath,remoteFilePath)
            .catch(function(err){throw("Failed to find " + nobleGas + " Map File due to the following error: " + err)});
    };

    var getPdbFile = function (){
        console.log("Checking for PDB file");
        var remoteFilePath = pdbFileRemotePath();
        var localStructureFilePath = pdbStructureFileLocalPath()
        var localFilePath = pdbFileLocalPath();
        return ensureFileWithRemoteFile(localStructureFilePath,remoteFilePath)
            .then(function(){decompressGzFile(localStructureFilePath,localFilePath)})
            .catch(function(err){throw("Failed to find "+ pdb +" PDB File due to the following error: " + err)});
    };

    var decompressGzFile = function(inputFile,outputFile){
        const gzip = zlib.createGunzip();
        const inp = fs.createReadStream(inputFile);
        const out = fs.createWriteStream(outputFile);
        inp.pipe(gzip).pipe(out);
    }

    var getRemoteFile = function(localFilePath,remoteFilePath){
        return new Promise(function(resolve,reject){
            var remoteFileStream = request(remoteFilePath);
            remoteFileStream.pause();
            remoteFileStream.on('end',resolve);
            remoteFileStream.on('error',reject);
            remoteFileStream.on('response', function (resp) {
                if(resp.statusCode === 200){     
                    console.log("Generating missing file:" +localFilePath+" from "+remoteFilePath);   
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
            return Promise.resolve(localFilePath);
        }else{
            var localFileDir = path.dirname(localFilePath);
            console.log(localFilePath +" does not exist creating directory "+localFileDir);
            ensureDirectorySync(localFileDir);   
            return getRemoteFile(localFilePath,remoteFilePath) 
                .then(function(){
                    if (fs.existsSync(localFilePath)){
                        return localFilePath;
                    }else{
                        throw("Failed to create "+ localFilePath + " from "+ remoteFilePath);
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
        return runScriptAsync(PREPROCESSING_SCRIPT,[ "-u", energyCutoff,"-s", SPACIAL_CUTOFF,"-o",processedPdbLocalPath()+"/", pdb],{cwd:mapLocalPath(nobleGas)+'/'});
    };

    var ensureJoleculeStatic = function(){
        console.log("Checking for Static files");
        if(checkJoleculeStaticFiles()){
            return getDataServers();
        }else{
            return runJoleculeStatic()
                .then(function(){
                    if(checkJoleculeStaticFiles()){
                        return getDataServers();
                    }else{
                        throw("Static script succeeded but Static Files not generated");
                    }
                })
                .catch(function(err){throw("Failed to Build Jolecule Data_Server due to the following error: " + err)});
        }
    };

    var getDataServers = function(){
        dataServerPromises = [];
        for(i=0;i<=5;i++){
            dataServerPromises.push(getDataServer(i));
        } 
        return Promise.all(dataServerPromises);
    }

    var getDataServer = function(fileIndex){
        var localFilePath = dataServerFileLocalPath(fileIndex);
        return new Promise(function(resolve,reject){
            fs.readFile(localFilePath, function (err, data ) {
                if(err){
                    reject(error);
                }else{
                    resolve(data);
                }
            });
        });
    }


    var checkJoleculeStaticFiles = function(){
        result = true;       
        for(i=0;i<=5;i++){
            var localFilePath = dataServerFileLocalPath(i); 
            if(!fs.existsSync(localFilePath)){ 
                console.log(localFilePath+" not found");               
                result = false;
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