
module.exports = {
  "ensureJoleculeIndex": function(pdbId){return joleculeHelpers(pdbId).ensureJoleculeIndex();}
}

var joleculeHelpers = function(pdbId){

    var childProcess = require("child_process");
    var path = require('path');
    var fs = require('fs');
    var request = require('request');
    var exports = {};
    const ENERGY_CUTOFF = -0.6;
    const SPACIAL_CUTOFF = 2;

    var pdbName = pdbId;

    const MAP_FILE_PATH = "http://hpc.csiro.au/users/272675/airliquide/mapfiles/";
    const PDB_FILE_PATH = "https://files.rcsb.org/view/";
    const NOBLE_GAS_SYMBOLS = ["Ar","He","Kr","Ne","Xe"];
    const PREPROCESSING_SCRIPT = '../../../resources/jolecule/autodock2pdbES5.js';
    const JOL_STATIC_SCRIPT ='../../../resources/jolecule/jol-static.js';

    exports.ensureJoleculeIndex = function(){
            return ensureLocalFiles()
            .then(ensureJoleculePreProcessing)
            .then(ensureJoleculeStatic);
    };

    var ensureLocalFiles = function(){
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
        var fileName = pdbName + '.' +nobleGas+ '.map';
        var remoteFilePath = MAP_FILE_PATH + pdbName + '/'+ fileName;
        var localFilePath = './public/maps/' +pdbName + '/'+ fileName;   
        return ensureFileWithRemoteFile(localFilePath,remoteFilePath)
    };

    var getPdbFile = function (){
        var fileName = pdbName + '.pdb';
        var remoteFilePath = PDB_FILE_PATH + fileName;
        var localFilePath = './public/maps/' +pdbName+ '/'+ fileName;
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
            fs.mkdirSync(directory);
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
    

    var checkJoleculePreProcessingFiles = function(){
        var fileChecks = NOBLE_GAS_SYMBOLS.map(checkJoleculePreProcessingFile);
        for (var i = 0; i < fileChecks.length; i++) {
            if(!fileChecks[i]){
                return false;
            }       
        }
        return true;
    };

    var checkJoleculePreProcessingFile = function(nobleGas) {
        var fileName = pdbName + '.' +nobleGas+ '.pdb';
        var localFilePath = './public/maps/' +pdbName + '/'+ fileName;  
        return fs.existsSync(localFilePath);
    };

    var ensureJoleculePreProcessing = function(){
        if(checkJoleculePreProcessingFiles()){
            console.log("PreProcessing Files Found");
            return Promise.resolve();
        }else{
            console.log("PreProcessing Files Not Found");
            return runJoleculePreProcessing()
                .then(function(){
                    if(checkJoleculePreProcessingFiles()){
                        console.log("PreProcessing Files Found");
                        return;                        
                    }else{
                        throw("PreProcessing succeeded but PreProcessingFiles not generated");
                    }
                })
                .catch(function(err){throw("Failed to PreProcess map files due to the following error: " + err)});
        }
    };

    var runJoleculePreProcessing = function(){
        return runScriptAsync(PREPROCESSING_SCRIPT,[ "-u", ENERGY_CUTOFF,"-s", SPACIAL_CUTOFF, pdbName],{cwd:"./public/maps/"+pdbName});
    };

    var checkJoleculeStaticFile = function(){
        var localFilePath = './public/maps/' +pdbName + '/' +pdbName + '-jol/index.html';  
        return fs.existsSync(localFilePath);
    };

    var ensureJoleculeStatic = function(){
        console.log("Checking for Static file");
        if(checkJoleculeStaticFile()){
            console.log("Static files found");
            return Promise.resolve();
        }else{
            console.log("Static files not found");
            return runJoleculeStatic()
                .then(function(){
                        if(checkJoleculeStaticFile()){
                            console.log("Static files found");
                            return ;
                        }else{
                            throw("Static script succeeded but Static File not generated");
                        }
                })
                .catch(function(err){throw("Failed to Build Jolecule Data_Server due to the following error: " + err)});
        }
    };

    var runJoleculeStatic = function (){
        console.log("Run jol-static");

        var scriptArguments = [];
        scriptArguments.push(pdbName+".pdb");
        scriptArguments = scriptArguments.concat(NOBLE_GAS_SYMBOLS.map(function(nobleGas){return pdbName+"."+nobleGas+".pdb"}));
        return  runScriptAsync(JOL_STATIC_SCRIPT,scriptArguments,{cwd:"./public/maps/"+pdbName});
    };

    var runScriptAsync = function (scriptPath,args,options){
        return new Promise(function(resolve,reject){
            runScript(scriptPath,args,options, resolve,reject);
        });
    };

    var runScript = function (scriptPath,args,options, success, fail) {

        // keep track of whether callback has been invoked to prevent multiple invocations
        var invoked = false;

        var process = childProcess.fork(scriptPath,args,options);

        // listen for errors as they may prevent the exit event from firing
        process.on('error', function (err) {
            if (invoked) return;
            invoked = true;            
            fail(err);
        });

        // execute the callback once the process has finished running
        process.on('exit', function (code) {
            if (invoked) return;
            invoked = true;
            var err = code === 0 ? null : new Error('exit code ' + code);
            if(err){                
                fail(err);
            }else{
                console.log(scriptPath ,args,options, "Succeeded");
                success();
            }
        });

    };
    
    return exports;
    
}